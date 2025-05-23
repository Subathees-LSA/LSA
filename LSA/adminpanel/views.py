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
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Subquery, OuterRef
from django.http import JsonResponse
from .models import Contact
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import LotteryStatistics
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime
import random
from .models import SocialLink
from django.shortcuts import render
from .models import Location
from PaymentServices.models import PaymentLottery
from django.db import models

@csrf_exempt
@api_view(['POST'])
def block_user(request):
    user_id = request.data.get('user_id')
    action = request.data.get('action')  # "block" or "unblock"

    try:
        user = User.objects.get(id=user_id)
        user_profile = user.userprofile
        
        if action == "block":
            user_profile.is_blocked = True
            message = f"User {user.username} has been blocked successfully."
        else:
            user_profile.is_blocked = False
            message = f"User {user.username} has been unblocked successfully."

        user_profile.save()
        return Response({"message": message}, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class ReportListView(generics.ListAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
class RegionalSalesListView(generics.ListAPIView):
    queryset = RegionalSales.objects.all()
    serializer_class = RegionalSalesSerializer


class LotterySummaryView(APIView):
    def get(self, request, *args, **kwargs):
        total_won_lottery = LotteryStatistics.objects.aggregate(won_total=Sum('won_lottery'))['won_total'] or 0
        total_lost_lottery = LotteryStatistics.objects.aggregate(lost_total=Sum('lost_lottery'))['lost_total'] or 0

        # Assuming €1 per lottery count
        total_won_amount = f"€{total_won_lottery / 1e6:.1f}"
        total_lost_amount = f"€{total_lost_lottery / 1e6:.1f}"
        year = datetime.now().year  

        # Filter users who logged in during the current year
        active_users = UserProfile.objects.filter(
            user__last_login__year=year
        ).count()
        current_time = timezone.now()
        now = timezone.now()
        ninety_days_ago = now - timedelta(days=90)

    

        # Users who have NOT logged in in the last 90 days
        inactive_users = UserProfile.objects.filter(
            user__last_login__lt=ninety_days_ago
        ).count()

        # Users created in the current month
        new_users_this_month = User.objects.filter(
            date_joined__year=now.year,
            date_joined__month=now.month
        ).count()

   
    
    # Filter active lottery events where draw_date is in the future
        active_lotteries = LotteryEvent.objects.filter(is_active=True, draw_date__gt=current_time).count()

        
        sales_amount = PaymentLottery.objects.aggregate(Sum('amount'))['amount__sum'] or 0    

        data = {
            "won_lottery_count": total_won_lottery,
            "won_lottery_amount": total_won_amount,
            "lost_lottery_count": total_lost_lottery,
            "lost_lottery_amount": total_lost_amount,
            "active_users": active_users,
            "active_lotteries": active_lotteries,
            "sales_amount":sales_amount,
            'inactive_users': inactive_users,
            'new_users_this_month': new_users_this_month,
        }
        return Response(data)
@api_view(['POST'])
def mark_messages_as_read(request, email):
    try:
        Contact.objects.filter(email=email).update(is_read=True)
        return Response({"status": "success", "message": "Messages marked as read"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)

def latest_unread_notifications(request):
    # Subquery to get the latest 'created_at' per email where 'is_read=False'
    latest_message_subquery = (
        Contact.objects
        .filter(email=OuterRef('email'), is_read=False)
        .order_by('-created_at')
        .values('id')[:1]  # Get the latest record for each email
    )

    # Main query to fetch contacts using the subquery, ordered by created_at (most recent first)
    latest_messages = (
        Contact.objects
        .filter(id__in=Subquery(latest_message_subquery))
        .order_by('-created_at')  # Order by the most recent messages
    )

    notifications = [
        {
            'email': message.email,
            'name': message.name,
            'description': message.description,
            'created_at': message.created_at,
        }
        for message in latest_messages
    ]

    return JsonResponse(notifications, safe=False)
    
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

        user_profiles = UserProfile.objects.all().order_by('is_blocked', '-user__date_joined')

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
        from django.conf import settings
        from django.db.models import F

        admin_dashboard_preview = role_specific_dashboard_preview.annotate(
            image_url=F('dashboard_preview_image')
        ).values('name', 'identifier', 'type', 'image_url')

        # Add this line to include full image URL
        for tab in admin_dashboard_preview:
            if tab["image_url"]:
                tab["image_url"] = request.build_absolute_uri(settings.MEDIA_URL + tab["image_url"])


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
                navbar_access_tabs = profile.navbar_access.all()  # Show all tabs for admins
            else:
                navbar_access_tabs = profile.navbar_access.all()  # Role-specific tabs

            serializer = admin_navbar_accessSerializer(navbar_access_tabs, many=True, context={'request': request})
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
            search_query = request.query_params.get('search', '').strip()
            category_id = request.query_params.get('category', '')
    
            # Fetch all lottery events from the database
            lottery_events = LotteryEvent.objects.all().order_by('-id')  # Latest by ID
             # Filter by search term if provided
            if search_query:
                lottery_events = lottery_events.filter(title__icontains=search_query)

            # Filter by category if provided
            if category_id:
                lottery_events = lottery_events.filter(category_id=category_id)
            
            
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
    event_slug = request.data.get('event_slug')
    quantity = int(request.data.get('quantity', 1))

    if not event_slug:
        return Response({"success": False, "message": "Event ID is required."}, status=400)

    try:
        event = LotteryEvent.objects.get(slug=event_slug)
        max_limit = event.max_limit
        stock_tickets = event.stock_tickets
        # The actual limit is the smaller of max_limit or stock_tickets
        actual_limit = min(max_limit, stock_tickets)
        event_title = event.title

        user = request.user if request.user.is_authenticated else None

        purchased_quantity = 0
        if user:
            purchased_quantity = PaymentLottery.objects.filter(
                user=user,
                lottery_event=event,
                payment_status='completed'
            ).aggregate(total_quantity=models.Sum('quantity'))['total_quantity'] or 0

        cart = json.loads(request.COOKIES.get('cart', '{}'))
        current_quantity = int(cart.get(event_slug, {}).get('quantity', 0))
        
        new_total_quantity = current_quantity + quantity
        
        remaining_tickets = actual_limit - purchased_quantity 
        
        if new_total_quantity > remaining_tickets:
            set_remaining_ticket=remaining_tickets-current_quantity
            if set_remaining_ticket < 0:
               set_remaining_ticket = 0  # Ensure 'a' is never negative
            return Response({
                "success": False,
                "message": (
                    f"max limit reached . only {set_remaining_ticket} remaining tickets can be added"
                    # f"Cannot add {quantity} tickets for '{event_title}'. Only {remaining_tickets} more tickets "
                    # f"can be added. Current quantity in cart: {current_quantity}. Max limit is {max_limit}."
                ),
                "event_title": event_title,
                "current_quantity": current_quantity,
                "remaining_tickets": set_remaining_ticket,
                "max_limit": actual_limit
            }, status=400)

        # Update cart
        cart[event_slug] = {
            "title": event_title,
            "per_ticket_price": str(event.per_ticket_price),
            "quantity": new_total_quantity,
            "image": event.image.url if event.image else None,
            "max_limit": actual_limit,
            "remaining_tickets": remaining_tickets - quantity  # Update remaining tickets
        }

        response = JsonResponse({
            "success": True,
            "message": (
                f"'{event_title}' added to cart. {quantity} tickets successfully added. "
                f"Current quantity in cart: {new_total_quantity}."
            ),
            "event_title": event_title,
            "tickets_added": quantity,
            "current_quantity": new_total_quantity,
            "remaining_tickets": actual_limit - purchased_quantity - new_total_quantity
        })
        response.set_cookie('cart', json.dumps(cart), max_age=60 * 60 * 24 * 30)
        return response

    except LotteryEvent.DoesNotExist:
        return Response({"success": False, "message": "Event not found."}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart(request):
    cart = json.loads(request.COOKIES.get('cart', '{}'))
    updated_cart = {}

    user = request.user if request.user.is_authenticated else None
    
    for event_slug, item in cart.items():
        try:
            event = LotteryEvent.objects.get(slug=event_slug,is_active=True)
            stock_tickets = event.stock_tickets
            actual_limit = min(event.max_limit, stock_tickets)
            
            if event.draw_date > timezone.now() and stock_tickets > 0:
                purchased_quantity = 0
                if user:
                    purchased_quantity = PaymentLottery.objects.filter(
                        user=user,
                        lottery_event=event,
                        payment_status='completed'
                    ).aggregate(total_quantity=models.Sum('quantity'))['total_quantity'] or 0

                if purchased_quantity >= actual_limit:
                    continue

                item['purchased_quantity'] = purchased_quantity
                item['max_limit'] = actual_limit
                updated_cart[event_slug] = item
        except LotteryEvent.DoesNotExist:
            pass

    response = Response(updated_cart)
    response.set_cookie('cart', json.dumps(updated_cart), max_age=7 * 24 * 60 * 60, httponly=True, secure=False)
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
    event_slug = request.data.get('event_slug')
    quantity = int(request.data.get('quantity', 1))

    if not event_slug:
        return Response({"success": False, "message": "Event slug is required."}, status=400)

    try:
        event = LotteryEvent.objects.get(slug=event_slug)
        max_limit = event.max_limit
        stock_tickets = event.stock_tickets
        actual_limit = min(max_limit, stock_tickets)

        # Check if user is logged in
        user = request.user if request.user.is_authenticated else None

        # Calculate total purchased tickets by the user for this event
        purchased_quantity = 0
        if user:
            purchased_quantity = PaymentLottery.objects.filter(
                user=user,
                lottery_event=event,
                payment_status='completed'
            ).aggregate(total_quantity=models.Sum('quantity'))['total_quantity'] or 0

        cart = json.loads(request.COOKIES.get('cart', '{}'))

        if event_slug in cart:
            current_quantity = int(cart[event_slug].get('quantity', 0))
            new_total_quantity = quantity

            if new_total_quantity + purchased_quantity > actual_limit:
                remaining_quantity = actual_limit - (new_total_quantity + purchased_quantity)
                return Response({
                    "success": False,
                    "message": (
                        f"Cannot update to {quantity} tickets for '{event.title}'. Only {remaining_quantity} more tickets "
                        f"can be added. Max limit is {actual_limit}."
                    ),
                    "event_title": event.title,
                    "current_quantity": current_quantity,
                    "remaining_quantity": remaining_quantity,
                    "max_limit": actual_limit
                }, status=400)

            cart[event_slug]['quantity'] = new_total_quantity

            response = JsonResponse({
                "success": True,
                "message": (
                    f"'{event.title}' updated in cart. {quantity} tickets successfully updated. "
                    f"Current quantity in cart: {new_total_quantity}."
                ),
                "event_title": event.title,
                "tickets_updated": quantity,
                "current_quantity": new_total_quantity
            })
            response.set_cookie('cart', json.dumps(cart), max_age=60 * 60 * 24 * 30)
            return response

        return Response({"success": False, "message": "Event not found in cart."}, status=404)

    except LotteryEvent.DoesNotExist:
        return Response({"success": False, "message": "Event not found."}, status=404)    



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
    
    events = LotteryEvent.objects.filter(slug__in=favorites_slugs, draw_date__gt=now(),is_active=True)
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
            'total_tickets':event.total_tickets, 
            'sold_tickets':event.sold_tickets,
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

# class ContactCreateView(APIView):
#     def post(self, request, *args, **kwargs):
#         serializer = ContactSerializer(data=request.data)
#         if serializer.is_valid():
#             # Save the form data
#             contact = serializer.save()

#             # Send an auto-response email
#             try:
#                 send_mail(
#                     subject="Thank You for Contacting Us",  # Email subject
#                     message=f"Hi {contact.name},\n\n"
#                             f"Thank you for reaching out! We have received your message:\n\n"
#                             f"\"{contact.description}\"\n\n"
#                             "Our team will get back to you shortly.\n\n"
#                             "Best Regards,\n"
#                             "Team Win 4all",  # Email body
#                     from_email='your-email@gmail.com',  # Replace with your email
#                     recipient_list=[contact.email],  # Send to the user's email
#                     fail_silently=False,
#                 )
#             except Exception as e:
#                 return Response(
#                     {'message': 'Form submitted, but email failed to send.', 'error': str(e)},
#                     status=status.HTTP_201_CREATED
#                 )

#             return Response(
#                 {'message': 'Form submitted successfully!Please check your email inbox.', 'data': serializer.data},
#                 status=status.HTTP_201_CREATED
#             )

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class ContactCreateView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ContactSerializer(data=request.data)
        if serializer.is_valid():
            # Save the form data
            contact = serializer.save()

            # Send an auto-response email
            try:
                send_mail(
                    subject="Thank You for Contacting Us",
                    message=f"Hi {contact.name},\n\n"
                            f"Thank you for reaching out! We have received your message:\n\n"
                            f"\"{contact.description}\"\n\n"
                            "Our team will get back to you shortly.\n\n"
                            "Best Regards,\n"
                            "Team Win 4all",
                    from_email='your-email@gmail.com',
                    recipient_list=[contact.email],
                    fail_silently=False,
                )
                
                # Also send to admin if it's about an order
                if 'ORDER DETAILS' in contact.description:
                    send_mail(
                        subject=f"Order Help Request: {request.data.get('order_id', 'N/A')}",
                        message=f"Customer {contact.name} ({contact.email}) needs help with their order:\n\n"
                                f"{contact.description}",
                        from_email='your-email@gmail.com',
                        recipient_list=['admin@example.com'],  # Your admin email
                        fail_silently=False,
                    )
            except Exception as e:
                return Response(
                    {'message': 'Form submitted, but email failed to send.', 'error': str(e)},
                    status=status.HTTP_201_CREATED
                )

            return Response(
                {'message': 'Form submitted successfully! Please check your email inbox.', 'data': serializer.data},
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


# class PreviousWinnersimgAPIView(APIView):
#     def get(self, request):
#         try:
#             winners = Previous_Winner_img.objects.all()
#             serializer = PreviousWinnerimgSerializer(winners, many=True)
#             return Response({'winners': serializer.data}, status=status.HTTP_200_OK)
#         except Previous_Winner_img.DoesNotExist:
#             return Response({'error': 'No winners found.'}, status=status.HTTP_404_NOT_FOUND)
#         except APIException as api_error:
#             return Response({'error': str(api_error)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except Exception as e:
#             return Response({'error': 'An unexpected error occurred: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class PreviousWinnersimgAPIView(APIView):
    def get(self, request):
        try:
            # Get only winners with flag=True, ordered by draw_date (newest first)
            winners = WinnersWallWinnersList.objects.filter(
                flag=True,
                image__isnull=False
            ).exclude(image='').order_by('-updated_at')
            #winners = WinnersWallWinnersList.objects.filter(flag=True).order_by('-updated_at')
            serializer = PreviousWinnerimgSerializer(winners, many=True)
            return Response({'winners': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'An unexpected error occurred: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LotteryStatisticsView(APIView):
    permission_classes = [IsAdminUser] 
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


from django.db.models.functions import ExtractMonth, ExtractYear
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from calendar import month_abbr
from datetime import datetime
class lottery_sales_bar_chart_View(APIView):
    permission_classes = [IsAdminUser] 
    def get(self, request):
        year = int(request.query_params.get('year', datetime.now().year))
        queryset = (
            PaymentLottery.objects
            .filter(payment_status='completed', payment_at__year=year)
            .annotate(month=ExtractMonth('payment_at'))
            .values('month')
            .annotate(sales_amount=Sum('amount'))
            .order_by('month')
        )

        response = [
            {
                'month': month_abbr[item['month']],  # e.g. Jan, Feb...
                'sales_amount': item['sales_amount']
            } for item in queryset
        ]
        return Response(response)
        
class lottery_sales_availableYearsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        years = (
            PaymentLottery.objects
            .filter(payment_status='completed', payment_at__isnull=False)  # Exclude nulls!
            .annotate(year=ExtractYear('payment_at'))
            .values_list('year', flat=True)
            .distinct()
            .order_by('year')
        )
        return Response({'years': list(years)})



class LeaderboardAPIView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        leaderboard = Leaderboard.objects.order_by('rank')  # Order by rank
        serializer = LeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
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

class SimilarLotteryEvents(APIView):
    def get(self, request, slug, format=None):
        event = get_object_or_404(LotteryEvent, slug=slug)
        category = event.category
        similar_events = LotteryEvent.objects.filter(category=category).exclude(slug=slug)
        serializer = LotteryEventSerializeradd_get(similar_events, many=True)
        return Response(serializer.data)

def footer_view(request):
    social_links = SocialLink.objects.all()

    print(social_links)
    return render(request, 'footer.html', {'social_links': social_links})

# locations
def locations_view(request):
    locations = Location.objects.all()  # Get all locations from the database
    return render(request, 'footer.html', {'locations': locations})
from django.conf import settings
    # lottery title and transaction pages api views

from PaymentServices.models import *
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

# Set up logging
logger = logging.getLogger(__name__)
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
stripe.api_key = settings.STRIPE_API_KEY
# Set up logging
@permission_classes([IsAdminUser])   
def check_lottery_title_unique(request):
    title = request.GET.get('title', '').strip()
    if LotteryEvent.objects.filter(title__iexact=title).exists():
        return JsonResponse({'exists': True})
    return JsonResponse({'exists': False})
from django.conf import settings

from PaymentServices.models import *
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

# Set up logging
logger = logging.getLogger(__name__)
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
stripe.api_key = settings.STRIPE_API_KEY
# Set up logging

# Set your Stripe API key
class api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_fetch_paid_amount_view(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, payment_intent):
        try:
            # Retrieve all payments for the given payment_intent
            payments = PaymentLottery.objects.filter(payment_intent=payment_intent)

            if not payments.exists():
                return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            # Extract total paid amount
            paid_amount = sum(payment.amount for payment in payments)

            # Get payment status (assuming all have the same status)
            payment_status = payments.first().payment_status

            # Retrieve all related lottery event details
            lottery_details = [
                {
                    "lottery_name": payment.lottery_event.title,
                    "amount": float(payment.amount),
                    "quantity": payment.quantity,
                }
                for payment in payments
            ]

            #  Fetch the refunded amount from Stripe
            try:
                full_payment_intent = f"pi_{payment_intent}"
                stripe_refunds = stripe.Refund.list(payment_intent=full_payment_intent)
                refunded_amount = sum(refund.amount for refund in stripe_refunds.data) / 100  # Convert from cents
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error fetching refund details: {e}")
                refunded_amount = 0  # Default to zero if Stripe API fails

            return Response({
                "paid_amount": paid_amount,
                "payment_status": payment_status,
                "lottery_details": lottery_details,
                "refunded_amount": refunded_amount,  #  Added refunded amount
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_refund_payment_view(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, payment_intent):
        try:
            # Find all payments with the same payment_intent
            payments = PaymentLottery.objects.filter(payment_intent=payment_intent)

            if not payments.exists():
                return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            # Check if any of the payments are already refunded
            if payments.filter(payment_status="refunded").exists():
                return Response({"error": "This payment has already been refunded"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if all payments are eligible for refund (status should be "completed")
            if payments.exclude(payment_status="completed").exists():
                return Response({"error": "Only completed payments can be refunded"}, status=status.HTTP_400_BAD_REQUEST)

            # Get refund amount from request
            refund_amount = request.data.get("refund_amount")
            if not refund_amount or refund_amount <= 0:
                return Response({"error": "Invalid refund amount"}, status=status.HTTP_400_BAD_REQUEST)

            # Convert amount to cents
            refund_amount_cents = int(refund_amount * 100)

            try:
                 # Prepend "pi_" to the payment_intent for Stripe
                full_payment_intent = f"pi_{payment_intent}"
                      
                # Process refund via Stripe
                refund = stripe.Refund.create(
                      payment_intent=full_payment_intent, 
                    amount=refund_amount_cents,
                    reason="requested_by_customer",
                )

                # Update all payments with this intent to "refunded"
                payments.update(payment_status="refunded")

                return Response({"message": "Refund successful", "refund_id": refund.id}, status=status.HTTP_200_OK)

            except stripe.error.InvalidRequestError as e:
                logger.error(f"Stripe Error: {e}")
                return Response({"error": "Invalid payment request. Please check the payment details."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

class api_admin_dashboard_payment_lottery_list_view_transactions_and_refund(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        email = request.query_params.get('email', None)
        
        if email:
            payment_lotteries = PaymentLottery.objects.filter(user__email=email).order_by('-payment_at')
        else:
            payment_lotteries = PaymentLottery.objects.all().order_by('-payment_at')
        
        serializer = AdminrefundPaymentLotterySerializer(payment_lotteries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK) 


import random
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from adminpanel.models import LotteryEvent, Winner
from PaymentServices.models import LotteryTicket,PaymentLottery
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from adminpanel.models import LotteryEvent, Winner
from PaymentServices.models import LotteryTicket, PaymentLottery
import random
from django.core.mail import send_mail
from django.conf import settings
import random
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import AdminOTP, adminProfile
from django.utils import timezone

class AdminSendOTPView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        admin_profile = adminProfile.objects.get(user=request.user)
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Delete any existing OTPs
        AdminOTP.objects.filter(admin=admin_profile).delete()
        
        # Create new OTP
        AdminOTP.objects.create(admin=admin_profile, otp=otp)
        
        # Send email
        send_mail(
            'Your OTP for Publishing Lottery Winner',
            f'Your OTP is: {otp}',
            settings.EMAIL_HOST_USER,
            [request.user.email],
            fail_silently=False,
        )
        
        return Response({"message": "OTP sent successfully"})

class AdminVerifyOTPView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        otp = request.data.get('otp')
        if not otp or len(otp) != 6:
            return Response({"verified": False, "error": "Invalid OTP format"})
        
        admin_profile = adminProfile.objects.get(user=request.user)
        
        try:
            otp_record = AdminOTP.objects.get(
                admin=admin_profile,
                otp=otp,
                #created_at__gte=datetime.now() - timedelta(minutes=10)
                created_at__gte=timezone.now() - timedelta(minutes=10)
            )
            
            if not otp_record.is_verified:
                otp_record.is_verified = True
                otp_record.save()
                return Response({"verified": True})
            
            return Response({"verified": False, "error": "OTP already used"})
        except AdminOTP.DoesNotExist:
            return Response({"verified": False, "error": "Invalid OTP"})

     
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from adminpanel.models import LotteryEvent, Winner
from PaymentServices.models import LotteryTicket, PaymentLottery
from django.contrib.auth.models import User
import random
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import AdminOTP, adminProfile

class AdminLotteryDrawView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        events = LotteryEvent.objects.all()
        current_date = timezone.now()
        return Response({
            "events": [
                {
                    "id": event.id,
                    "title": event.title,
                    "image": event.image.url if event.image else "/static/default-lottery.jpg",
                    "draw_date": event.draw_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "is_active": event.is_active,
                    "sold_percentage": event.sold_percentage,
                }
                for event in events
            ]
        })

    def post(self, request):
        event_id = request.data.get("event_id")
        method = request.data.get("method")
        ticket_start = request.data.get("ticket_start")
        ticket_end = request.data.get("ticket_end")
        publish = request.data.get("publish", False)

        if not event_id or not method:
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

        event = LotteryEvent.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Invalid event"}, status=status.HTTP_404_NOT_FOUND)

        # Check if winner already exists (only if publishing)
        if Winner.objects.filter(lottery_event=event).exists():
            return Response({"error": "Winner has already been chosen for this lottery"}, 
                          status=status.HTTP_400_BAD_REQUEST)

        if method == "method1":
            tickets = list(LotteryTicket.objects.filter(lottery_event=event))
            if not tickets:
                return Response({"error": "No tickets found for this lottery"}, status=status.HTTP_400_BAD_REQUEST)
            
            winner_ticket = random.choice(tickets)
            return Response({
                "winner": {
                    "ticket_number": winner_ticket.ticket_number,
                    "user": winner_ticket.user.username,
                    "selection_method": "method1"
                }
            })

        elif method == "method2":
            user_ticket_counts = {}
            for ticket in LotteryTicket.objects.filter(lottery_event=event):
                user_ticket_counts[ticket.user] = user_ticket_counts.get(ticket.user, 0) + 1

            if not user_ticket_counts:
                return Response({"error": "No tickets purchased for this lottery"}, status=status.HTTP_400_BAD_REQUEST)

            max_tickets = max(user_ticket_counts.values())
            top_users = [user for user, count in user_ticket_counts.items() if count == max_tickets]
            selected_user = random.choice(top_users)
            winner_ticket = random.choice(LotteryTicket.objects.filter(user=selected_user, lottery_event=event))
            
            return Response({
                "winner": {
                    "ticket_number": winner_ticket.ticket_number,
                    "user": winner_ticket.user.username,
                    "selection_method": "method2"
                }
            })

        elif method == "method3":
            if not ticket_start or not ticket_end:
                return Response({"error": "Ticket number range required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                ticket_range = list(range(int(ticket_start), int(ticket_end) + 1))
                selected_ticket = str(random.choice(ticket_range)).zfill(6)
            except ValueError:
                return Response({"error": "Invalid ticket range"}, status=status.HTTP_400_BAD_REQUEST)

            winner_ticket = LotteryTicket.objects.filter(lottery_event=event, ticket_number=selected_ticket).first()
            
            if winner_ticket:
                return Response({
                    "ticket_number": winner_ticket.ticket_number,
                    "user": winner_ticket.user.username,
                    "selection_method": "method3"
                })
            else:
                return Response({
                    "ticket_number": selected_ticket,
                    "user": "No User",
                    "selection_method": "method3"
                })

        else:
            return Response({"error": "Invalid selection method"}, status=400)


# prize management api views
	
class api_admin_dashboard_prize_management_winner_list_api_view(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = Winner.objects.all()
    serializer_class = prize_management_WinnerSerializer
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def api_admin_dashboard_prize_management_update_winner_status(request, pk):
    winner = get_object_or_404(Winner, pk=pk)
    winner.prize_status = request.data.get('prize_status', winner.prize_status)
    winner.prize_comments = request.data.get('prize_comments', winner.prize_comments)
    winner.save()
    return Response({"message": "Prize status updated successfully", "prize_comments": winner.prize_comments})




class PublishWinnerView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        winner_data = request.data.get("winner_data")
        event_id = request.data.get("event_id")
        
        if not winner_data or not event_id:
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

        event = LotteryEvent.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Invalid event"}, status=status.HTTP_404_NOT_FOUND)

        # Verify admin with OTP
        admin_profile = adminProfile.objects.get(user=request.user)
        if not AdminOTP.objects.filter(admin=admin_profile, is_verified=True).exists():
            return Response({"error": "Admin not verified with OTP"}, 
                          status=status.HTTP_403_FORBIDDEN)

        # Check if winner already exists
        if Winner.objects.filter(lottery_event=event).exists():
            return Response({"error": "Winner has already been published for this lottery"}, 
                          status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if 'winner' in winner_data:  # For method1 and method2
                winner_info = winner_data['winner']
                user = User.objects.get(username=winner_info['user'])
                payment = PaymentLottery.objects.filter(user=user).first()
                
                Winner.objects.create(
                    user=user,
                    lottery_event=event,
                    payment=payment,
                    ticket_number=winner_info['ticket_number'],
                    selection_method=winner_info['selection_method']
                )
                profile = UserPrivacy.objects.filter(user=user).first()
                WinnersWallWinnersList.objects.create(
                    winner_name=user.username,
                    ticket_number=winner_info['ticket_number'],
                    lottery_name=event.title,
                    draw_date=timezone.now(),  # Or use winner.created_at if you fetch it
                    image=profile.profile_photo if profile and profile.profile_photo else None
                )
            else:  # For method3
                if winner_data['user'] == "No User":
                    user, _ = User.objects.get_or_create(
                        username="No User", 
                        defaults={"email": "no-user@example.com"}
                    )
                    payment = None
                else:
                    user = User.objects.get(username=winner_data['user'])
                    payment = PaymentLottery.objects.filter(user=user).first()
                
                Winner.objects.create(
                    user=user,
                    lottery_event=event,
                    payment=payment,
                    ticket_number=winner_data['ticket_number'],
                    selection_method=winner_data['selection_method']
                )
                profile = UserPrivacy.objects.filter(user=user).first()
                WinnersWallWinnersList.objects.create(
                    winner_name=user.username,
                    ticket_number=winner_data['ticket_number'],
                    lottery_name=event.title,
                    draw_date=timezone.now(),  # Or use winner.created_at if you fetch it
                    image=profile.profile_photo if profile and profile.profile_photo else None
                )
            event.is_active = False
            event.save()    

        return Response({"message": "Winner published successfully"})
# winners wall winners
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import WinnersWallWinnersList
from .serializers import WinnersWallWinnersListSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import models

class custom_admin_dashboard_winner_wall_winners_list(APIView):
    """
    List all winners or create a new winner
    """
    # In views.py - update the get method in WinnersList class
    def get(self, request, format=None):
         # First get flag=True objects, ordered by draw_date descending (newest first)
        # visible_winners = WinnersWallWinnersList.objects.filter(flag=True).order_by('-draw_date')
        
        # # Then get flag=False objects, ordered by draw_date descending
        # hidden_winners = WinnersWallWinnersList.objects.filter(flag=False).order_by('-draw_date')
        
        # # Combine the querysets
        # winners = list(visible_winners) + list(hidden_winners)
        winners = WinnersWallWinnersList.objects.all().order_by('-updated_at','-draw_date')
        #winners = WinnersWallWinnersList.objects.all()
        
        search_query = request.query_params.get('search', None)
        if search_query:
            winners = winners.filter(
                models.Q(lottery_name__icontains=search_query) |
                models.Q(winner_name__icontains=search_query) |
                models.Q(ticket_number__icontains=search_query) |
                models.Q(draw_date__contains=search_query)
            )
        
        serializer = WinnersWallWinnersListSerializer(winners, many=True)
        return Response(serializer.data)
    
    @method_decorator(csrf_exempt)
    def post(self, request, format=None):
        serializer = WinnersWallWinnersListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class custom_admin_dashboard_winner_wall_winner_detail(APIView):
    """
    Retrieve, update or delete a winner instance
    """
    def get_object(self, pk):
        try:
            return WinnersWallWinnersList.objects.get(pk=pk)
        except WinnersWallWinnersList.DoesNotExist:
            return None
    
    def get(self, request, pk, format=None):
        winner = self.get_object(pk)
        if not winner:
            return Response(
                {"error": "Winner not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = WinnersWallWinnersListSerializer(winner)
        return Response(serializer.data)
    
    @method_decorator(csrf_exempt)
    def put(self, request, pk, format=None):
        winner = self.get_object(pk)
        if not winner:
            return Response(
                {"error": "Winner not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = WinnersWallWinnersListSerializer(winner, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @method_decorator(csrf_exempt)
    def patch(self, request, pk, format=None):
        winner = self.get_object(pk)
        if not winner:
            return Response(
                {"error": "Winner not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Specifically for flag toggling
        if 'flag' in request.data:
            winner.flag = request.data['flag']
            winner.save()
            return Response(
                {"success": f"Flag updated to {winner.flag}"},
                status=status.HTTP_200_OK
            )
        
        serializer = WinnersWallWinnersListSerializer(winner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @method_decorator(csrf_exempt)
    def delete(self, request, pk, format=None):
        winner = self.get_object(pk)
        if not winner:
            return Response(
                {"error": "Winner not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        winner.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

#winners wall testimonials
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Testimonial
from .serializers import custom_admin_dashboard_winners_wall_testimonials_serializer

class custom_admin_dashboard_winners_wall_testimonials_list(APIView):
    """
    List all testimonials or create a new testimonial.
    """
    def get(self, request, format=None):
        search_query = request.query_params.get('search', None)
        
        if search_query:
            testimonials = Testimonial.objects.filter(
                models.Q(name__icontains=search_query) | 
                models.Q(quote__icontains=search_query)
            ).order_by('-created_at')
        else:
            testimonials = Testimonial.objects.all().order_by('-created_at')
            
        serializer = custom_admin_dashboard_winners_wall_testimonials_serializer(testimonials, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = custom_admin_dashboard_winners_wall_testimonials_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class custom_admin_dashboard_winners_wall_testimonial_detail(APIView):
    """
    Retrieve, update or delete a testimonial instance.
    """
    def get_object(self, pk):
        return get_object_or_404(Testimonial, pk=pk)

    def get(self, request, pk, format=None):
        testimonial = self.get_object(pk)
        serializer = custom_admin_dashboard_winners_wall_testimonials_serializer(testimonial)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        testimonial = self.get_object(pk)
        serializer = custom_admin_dashboard_winners_wall_testimonials_serializer(testimonial, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        testimonial = self.get_object(pk)
        testimonial.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



from rest_framework.views import APIView
from rest_framework.response import Response
from .models import LotteryEvent, Winner
# Pending vs Completed Draws
class DrawStatsAPI(APIView):
    def get(self, request):
        total_draws = LotteryEvent.objects.count()
        completed_draws = Winner.objects.values('lottery_event').distinct().count()
        pending_draws = total_draws - completed_draws

        if total_draws > 0:
            completed_percentage = (completed_draws / total_draws) * 100
            pending_percentage = (pending_draws / total_draws) * 100
        else:
            completed_percentage = 0.0
            pending_percentage = 0.0

        return Response({
            'total_draws': total_draws,
            'completed_draws': completed_draws,
            'pending_draws': pending_draws,
            'completed_draws_percentage': round(completed_percentage, 2),
            'pending_draws_percentage': round(pending_percentage, 2)
        })

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
# Number of Winners Today
class WinnersVsLosersChartAPI(APIView):
    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        
        # Today's winners count
        today_winners = Winner.objects.filter(created_at__date=today).count()
        
        # Today's losers count
        # Get lottery events with winners today
        winning_lotteries = Winner.objects.filter(
            created_at__date=today
        ).values_list('lottery_event', flat=True).distinct()
        
        # Get all unique participants in these lotteries today
        participants = PaymentLottery.objects.filter(
            lottery_event__in=winning_lotteries,
            payment_status='completed'
        ).values('user').distinct().count()
        
        # Subtract winners from participants to get losers
        today_losers = participants - today_winners if participants > today_winners else 0
        
        # Weekly data
        weekly_data = []
        for i in range(7):
            day = week_ago + timedelta(days=i)
            
            # Winners for the day
            day_winners = Winner.objects.filter(created_at__date=day).count()
            
            # Losers for the day
            day_winning_lotteries = Winner.objects.filter(
                created_at__date=day
            ).values_list('lottery_event', flat=True).distinct()
            
            day_participants = PaymentLottery.objects.filter(
                lottery_event__in=day_winning_lotteries,
                payment_status='completed'
            ).values('user').distinct().count()
            
            day_losers = day_participants - day_winners if day_participants > day_winners else 0
            
            weekly_data.append({
                'date': day.strftime('%d %B'),
                'winners': day_winners,
                'losers': day_losers
            })
        
        # Total counts for the week
        total_winners = sum(day['winners'] for day in weekly_data)
        total_losers = sum(day['losers'] for day in weekly_data)
        
        return Response({
            'today_winners': today_winners,
            'today_losers': today_losers,
            'weekly_data': weekly_data,
            'total_winners': total_winners,
            'total_losers': total_losers
        })

from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from datetime import datetime
from rest_framework.response import Response
# Overall Transaction Report
class OverallTransactionReportView(APIView):
    def get(self, request):
        current_year = datetime.now().year
        current_month = datetime.now().strftime('%B %Y')
        
        # Get data for the current year
        queryset = PaymentLottery.objects.filter(
            payment_at__year=current_year,
            payment_status__in=['completed', 'refunded']
        ).annotate(
            month=TruncMonth('payment_at')
        ).values('month', 'payment_status').annotate(
            total_amount=Sum('amount')
        ).order_by('month')
        
        # Initialize data structure
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        successful = [0] * 12
        refunded = [0] * 12
        
        # Populate data
        for entry in queryset:
            month_index = entry['month'].month - 1
            if entry['payment_status'] == 'completed':
                successful[month_index] = float(entry['total_amount'])
            elif entry['payment_status'] == 'refunded':
                refunded[month_index] = float(entry['total_amount'])
        
        # Calculate current month total
        current_month_index = datetime.now().month - 1
        current_amount = successful[current_month_index] - refunded[current_month_index]
        
        return Response({
            'months': months,
            'successful': successful,
            'refunded': refunded,
            'current_month': current_month,
            'current_amount': f'£{current_amount:,.2f}'
        })
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from datetime import datetime
from .serializers import WinnerSerializer
class WinnerListView(APIView):
    def get(self, request, *args, **kwargs):
        winners = Winner.objects.all().order_by('-created_at')  

        grouped_winners = defaultdict(list)
        for winner in winners:
            draw_date = winner.created_at.strftime("%A %dth of %B %Y")  
            grouped_winners[draw_date].append(WinnerSerializer(winner).data)

        return Response(grouped_winners)
    
from django.db.models.functions import TruncDate
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WinnersWallWinnersList
from datetime import datetime

class WinnersWallListView(APIView):
    def get(self, request, *args, **kwargs):
        # Get only winners with flag=True and order by draw_date descending
        winners = WinnersWallWinnersList.objects.filter(flag=True).order_by('-draw_date')
        
        grouped_winners = defaultdict(list)
        for winner in winners:
            # Format the date as "Monday 12th of March 2024"
            draw_date = winner.draw_date.strftime("%A %dth of %B %Y")
            grouped_winners[draw_date].append({
                'lottery_title': winner.lottery_name,
                'username': winner.winner_name,
                'ticket_number': winner.ticket_number,
                'image_url': winner.image_url if winner.image else None
            })
            
        return Response(grouped_winners)


from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Q
from .models import LotteryEvent, PaymentLottery, LotteryCategory
from datetime import datetime
import calendar
from django.http import HttpResponse
import pandas as pd
from io import BytesIO

class MarginalChartDataView(APIView):
    def get(self, request):
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        # Base query for lotteries
        lotteries_query = Q(created_at__year=year)
        if month and month != 'all':
            lotteries_query &= Q(created_at__month=month)
        
        # Get all lottery events for the selected period
        lotteries = LotteryEvent.objects.filter(lotteries_query).select_related('category')
        
        # Get all successful payments for these lotteries
        payments = PaymentLottery.objects.filter(
            lottery_event__in=lotteries,
            payment_status='completed'
        )
        
        # Group by category and calculate totals
        categories = LotteryCategory.objects.filter(
            lottery_events__in=lotteries
        ).distinct()
        
        data = []
        for category in categories:
            category_lotteries = lotteries.filter(category=category)
            total_amount = sum(float(lottery.total_amount) for lottery in category_lotteries)
            
            category_payments = payments.filter(lottery_event__category=category)
            total_sales = category_payments.aggregate(total=Sum('amount'))['total'] or 0
            
            margin = float(total_sales) - float(total_amount)
            margin_reached = margin >= 0
            
            data.append({
                'category': category.name,
                'total_amount': float(total_amount),
                'total_sales': float(total_sales),
                'margin': margin,
                'margin_reached': margin_reached,
                'margin_status': 'Reached' if margin_reached else 'Not Reached'
            })
        
        # Calculate overall totals
        overall_sales = sum(item['total_sales'] for item in data)
        overall_target = sum(item['total_amount'] for item in data)
        overall_margin = overall_sales - overall_target
        overall_status = 'Reached' if overall_margin >= 0 else 'Not Reached'
        
        # Get available years and months for dropdowns
        years = LotteryEvent.objects.dates('created_at', 'year').values_list('created_at__year', flat=True).distinct()
        months = LotteryEvent.objects.filter(created_at__year=year).dates('created_at', 'month').values_list('created_at__month', flat=True).distinct()
        
        return Response({
            'data': data,
            'overall': {
                'total_sales': overall_sales,
                'total_target': overall_target,
                'margin': overall_margin,
                'margin_status': overall_status
            },
            'years': list(years),
            'months': [{'value': 'all', 'name': 'All Months'}] + [{'value': m, 'name': calendar.month_name[m]} for m in months],
            'selected_year': int(year) if year else None,
            'selected_month': month if month else None
        })

class MarginalChartExportView(APIView):
    def get(self, request):
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        # Reuse the same logic as the chart data view
        view = MarginalChartDataView()
        response = view.get(request)
        data = response.data['data']
        overall = response.data['overall']
        
        # Create a DataFrame for Excel export
        df = pd.DataFrame(data)
        df = df[['category', 'total_sales', 'total_amount', 'margin', 'margin_status']]
        df.columns = ['Category', 'Sales', 'Target', 'Margin', 'Status']
        
        # Add overall row
        overall_df = pd.DataFrame([{
            'Category': 'TOTAL',
            'Sales': overall['total_sales'],
            'Target': overall['total_target'],
            'Margin': overall['margin'],
            'Status': overall['margin_status']
        }])
        df = pd.concat([df, overall_df])
        
        # Create Excel file in memory
        output = BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df.to_excel(writer, sheet_name='Margin Chart', index=False, startrow=2)
        
        # Get workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Margin Chart']
        
        # Add title
        title_format = workbook.add_format({
            'bold': True,
            'size': 16,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        month_name = calendar.month_name[int(month)] if month and month != 'all' else ''
        title = f'Margin Chart - {year}' + (f' {month_name}' if month_name else '')
        worksheet.merge_range('A1:E1', title, title_format)
        
        # Add header formatting
        header_format = workbook.add_format({
            'bold': True,
            'border': 1,
            'bg_color': '#4e73df',
            'color': 'white',
            'align': 'center',
            'valign': 'vcenter'
        })
        
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(2, col_num, value, header_format)
        
        # Add data formatting
        data_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        money_format = workbook.add_format({
            'num_format': '€#,##0.00',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        status_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'bold': True
        })
        
        reached_format = workbook.add_format({
            'bg_color': '#1cc88a',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'bold': True
        })
        
        not_reached_format = workbook.add_format({
            'bg_color': '#e74a3b',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'bold': True
        })
        
        # Apply formatting
        for row_num in range(3, len(df) + 3):
            for col_num in range(5):  # 5 columns
                if col_num in [1, 2, 3]:  # Sales, Target, Margin columns
                    worksheet.write(row_num, col_num, df.iloc[row_num-3, col_num], money_format)
                elif col_num == 4:  # Status column
                    status = df.iloc[row_num-3, col_num]
                    if status == 'Reached':
                        worksheet.write(row_num, col_num, status, reached_format)
                    else:
                        worksheet.write(row_num, col_num, status, not_reached_format)
                else:
                    worksheet.write(row_num, col_num, df.iloc[row_num-3, col_num], data_format)
        
        # Adjust column widths
        worksheet.set_column('A:A', 20)
        worksheet.set_column('B:D', 15)
        worksheet.set_column('E:E', 15)
        
        # Close the writer
        writer.close()
        output.seek(0)
        
        # Create filename
        month_name = calendar.month_name[int(month)].title() if month and month != 'all' else ''
        filename = f'margin_chart_{year}' + (f'_{month_name}' if month_name else '') + '.xlsx'
        
        # Create response
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        return response

import random
import string
from django.utils.text import slugify
from django.utils import timezone

def create_dummy_lottery_events(n=10):
    for i in range(n):
        # Create unique category
        category_name = f"Category {i+1} - {''.join(random.choices(string.ascii_uppercase, k=5))}"
        category = LotteryCategory.objects.create(name=category_name)

        # Generate title and slug
        title = f"Dummy Lottery Event {i+1}"
        slug = slugify(title + '-' + ''.join(random.choices(string.ascii_lowercase, k=4)))

        # Create the event
        event = LotteryEvent.objects.create(
            title=title,
            slug=slug,
            category=category,
            description="This is a dummy lottery event.",
            price=random.uniform(10, 100),
            draw_date=timezone.now() + timezone.timedelta(days=random.randint(5, 30)),
            sold_percentage=random.randint(0, 100),
            total_tickets=100,
            sold_tickets=random.randint(0, 100),
            total_budget=random.uniform(1000, 5000),
            revenue_type=random.choice(['fixed', 'percentage']),
            revenue_value=random.uniform(100, 500),
            total_amount=random.uniform(2000, 6000),
            per_ticket_price=random.uniform(10, 100),
            mini_limit=1,
            max_limit=10,
            free_postal_description="Free postal entry instructions here.",
            competition_details="Dummy competition details.",
        )
        print(f"Created: {event.title} with Category: {category.name}")
#create_dummy_lottery_events()

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from datetime import datetime, timedelta
from .models import Winner, LotteryEvent

class LotteryReportAPI(APIView):
    def get(self, request):
        # Get data for last 5 years
        current_year = datetime.now().year
        years = range(current_year - 4, current_year + 1)
        
        data = []
        total_won = 0
        total_lost = 0
        
        for year in years:
            # Get all winners for this year
            winners = Winner.objects.filter(created_at__year=year)
            won = winners.count()
            lost = 0
            
            # Calculate lost tickets (sold_tickets - 1 for each winner)
            for winner in winners:
                if winner.lottery_event:
                    lost += winner.lottery_event.sold_tickets - 1
            
            data.append({
                'year': year,
                'won': won,
                'lost': lost
            })
            
            total_won += won
            total_lost += lost
        
        return Response({
            'years_data': data,
            'total_won': total_won,
            'total_lost': total_lost,
            'status': 'success'
        })
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from datetime import datetime
import xlsxwriter
from io import BytesIO
from .models import Winner, LotteryEvent

class LotteryReportExportAPI(APIView):
    def get(self, request):
        # Create a file-like buffer to receive Excel data
        output = BytesIO()

        # Create a workbook and add a worksheet
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('Lottery Report')
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#8EA9DB',
            'border': 1
        })
        
        data_format = workbook.add_format({
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })
        
        total_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#F2F2F2',
            'border': 1
        })
        
        # Get data for last 5 years
        current_year = datetime.now().year
        years = range(current_year - 4, current_year + 1)
        
        data = []
        total_won = 0
        total_lost = 0
        
        for year in years:
            winners = Winner.objects.filter(created_at__year=year)
            won = winners.count()
            lost = 0
            
            for winner in winners:
                if winner.lottery_event:
                    lost += winner.lottery_event.sold_tickets - 1
            
            data.append({
                'year': year,
                'won': won,
                'lost': lost
            })
            
            total_won += won
            total_lost += lost
        
        # Write title
        worksheet.merge_range('A1:D1', 'Overall Won and Lost Lotteries Report', title_format)
        
        # Write headers
        worksheet.write('A2', 'Year', header_format)
        worksheet.write('B2', 'Won', header_format)
        worksheet.write('C2', 'Lost', header_format)
        worksheet.write('D2', 'Total', header_format)
        
        # Write data
        row = 2
        for item in data:
            worksheet.write(row, 0, item['year'], data_format)
            worksheet.write(row, 1, item['won'], data_format)
            worksheet.write(row, 2, item['lost'], data_format)
            worksheet.write(row, 3, item['won'] + item['lost'], data_format)
            row += 1
        
        # Write totals
        worksheet.write(row, 0, 'Total', total_format)
        worksheet.write(row, 1, total_won, total_format)
        worksheet.write(row, 2, total_lost, total_format)
        worksheet.write(row, 3, total_won + total_lost, total_format)
        
        # Add chart
        # chart = workbook.add_chart({'type': 'column'})
        
        # # Configure the series
        # chart.add_series({
        #     'name': '=Lottery Report!$B$2',
        #     'categories': '=Lottery Report!$A$3:$A$' + str(row),
        #     'values': '=Lottery Report!$B$3:$B$' + str(row),
        #     'fill': {'color': '#4BC0C0'},
        #     'border': {'color': 'black'}
        # })
        
        # chart.add_series({
        #     'name': '=Lottery Report!$C$2',
        #     'categories': '=Lottery Report!$A$3:$A$' + str(row),
        #     'values': '=Lottery Report!$C$3:$C$' + str(row),
        #     'fill': {'color': '#FF6384'},
        #     'border': {'color': 'black'}
        # })
        
        # # Configure chart axes
        # chart.set_x_axis({'name': 'Year', 'name_font': {'bold': True}})
        # chart.set_y_axis({'name': 'Count', 'name_font': {'bold': True}})
        
        # Insert the chart
        # worksheet.insert_chart('F2', chart, {'x_offset': 25, 'y_offset': 10})
        
        # Set column widths
        worksheet.set_column('A:A', 12)
        worksheet.set_column('B:D', 12)
        
        # Close the workbook
        workbook.close()
        
        # Rewind the buffer
        output.seek(0)
        
        # Create the response
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=Lottery_Report.xlsx'
        
        return response    

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Winner
from .serializers import WonLotteryWinnerSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_won_lottery(request):
    # winners = Winner.objects.filter(user=request.user)
    winners = Winner.objects.filter(user=request.user).order_by('-created_at')
    serializer = WonLotteryWinnerSerializer(winners, many=True)
    return Response(serializer.data)
