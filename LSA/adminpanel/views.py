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
from .serializers import ContactSerializer
from rest_framework.authentication import TokenAuthentication
from django.core.mail import send_mail
from .models import Contact
from .serializers import AdminReplySerializer
from django.db.models import Max
from user_registration.serializers import *
from .models import LotteryCategory
from .serializers import LotteryCategorySerializer
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from django.core.mail import EmailMessage
from rest_framework.exceptions import APIException
from .models import Previous_Winner_img
from .serializers import PreviousWinnerimgSerializer
from datetime import timedelta
from django.db import DatabaseError
from rest_framework.serializers import Serializer

class ChatMessagesView(APIView):
    def get(self, request, email):
        contact_messages = Contact.objects.filter(email=email).order_by('created_at')
        admin_replies = AdminReply.objects.filter(contact__email=email).order_by('created_at')

        # Combine user messages and admin replies
        chat_data = []
        for contact in contact_messages:
            chat_data.append({
                'type': 'user',
                'message': contact.description,
                'file':  contact.file.url if contact.file else None,
                'starred':contact.starred,
                'created_at': contact.created_at
            })

        for reply in admin_replies:
            chat_data.append({
                'id': reply.id,
                'type': 'admin',
                'message': reply.reply_message,
                'file': reply.file.url if reply.file else None,
                'created_at': reply.created_at
            })

        # Sort by creation time
        chat_data = sorted(chat_data, key=lambda x: x['created_at'])

        return Response(chat_data, status=status.HTTP_200_OK)

   
