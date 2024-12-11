from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from django.contrib.auth import authenticate
from .serializers import *
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth import login
from rest_framework import status
from django.shortcuts import render,get_object_or_404
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAdminUser
from .models import LotteryEvent
from .serializers import LotteryEventSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.sessions.models import Session
import json
from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from datetime import datetime
from django.utils.timezone import now
from django.db.models import Sum
from user_registration.models import *


class api_dashboard_preview_admin_view(APIView):
    def get(self, request, *args, **kwargs):
        try:
            admin_profile = adminProfile.objects.get(user=request.user)
            role_specific_dashboard_preview = admin_profile.dashboard_preview.all()
        except adminProfile.DoesNotExist:
            return Response({"error": "Admin profile not found"}, status=404)

        # Prepare data for cards and tables
        total_users = UserProfile.objects.count()
        verified_users = UserProfile.objects.filter(is_verified=True).count()
        pending_kyc = UserProfile.objects.filter(kyc_status='pending').count()

        # Fetching ticket sales and transaction data (similar to your friend's code)
        today = now().date()
        transactions = TicketTransaction.objects.filter(transaction_date__date=today, is_successful=True)

        total_tickets_sold = transactions.aggregate(Sum('tickets_sold'))['tickets_sold__sum'] or 0
        total_transaction_amount = transactions.aggregate(Sum('total_amount'))['total_amount__sum'] or 0


        # Example data for the table
        users_table = UserProfile.objects.values('user__username', 'user__email', 'kyc_status')

        data = {
            "total_users": total_users,
            "verified_users": verified_users,
            "pending_kyc": pending_kyc,
            "total_tickets_sold": total_tickets_sold,
            "total_transaction_amount": total_transaction_amount,
        }

        # Tabs from admin profile with type
        admin_dashboard_preview = role_specific_dashboard_preview.values('name', 'identifier', 'type')

        # Add table data dynamically if type is "table"
        rates = ConversionRate.objects.values('card_type', 'region', 'rate','is_physical')
        table_data = {
            "users_table": list(users_table),
            "conversion_rate": list(rates),
        }

        return Response({
            "data": data,
            "tabs": list(admin_dashboard_preview),
            "table_data": table_data
        })


class api_navbar_access_tabsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = adminProfile.objects.get(user=request.user)
            if profile.role == 'admin':
                #tabs = AdminTab.objects.all()  # Show all tabs for admins
                navbar_access_tabs = profile.navbar_access.all()
            else:
                navbar_access_tabs = profile.navbar_access.all()  # Role-specific tabs
            serializer = admin_navbar_accessSerializer(navbar_access_tabs, many=True)
            return Response(serializer.data)
        except adminProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404) 
 
         
