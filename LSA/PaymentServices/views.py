from django.shortcuts import render
import json
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from datetime import datetime, timedelta
from collections import defaultdict
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PaymentLottery
from .serializers import PaymentLotterySerializer
from django.utils import timezone
from datetime import timedelta
import stripe
from django.conf import settings
from adminpanel.models import LotteryEvent
from django.views.decorators.csrf import csrf_exempt


def check_user_authentication(request):
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required", "redirect_url": "/login/"}, status=401)
    
    try:
        
        user = User.objects.get(id=request.user.id)
        return JsonResponse({"message": "User is authenticated", "user_id": user.id}, status=200)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found", "redirect_url": "/login/"}, status=404)
    

stripe.api_key = settings.STRIPE_API_KEY


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required", "redirect_url": "/login/"}, status=401)
    user = request.user
    cart = request.data.get("cart")  

    if not cart:
        return Response({"error": "Cart is empty"}, status=400)

    line_items = []
    for slug, quantity in cart.items():
        event = get_object_or_404(LotteryEvent, slug=slug)
        line_items.append({
            "price_data": {
                "currency": "gbp",
                "product_data": {"name": event.title},
                "unit_amount": int(event.per_ticket_price * 100),
            },
            "quantity": quantity,
        })

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=f"{settings.DOMAIN}/success/",
        cancel_url=f"{settings.DOMAIN}/cancel/",
        customer_email=user.email,
    )

    return Response({"checkout_url": session.url})


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = settings.WEBHOOK_ENDPOINT_SECRET
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return JsonResponse({"error": "Invalid webhook signature"}, status=400)
   
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_email")
        stripe_session_id = session.get("id")
        payment_intent = session.get("payment_intent")
        
        
        payment_intent_extracted = payment_intent.partition("_")[2] if "_" in payment_intent else payment_intent
        
        user = User.objects.get(email=customer_email)
        
        
        line_items = stripe.checkout.Session.list_line_items(stripe_session_id)

        for item in line_items["data"]:
            event_title = item["description"]
            quantity = item["quantity"]
            amount = item["amount_total"] / 100


            event = LotteryEvent.objects.get(title=event_title)

            PaymentLottery.objects.create(
                user=user,
                lottery_event=event,
                quantity=quantity,
                amount=amount,
                payment_status='completed',
                stripe_session_id=stripe_session_id,
                payment_at=timezone.now(), 
                #payment_intent=payment_intent,
                payment_intent=payment_intent_extracted,
            )

            
            event.sold_tickets += quantity
            event.save()
         
        return JsonResponse({"message": "Payment processed successfully"}, status=200)
        
    
    return JsonResponse({"message": "Unhandled event"}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_order_api(request):
    
    filter_value = request.GET.get("filter", "all")

    date_filters = {
    "1month": timezone.now() - timedelta(days=30),
    "6month": timezone.now() - timedelta(days=180),
    "1year": timezone.now() - timedelta(days=365),
    "all": None
}

    filter_date = date_filters.get(filter_value, None)

    user_payments = PaymentLottery.objects.filter(user=request.user).order_by('-payment_at')
    if filter_date:
        user_payments = user_payments.filter(payment_at__gte=filter_date)

    grouped_payments = defaultdict(lambda: {
        "payment_id": None, 
        "payments": [], 
        "total_amount": 0, 
        "payment_at": None, 
        "payment_status": None
    })

    for payment in user_payments:
        session_id = payment.stripe_session_id
        if grouped_payments[session_id]["payment_id"] is None:
            grouped_payments[session_id]["payment_id"] = payment.payment_intent
            grouped_payments[session_id]["payment_at"] = payment.payment_at
            grouped_payments[session_id]["payment_status"] = payment.payment_status

        grouped_payments[session_id]["payments"].append(PaymentLotterySerializer(payment).data)
        grouped_payments[session_id]["total_amount"] += float(payment.amount)

    return Response(grouped_payments, status=status.HTTP_200_OK)

