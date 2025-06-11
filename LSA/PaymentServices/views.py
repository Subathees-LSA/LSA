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
from django.db import transaction
from .models import PaymentLottery, LotteryTicket
import random
from collections import defaultdict
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import PaymentLotterySerializer
from django.shortcuts import render
from adminpanel.models import Winner
def custom_404(request, exception):
    return render(request, '404.html', status=404)
#!-----cart.html-custom.js-function proceedToCheckout()-----!
def check_user_authentication(request):
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required", "redirect_url": "/login/"}, status=401)
    
    try:
        
        user = User.objects.get(id=request.user.id)
        return JsonResponse({"message": "User is authenticated", "user_id": user.id}, status=200)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found", "redirect_url": "/login/"}, status=404)
    

stripe.api_key = settings.STRIPE_API_KEY

#!-----cart.html---custom.js-function proceedToCheckout()-----!
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
        customer_email=user.email,
        customer_creation='always',
    )

    return Response({"checkout_url": session.url})


def generate_unique_tickets(count):
    
    with transaction.atomic():
        existing_tickets = set(LotteryTicket.objects.values_list("ticket_number", flat=True))
        new_tickets = set()

        while len(new_tickets) < count:
            ticket_number = f"{random.randint(100000, 999999)}"
            if ticket_number not in existing_tickets and ticket_number not in new_tickets:
                new_tickets.add(ticket_number)
                
    return list(new_tickets)

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

        user = User.objects.get(email=customer_email)
        line_items = stripe.checkout.Session.list_line_items(stripe_session_id)
        
        payment_intent_extracted = payment_intent.partition("_")[2] if "_" in payment_intent else payment_intent
        
        receipt_url = None
        try:
            payment_intent_obj = stripe.PaymentIntent.retrieve(payment_intent)
            latest_charge_id = payment_intent_obj.get("latest_charge")
            if latest_charge_id:
                charge = stripe.Charge.retrieve(latest_charge_id)
                receipt_url = charge.get("receipt_url")
        except Exception as e:
            print(f"Error retrieving receipt_url: {e}")

        with transaction.atomic():  
            for item in line_items["data"]:
                event_title = item["description"]
                quantity = item["quantity"]
                amount = item["amount_total"] / 100

                event = LotteryEvent.objects.select_for_update().get(title=event_title)

                payment_record = PaymentLottery.objects.create(
                    user=user,
                    lottery_event=event,
                    quantity=quantity,
                    amount=amount,
                    payment_status='completed',
                    stripe_session_id=stripe_session_id,
                    payment_at=timezone.now(),
                    payment_intent=payment_intent_extracted,
                    receipt_url=receipt_url,
                )

                event.sold_tickets += quantity
                
                
                if event.sold_tickets >= event.total_tickets:
                    event.is_active = False
                event.save()


                unique_ticket_numbers = generate_unique_tickets(quantity)
                tickets = [
                    LotteryTicket(user=user, lottery_event=event, payment=payment_record, ticket_number=ticket_number)
                    for ticket_number in unique_ticket_numbers
                ]
                LotteryTicket.objects.bulk_create(tickets)

        return JsonResponse({"message": "Payment processed successfully"}, status=200)

    return JsonResponse({"message": "Unhandled event"}, status=400)
#!-----myorder.html-custom.js-function fetchOrders()-----!
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
        "payment_status": None,
        "receipt_url": None,
        "user_email": request.user.email,  
        "user_name": request.user.username  
    })
    
    winning_tickets = Winner.objects.filter(user=request.user).values_list('ticket_number', flat=True)
    for payment in user_payments:
        session_id = payment.stripe_session_id
        if grouped_payments[session_id]["payment_id"] is None:
            grouped_payments[session_id]["payment_id"] = payment.payment_intent
            grouped_payments[session_id]["payment_at"] = payment.payment_at
            grouped_payments[session_id]["payment_status"] = payment.payment_status
            grouped_payments[session_id]["receipt_url"] = payment.receipt_url
        
        
        tickets = LotteryTicket.objects.filter(payment=payment).values_list('ticket_number', flat=True)
        
        payment_data = PaymentLotterySerializer(payment).data
        payment_data["ticket_numbers"] = list(tickets)  
        
        payment_data["winning_tickets"] = []
        for ticket in tickets:
            if ticket in winning_tickets:
                payment_data["winning_tickets"].append(ticket)
        grouped_payments[session_id]["payments"].append(payment_data)
        grouped_payments[session_id]["total_amount"] += float(payment.amount)

    return Response(grouped_payments, status=status.HTTP_200_OK)