class api_admin_signup(generics.CreateAPIView):
    serializer_class = api_admin_signup_Serializer

    def create(self, request, *args, **kwargs):
        try:
            # Get serializer instance with the request data
            serializer = self.get_serializer(data=request.data)

            # Validate the data
            if serializer.is_valid():
                # Save the user if the data is valid
                user = serializer.save()
                return Response({
                    "message": "Admin registration successful.",
                    "admin_id": user.id
                }, status=status.HTTP_201_CREATED)
            else:
                # If serializer validation fails
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Catch any unexpected exception
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class api_admin_login(APIView):
    serializer_class = api_admin_signup_Serializer
    @csrf_exempt
    def post(self, request):
        try:
            serializer = api_admin_login_Serializer(data=request.data)
            
            # Validate the serializer
            if serializer.is_valid():
                admin_email = serializer.validated_data['admin_email']
                admin_password = serializer.validated_data['admin_password']
                
                # Get the user model
                User = get_user_model()
                
                # Attempt a case-insensitive search for the email
                try:
                    user = User.objects.get(email__iexact=admin_email)
                except User.DoesNotExist:
                    user = None
                
                # Authenticate the user by manually checking the password
                if user and check_password(admin_password, user.password):
                    # Check if the user has an associated admin profile and a role
                    admin_profile = getattr(user, 'adminprofile', None)
                    
                    if admin_profile and not admin_profile.role:
                        # User has no role assigned
                        return Response(
                            {"success": False, "message": "Your access process is not verified."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # If the user has a role, then check if they have the staff status
                    if user.is_staff:
                        login(request, user)
                        return Response(
                            {"success": True, "message": "Admin login successful."},
                            status=status.HTTP_200_OK
                        )
                    else:
                        return Response(
                            {"success": False, "message": "Insufficient permissions."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    return Response(
                        {"success": False, "message": "Incorrect email or password."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # If serializer validation fails
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            # Catch any unexpected exceptions and return an internal server error
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class api_get_lottery_events(APIView):
    

    def get(self, request):
        try:
            user_agent = request.headers.get('User-Agent', '')
            if not user_agent or 'Mozilla' not in user_agent:
                return Response(
                    {"detail": "Access denied. This endpoint is restricted to browsers only."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Fetch all lottery events from the database
            lottery_events = LotteryEvent.objects.all()
            
            
            favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
            
            # Serialize the data
            serializer = LotteryEventSerializer(lottery_events, many=True)
            
            
            events_data = serializer.data
            for event in events_data:
                event['is_favorite'] = event['slug'] in favorites_slugs

            
            # Return the serialized data as JSON
            return Response(events_data, status=status.HTTP_200_OK)
        except Exception as e:
            # Catch any exceptions and return a 500 Internal Server Error with the exception message
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class api_lottery_events_add(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = LotteryEventSerializer

    def post(self, request):
        try:
            serializer = LotteryEventSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
  
class api_edit_delete_lottery_events(APIView):
    serializer_class = LotteryEventSerializer
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        serializer = LotteryEventSerializer(event)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handling update logic
        try:
            serializer = LotteryEventSerializer(event, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            lottery_event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            lottery_event.delete()
            return Response({"message": "Lottery event deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    print(request.data);
    event_slug = request.data.get('event_slug')
    quantity = int(request.data.get('quantity', 1))  

    if not event_slug:
        return Response({"success": False, "message": "Event ID is required."}, status=400)

    try:
        event = LotteryEvent.objects.get(slug=event_slug)
        max_limit = event.max_limit
        event_title = event.title

        
        cart = json.loads(request.COOKIES.get('cart', '{}'))

        
        current_quantity = int(cart.get(event_slug, {}).get('quantity', 0))
        new_total_quantity = current_quantity + quantity

    
        if new_total_quantity > max_limit:
            remaining_quantity = max_limit - current_quantity
            return Response({
                "success": False,
                "message": (
                    f"Cannot add {quantity} tickets for '{event_title}'. Only {remaining_quantity} more tickets "
                    f"can be added. Current quantity in cart: {current_quantity}. Max limit is {max_limit}."
                ),
                "event_title": event_title,
                "current_quantity": current_quantity,
                "remaining_quantity": remaining_quantity,
                "max_limit": max_limit
            }, status=400)

        
        cart[event_slug] = {
            "title": event_title,
            "per_ticket_price": str(event.per_ticket_price),
            "quantity": new_total_quantity, 
            "image": event.image.url if event.image else None,
            "max_limit": max_limit
        }

        
        response = JsonResponse({
            "success": True,
            "message": (
                f"'{event_title}' added to cart. {quantity} tickets successfully added. "
                f"Current quantity in cart: {new_total_quantity}."
            ),
            "event_title": event_title,
            "tickets_added": quantity,
            "current_quantity": new_total_quantity
        })
        response.set_cookie('cart', json.dumps(cart), max_age=60 * 60 * 24 * 30)  
        return response

    except LotteryEvent.DoesNotExist:
        return Response({"success": False, "message": "Event not found."}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart(request):
    
    cart = json.loads(request.COOKIES.get('cart', '{}'))
    print("Original cart from cookies:", cart)
    updated_cart = {}

    
    for event_slug, item in cart.items():
        try:
            event = LotteryEvent.objects.get(slug=event_slug)
            print(f"Processing event: {event_slug}, Draw date: {event.draw_date}")
            if event.draw_date > now():
                updated_cart[event_slug] = item  # Include valid events
                print(f"Event {event_slug} is valid and included in the updated cart.")
            else:
                print(f"Event {event_slug} is expired and removed from the cart.")
        except LotteryEvent.DoesNotExist:
            print(f"Event {event_slug} does not exist and is removed from the cart.")

    print("Updated cart after filtering expired events:", updated_cart)

    
    response = Response(updated_cart)

    
    response.set_cookie(
        'cart',
        json.dumps(updated_cart),
        max_age=7 * 24 * 60 * 60,  
        httponly=True,  
        secure=False,   
        
    )
    print("Cart cookie updated with:", json.dumps(updated_cart))
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def remove_from_cart(request):
    print(request.data);
    event_slug = request.data.get('event_slug')

    if not event_slug:
        return Response({"success": False, "message": "Event ID is required."}, status=400)

    cart = json.loads(request.COOKIES.get('cart', '{}'))
    if event_slug in cart:
        del cart[event_slug]

        
        response = JsonResponse({"success": True, "message": "Item removed from cart."})
        response.set_cookie('cart', json.dumps(cart), max_age=60*60*24*30)  
        return response

    return Response({"success": False, "message": "Item not found in cart."}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def update_cart(request):
    print(request.data);
    event_slug = request.data.get('event_slug')
    quantity = int(request.data.get('quantity', 1))

    cart = json.loads(request.COOKIES.get('cart', '{}'))

    if event_slug in cart:
        max_limit = cart[event_slug].get('max_limit', 1)
        if quantity <= max_limit:
            cart[event_slug]['quantity'] = quantity

            response = JsonResponse({"success": True, "message": "Cart updated."})
            response.set_cookie('cart', json.dumps(cart), max_age=60*60*24*30)  
            return response

    return Response({"success": False, "message": "Failed to update cart."}, status=400)


class LotteryDetail(APIView):
    serializer_class = LotteryEventSerializer   
    def get(self, request, slug, format=None):
        event = get_object_or_404(LotteryEvent, slug=slug)
        serializer = LotteryEventSerializer(event)
        return Response(serializer.data)
        

@api_view(['GET'])
@permission_classes([AllowAny])
def get_favorites(request):
    
    favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
    print("Favorites slugs from cookies:", favorites_slugs)
    
    events = LotteryEvent.objects.filter(slug__in=favorites_slugs, draw_date__gt=now())
    print("Filtered active events:", events)
    
    favorite_events = []
    for event in events:
        event_data = {
            'slug': event.slug,
            'title': event.title,
            'description': event.description,
            'price': str(event.price),
            'per_ticket_price': str(event.per_ticket_price),
            'sold_percentage': event.sold_percentage,
            'draw_date': event.draw_date,
            'image': event.image.url if event.image else None,
            'enter_now_button': f"/lottery_detail/{event.slug}/",
            'is_favorite': True  
        }
        favorite_events.append(event_data)
        print("Event data added to favorites:", event_data)
    
    response = Response({"favorites": favorite_events})
    updated_slugs = [event['slug'] for event in favorite_events]
    print("Updated favorites slugs for cookies:", updated_slugs)
    response.set_cookie('favorites', json.dumps(updated_slugs),max_age=7 * 24 * 60 * 60,  
        httponly=True,  
        secure=False, )
    print("Final response data:", favorite_events)
    print("favorite cookie updated with:", json.dumps(updated_slugs))
    return response

   
@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_favorites(request):
    print(request.data);
    event_slug = request.data.get('event_slug')

    if not event_slug:
        return Response({"success": False, "message": "Event ID is required."}, status=400)

    
    favorites = json.loads(request.COOKIES.get('favorites', '[]'))
    print(f"Current favorites before update: {favorites}")  
    if event_slug in favorites:
        
        favorites.remove(event_slug)
        message = "Removed from favorites."
    else:
        
        favorites.append(event_slug)
        message = "Added to favorites."
    print(f"Updated favorites: {favorites}")  

    
    response = JsonResponse({"success": True, "message": message})
    response.set_cookie('favorites', json.dumps(favorites), max_age=60 * 60 * 24 * 30) 
    return response
         