class AdminReplyView(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        email = request.data.get('email')
        reply_message = request.data.get('message', '').strip()
        file = request.FILES.get('file')

        # Backend validation: Check if both reply_message and file are empty
        if not reply_message and not file:
            return Response(
                {'error': 'Reply message or file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Fetch the most recent contact message for the email
            contact = (
                Contact.objects.filter(email=email)
                .order_by('-created_at')
                .first()
            )

            if not contact:
                return Response(
                    {'error': f"No contact message found for email: {email}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Save the reply in the database
            reply = AdminReply.objects.create(
                contact=contact,
                reply_message=reply_message,
                file=file
            )

            # Prepare the file URL if a file is uploaded
            file_url = request.build_absolute_uri(reply.file.url) if reply.file else None

            # Construct the email body (HTML format)
            email_body = (
                f"<p>Hi {contact.name},</p>"
                f"<p>We received your message</p>"
                f"<blockquote>{contact.description}</blockquote>"
                f"<p>Here is our reply:</p>"
                f"<blockquote>{reply_message or ''}</blockquote>"
            )

            if file_url:
                email_body += f'<p>Please find the file here: <a href="{file_url}" target="_blank" style="color: #1a73e8; text-decoration: none;">View File</a></p>'

            email_body += "<p>Best Regards,<br>Admin Team</p>"

            # Send the email
            email_message = EmailMessage(
                subject="Reply from Admin",
                body=email_body,
                from_email='your-email@gmail.com',
                to=[email]
            )
            email_message.content_subtype = "html"  # Set content type to HTML
            email_message.send(fail_silently=False)

            return Response({'message': 'Reply sent successfully!'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f"Failed to send reply: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class ContactListView(APIView):
    def get(self, request):
        from collections import defaultdict

        grouped_contacts = defaultdict(list)
        contacts = Contact.objects.all().order_by('-starred', '-created_at')  # Order by starred first, then created_at
        for contact in contacts:
            grouped_contacts[contact.email].append({
                "name": contact.name,
                "email": contact.email,
                "description": contact.description,
                "created_at": contact.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                "starred": contact.starred,
            })
        
        return Response(grouped_contacts)
    
    def post(self, request):
        email = request.data.get('email')
        starred = request.data.get('starred', False)

        contacts = Contact.objects.filter(email=email)  # Get all records with the same email
        if contacts.exists():
            contacts.update(starred=starred)  # Update all matching records
            return Response({"success": True, "message": "Starred status updated for all records."})
        
        return Response({"success": False, "message": "No records found for this email."}, status=404)

class UserChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch chats for the logged-in user
        user_email = request.user.email
        contacts = Contact.objects.filter(email=user_email).order_by('created_at')
        admin_replies = AdminReply.objects.filter(contact__email=user_email).order_by('created_at')

        # Combine user messages and admin replies
        chat_data = []
        for contact in contacts:
            chat_data.append({
                'type': 'user',
                'message': contact.description,
                'file': contact.file.url if contact.file else None,
                'created_at': contact.created_at,
            })

        for reply in admin_replies:
            chat_data.append({
                'type': 'admin',
                'message': reply.reply_message,
                'file': reply.file.url if reply.file else None,
                'created_at': reply.created_at,
            })

        # Sort by creation time
        chat_data = sorted(chat_data, key=lambda x: x['created_at'])

        return Response(chat_data, status=status.HTTP_200_OK)


    def post(self, request):
        # Handle user message or file upload
        user_email = request.user.email
        message = request.data.get('message', '').strip()
        file = request.FILES.get('file')  # Get the file

        if not message and not file:
            return Response(
                {'error': 'Message or file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save the message or file to the database
        contact = Contact.objects.create(
            name=request.user.username,
            email=user_email,
            description=message,
            file=file,  # Save the uploaded file
            created_at=now()
        )

        return Response({'message': 'Message sent successfully!'}, status=status.HTTP_201_CREATED)


class DeleteContactView(APIView):
    authentication_classes = [TokenAuthentication]

    def delete(self, request, email):
        try:
            # Fetch the contact by email
            contact = Contact.objects.filter(email=email)

            if not contact.exists():
                return Response(
                    {'error': f"No contact found for email: {email}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Delete associated AdminReply and files
            admin_replies = AdminReply.objects.filter(contact__email=email)
            for reply in admin_replies:
                if reply.file:
                    reply.file.delete()  # Delete the file from the storage
                reply.delete()

            # Delete the contact
            contact.delete()

            return Response(
                {'message': f"Contact and all associated data for email {email} have been deleted successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {'error': f"Failed to delete contact: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class EditdeleteAdminReplyView(APIView):
    def put(self, request, reply_id):
        try:
            admin_reply = AdminReply.objects.get(id=reply_id)
        except AdminReply.DoesNotExist:
            return Response({'error': 'Reply not found.'}, status=status.HTTP_404_NOT_FOUND)

        reply_message = request.data.get('reply_message', admin_reply.reply_message)
        file = request.FILES.get('file', admin_reply.file)

        admin_reply.reply_message = reply_message
        if file:
            admin_reply.file = file
        admin_reply.save()

        return Response({'message': 'Reply updated successfully.'}, status=status.HTTP_200_OK)
    
    def delete(self, request, reply_id):
        try:
            admin_reply = AdminReply.objects.get(id=reply_id)
        except AdminReply.DoesNotExist:
            return Response({'error': 'Reply not found.'}, status=status.HTTP_404_NOT_FOUND)

        admin_reply.delete()
        return Response({'message': 'Reply deleted successfully.'}, status=status.HTTP_200_OK) 
    


class UserProfileDeleteAPIView(APIView):
    def delete(self, request, user_id):
        try:
            # Find the user by ID
            user = User.objects.get(id=user_id)
            user.delete()  # This will also delete the related UserProfile due to CASCADE
            return Response({"message": "User and related profile deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class api_dashboard_preview_admin_view(APIView):
    def get(self, request, *args, **kwargs):
        try:
            admin_profile = adminProfile.objects.get(user=request.user)
            role_specific_dashboard_preview = admin_profile.dashboard_preview.all()
        except adminProfile.DoesNotExist:
            return Response({"error": "Admin profile not found"}, status=404)

        # Prepare data for cards and tables
        total_users = UserProfile.objects.count()
        verified_users = UserProfile.objects.filter(kyc_status='verified').count()
        pending_kyc = UserProfile.objects.filter(kyc_status='pending').count()

        # Fetching ticket sales and transaction data
        today = now().date()
        transactions = TicketTransaction.objects.filter(transaction_date__date=today, is_successful=True)

        total_tickets_sold = transactions.aggregate(Sum('tickets_sold'))['tickets_sold__sum'] or 0
        total_transaction_amount = transactions.aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # Fetch User Profiles and include kyc_image_url
        user_profiles = UserProfile.objects.all()
        users_table = []
        for profile in user_profiles:
            serializer = UserKycwaitingDetailsSerializer(profile)
            users_table.append(serializer.data)

        # Prepare additional data
        data = {
            "total_users": total_users,
            "verified_users": verified_users,
            "pending_kyc": pending_kyc,
            "total_tickets_sold": total_tickets_sold,
            "total_transaction_amount": total_transaction_amount,
        }

        # Tabs from admin profile with type
        admin_dashboard_preview = role_specific_dashboard_preview.values('name', 'identifier', 'type')

        # Example data for conversion rates
        rates = ConversionRate.objects.values('card_type', 'region', 'rate', 'is_physical')
        table_data = {
            "users_table": users_table,
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
                    # Check the role of the user
                    admin_profile = getattr(user, 'adminprofile', None)
                    
                    if admin_profile and not admin_profile.role:
                        # User has no role assigned
                        return Response(
                            {"success": False, "message": "Your access process is not verified."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Handle admin and sales roles
                    if admin_profile.role == 'admin' and user.is_staff:
                        backend = 'django.contrib.auth.backends.ModelBackend'
                        user.backend = backend
                        login(request, user, backend=backend)
                        return Response(
                            {"success": True, "message": "Admin login successful."},
                            status=status.HTTP_200_OK
                        )
                    elif admin_profile.role == 'sales':
                        backend = 'django.contrib.auth.backends.ModelBackend'
                        user.backend = backend
                        login(request, user, backend=backend)
                        return Response(
                            {"success": True, "message": "Sales login successful."},
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
            serializer = LotteryEventSerializeradd_get(lottery_events, many=True)
            
            
            events_data = serializer.data
            for event in events_data:
                event['is_favorite'] = event['slug'] in favorites_slugs

            
            # Return the serialized data as JSON
            return Response(events_data, status=status.HTTP_200_OK)
        except Exception as e:
            # Catch any exceptions and return a 500 Internal Server Error with the exception message
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIGetCategoryLotteryEvents(APIView):
    def get(self, request, category_id):
        try:
            category = LotteryCategory.objects.get(id=category_id)
            events = LotteryEvent.objects.filter(category=category, is_active=True)
            favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
            serializer = LotteryEventSerializeradd_get(events, many=True)
            events_data = serializer.data
            for event in events_data:
                event['is_favorite'] = event['slug'] in favorites_slugs
            return Response(events_data, status=status.HTTP_200_OK)
        except LotteryCategory.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class api_lottery_events_add(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = LotteryEventSerializer

    def post(self, request):
        try:
            # Deserialize and validate main LotteryEvent data
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                # Save the main LotteryEvent instance
                lottery_event = serializer.save()

                # Handle additional images (if provided)
                additional_images = request.FILES.getlist('additional_images')
                for image in additional_images:
                    LotteryEventImages.objects.create(lottery_event=lottery_event, image=image)

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            # Return validation errors for main serializer
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

 
class api_edit_delete_lottery_events(APIView):
    serializer_class = LotteryEventSerializeradd_get
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Include additional images if applicable
        additional_images = event.additional_images.all()  # Assuming a related name 'additional_images'
        images = [{"id": img.id, "url": img.image.url} for img in additional_images]

        serializer = LotteryEventSerializeradd_get(event)
        data = serializer.data
        data['additional_images'] = images  # Append additional images to the response
        return Response(data)

    def put(self, request, pk):
        try:
            event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        # Update the main event fields
        event_serializer = LotteryEventSerializer(event, data=request.data,partial=True)
        if event_serializer.is_valid():
            event_serializer.save()

            # Handle additional images
            additional_images = request.FILES.getlist('additional_images[]')
            if additional_images:
                for image in additional_images:
                    LotteryEventImages.objects.create(lottery_event=event, image=image)

            return Response(event_serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(event_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
  
class DeleteLotteryEventImageView(APIView):
    def delete(self, request, event_id, image_id):
        # Get the event
        lottery_event = get_object_or_404(LotteryEvent, id=event_id)
        
        # Get the specific image to delete
        lottery_event_image = get_object_or_404(LotteryEventImages, id=image_id, lottery_event=lottery_event)

        try:
            # Delete the image from the database and the file system
            lottery_event_image.delete()

            return Response(
                {"message": "Additional image deleted successfully."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



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

class ContactCreateView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ContactSerializer(data=request.data)
        if serializer.is_valid():
            # Save the form data
            contact = serializer.save()

            # Send an auto-response email
            try:
                send_mail(
                    subject="Thank You for Contacting Us",  # Email subject
                    message=f"Hi {contact.name},\n\n"
                            f"Thank you for reaching out! We have received your message:\n\n"
                            f"\"{contact.description}\"\n\n"
                            "Our team will get back to you shortly.\n\n"
                            "Best Regards,\n"
                            "Team Win 4all",  # Email body
                    from_email='your-email@gmail.com',  # Replace with your email
                    recipient_list=[contact.email],  # Send to the user's email
                    fail_silently=False,
                )
            except Exception as e:
                return Response(
                    {'message': 'Form submitted, but email failed to send.', 'error': str(e)},
                    status=status.HTTP_201_CREATED
                )

            return Response(
                {'message': 'Form submitted successfully!please check you email inbox.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetLotteryCategories(APIView):
    def get(self, request):
        categories = LotteryCategory.objects.all()
        serializer = LotteryCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BannerView(APIView):
    def get(self, request):
        try:
            banner = Banner.objects.last()  # Fetch the latest banner
            if banner:
                serializer = BannerSerializer(banner)
                return Response(serializer.data)
            return Response({"error": "No banner available"}, status=status.HTTP_404_NOT_FOUND)
        except DatabaseError as db_error:
            return Response({"error": "Database error occurred", "details": str(db_error)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Serializer.DoesNotExist:
            return Response({"error": "Serialization error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": "An unexpected error occurred", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PreviousWinnersimgAPIView(APIView):
    def get(self, request):
        try:
            winners = Previous_Winner_img.objects.all()
            serializer = PreviousWinnerimgSerializer(winners, many=True)
            return Response({'winners': serializer.data}, status=status.HTTP_200_OK)
        except Previous_Winner_img.DoesNotExist:
            return Response({'error': 'No winners found.'}, status=status.HTTP_404_NOT_FOUND)
        except APIException as api_error:
            return Response({'error': str(api_error)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': 'An unexpected error occurred: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LotteryStatisticsView(APIView):
    def get(self, request):
        month = int(request.query_params.get('month', 0))
        year = int(request.query_params.get('year', 0))

        total_users = UserProfile.objects.count()

        # Fetch active users based on your logic
        active_users = UserProfile.objects.filter(
            user__last_login__year=year,
            user__last_login__month=month
        ).count()

        # Fetch lottery statistics for the specified month and year
        stats = LotteryStatistics.objects.filter(month=month, year=year).first()
        if stats:
            stats_data = LotteryStatisticsSerializer(stats).data
            stats_data['active_users'] = active_users
            stats_data['total_users'] = total_users
            return Response(stats_data)
        else:
            return Response({
                'message': 'No data found for the selected month and year.',
                'active_users': active_users,
                'total_users': total_users,
                'won_lottery': 0,
                'lost_lottery': 0,
                'won_percentage': 0,
                'current_won_percentage': 0,
                'lost_percentage': 0
            })


class lottery_sales_availableYearsView(APIView):
    def get(self, request):
        years = lottery_sales_bar_chart.objects.values_list('year', flat=True).distinct().order_by('year')
        return Response({'years': list(years)})


class lottery_sales_bar_chart_View(APIView):
    def get(self, request):
        year = int(request.query_params.get('year', 2025))  # Default to 2025 if not provided
        data = lottery_sales_bar_chart.objects.filter(year=year).order_by('id')
        response = [
            {
                'month': activity.month,
                'activity_count': activity.activity_count
            } for activity in data
        ]
        return Response(response)


class LeaderboardAPIView(APIView):
    def get(self, request):
        leaderboard = Leaderboard.objects.order_by('rank')  # Order by rank
        serializer = LeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


@api_view(['GET'])
def user_statistics(request):
    # Calculate total and verified users
    total_users = UserProfile.objects.count()
    
    today = now()
    start_of_week = today - timedelta(days=today.weekday())

    # Count users linked to UserProfile who logged in this week
    month = int(1)
    year = int(2025)

            # Filter for active users
    active_users = UserProfile.objects.filter(
                user__last_login__year=year,
                user__last_login__month=month
            ).count()
    logged_in_this_week = UserProfile.objects.filter(
        user__last_login__gte=start_of_week
    ).count()
    print(active_users)
    logged_in_this_week_profiles = UserProfile.objects.filter(
        user__last_login__gte=start_of_week
    )
    logged_in_this_week_names = [profile.user.username for profile in logged_in_this_week_profiles]


    return Response({
        'total_users': total_users,
        'active_users':logged_in_this_week,
        'logged_in_this_week_names': active_users,
        
    })    