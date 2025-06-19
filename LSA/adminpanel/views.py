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
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime
import random
from .models import SocialLink
from django.shortcuts import render
from .models import Location
from PaymentServices.models import PaymentLottery
from django.db import models

# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the .block-user-btn click event)

@csrf_exempt
@api_view(['POST'])
def block_user(request):
    user_id = request.data.get('user_id')
    action = request.data.get('action')  
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
 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the fetchMessagesByEmail function)
@api_view(['POST'])
def mark_messages_as_read(request, email):
    try:
        Contact.objects.filter(email=email).update(is_read=True)
        return Response({"status": "success", "message": "Messages marked as read"})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
#custom admin dashboard overview section notification bell view function
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the user_notifications function)
def latest_unread_notifications(request):
  
    latest_message_subquery = (
        Contact.objects
        .filter(email=OuterRef('email'), is_read=False)
        .order_by('-created_at')
        .values('id')[:1]  
    )
    latest_messages = (
        Contact.objects
        .filter(id__in=Subquery(latest_message_subquery))
        .order_by('-created_at') 
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
#custom admin dashboard customer support section all chats view function    
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the admin_chat_view,showEmailList function)
class ChatMessagesView(APIView):
    def get(self, request, email):
        contact_messages = Contact.objects.filter(email=email).order_by('created_at')
        admin_replies = AdminReply.objects.filter(contact__email=email).order_by('created_at')
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
       
        chat_data = sorted(chat_data, key=lambda x: x['created_at'])
        return Response(chat_data, status=status.HTTP_200_OK)
#custom admin dashboard customer support section message sent into mail view function 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the admin_contact_reply_form submit event)
class AdminReplyView(APIView):
    authentication_classes = [TokenAuthentication]
    def post(self, request):
        email = request.data.get('email')
        reply_message = request.data.get('message', '').strip()
        file = request.FILES.get('file')
        if not reply_message and not file:
            return Response(
                {'error': 'Reply message or file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
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
            reply = AdminReply.objects.create(
                contact=contact,
                reply_message=reply_message,
                file=file
            )
            file_url = request.build_absolute_uri(reply.file.url) if reply.file else None
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
            email_message = EmailMessage(
                subject="Reply from Admin",
                body=email_body,
                from_email='your-email@gmail.com',
                to=[email]
            )
            email_message.content_subtype = "html" 
            email_message.send(fail_silently=False)
            return Response({'message': 'Reply sent successfully!'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f"Failed to send reply: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
#custom admin dashboard customer support section message list and Starred status  view function 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the admin_chat_view function)
class ContactListView(APIView):
    def get(self, request):
        from collections import defaultdict
        grouped_contacts = defaultdict(list)
        contacts = Contact.objects.all().order_by('-starred', '-created_at') 
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
        contacts = Contact.objects.filter(email=email) 
        if contacts.exists():
            contacts.update(starred=starred) 
            return Response({"success": True, "message": "Starred status updated for all records."})
        return Response({"success": False, "message": "No records found for this email."}, status=404)
#user page UserChat message view function 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the user_chat_view function)
class UserChatView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
       
        user_email = request.user.email
        contacts = Contact.objects.filter(email=user_email).order_by('created_at')
        admin_replies = AdminReply.objects.filter(contact__email=user_email).order_by('created_at')
     
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
      
        chat_data = sorted(chat_data, key=lambda x: x['created_at'])
        return Response(chat_data, status=status.HTTP_200_OK)
    def post(self, request):
        user_email = request.user.email
        message = request.data.get('message', '').strip()
        file = request.FILES.get('file')  
        if not message and not file:
            return Response(
                {'error': 'Message or file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        contact = Contact.objects.create(
            name=request.user.username,
            email=user_email,
            description=message,
            file=file,  
            created_at=now()
        )
        return Response({'message': 'Message sent successfully!'}, status=status.HTTP_201_CREATED)

#custom admin dashboard customer support section user chat  delete view function 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the deleteSelectedContacts,deleteContact function)
class DeleteContactView(APIView):
    authentication_classes = [TokenAuthentication]
    def delete(self, request, email):
        try:
          
            contact = Contact.objects.filter(email=email)
            if not contact.exists():
                return Response(
                    {'error': f"No contact found for email: {email}"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            admin_replies = AdminReply.objects.filter(contact__email=email)
            for reply in admin_replies:
                if reply.file:
                    reply.file.delete()  
                reply.delete()
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
#custom admin dashboard customer support section message edit and delete view function 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the deleteAdminMessage,editAdminMessage function)
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
#custom admin dashboard preview and manage all the section content view functions 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function initializeDashboard function)
class api_dashboard_preview_admin_view(APIView):
    def get(self, request, *args, **kwargs):
        try:
            admin_profile = adminProfile.objects.get(user=request.user)
            role_specific_dashboard_preview = admin_profile.dashboard_preview.all()
        except adminProfile.DoesNotExist:
            return Response({"error": "Admin profile not found"}, status=404)
        total_users = UserProfile.objects.count()
        verified_users = UserProfile.objects.filter(kyc_status='verified').count()
        pending_kyc = UserProfile.objects.filter(kyc_status='pending').count()
        user_profiles = UserProfile.objects.all().order_by('is_blocked', '-user__date_joined')
        users_table = []
        for profile in user_profiles:
            serializer = UserKycwaitingDetailsSerializer(profile)
            users_table.append(serializer.data)
        year = datetime.now().year  
        active_users = UserProfile.objects.filter(
            user__last_login__year=year
        ).count()
        current_time = timezone.now()
        now = timezone.now()
        ninety_days_ago = now - timedelta(days=90)
        inactive_users = UserProfile.objects.filter(
            user__last_login__lt=ninety_days_ago
        ).count()
        new_users_this_month = User.objects.filter(
            date_joined__year=now.year,
            date_joined__month=now.month
        ).count()    
        active_lotteries = LotteryEvent.objects.filter(is_active=True, draw_date__gt=current_time).count()
        sales_amount = PaymentLottery.objects.aggregate(Sum('amount'))['amount__sum'] or 0    
        data = {
            'overview_active_users_count': active_users,
            'overview_active_lotteries_count': active_lotteries,
            'overview_sales_amount':f'£{sales_amount:,.2f}',
            'inactive_users': inactive_users,
            'new_users_this_month': new_users_this_month,
            'total_users': total_users,
            'verified_users': verified_users,
            'pending_kyc': pending_kyc, 
        }
       
        from django.conf import settings
        from django.db.models import F
        admin_dashboard_preview = role_specific_dashboard_preview.annotate(
            image_url=F('dashboard_preview_image')
        ).values('name', 'identifier', 'type', 'image_url')
        for tab in admin_dashboard_preview:
            if tab["image_url"]:
                tab["image_url"] = request.build_absolute_uri(settings.MEDIA_URL + tab["image_url"])
        table_data = {
            "users_table": users_table,
        }
        return Response({
            "data": data,
            "tabs": list(admin_dashboard_preview),
            "table_data": table_data
        })
#custom admin dashboard nav bar and manage all the section view functions 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function initializeDashboard function)
class api_navbar_access_tabsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            profile = adminProfile.objects.get(user=request.user)
            if profile.role == 'admin':
                navbar_access_tabs = profile.navbar_access.all()  
            else:
                navbar_access_tabs = profile.navbar_access.all()  
            serializer = admin_navbar_accessSerializer(navbar_access_tabs, many=True, context={'request': request})
            return Response(serializer.data)
        except adminProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)
 
#custom admin signup view functions  
# admin_signup.html (adminpanel template)
# custom.js (JavaScript handling the function admin_signup_form submit event)        
class api_admin_signup(generics.CreateAPIView):
    serializer_class = api_admin_signup_Serializer
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    "message": "Admin registration successful.",
                    "admin_id": user.id
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#custom admin login view functions    
#  custom_admin_login.html (adminpanel template)
# custom.js (JavaScript handling the function custom_admin_login_form submit event)        
class api_admin_login(APIView):
    serializer_class = api_admin_signup_Serializer
    @csrf_exempt
    def post(self, request):
        try:
            serializer = api_admin_login_Serializer(data=request.data)
            if serializer.is_valid():
                admin_email = serializer.validated_data['admin_email']
                admin_password = serializer.validated_data['admin_password']
                User = get_user_model()
                try:
                    user = User.objects.get(email__iexact=admin_email)
                except User.DoesNotExist:
                    user = None
                if user and check_password(admin_password, user.password):
                    admin_profile = getattr(user, 'adminprofile', None)
                    if admin_profile and not admin_profile.role:
                        return Response(
                            {"success": False, "message": "Your access process is not verified."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
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
                        {"success": False, "message": "Invalid email or password."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
       
#!-----lottery_events.html-custom.js- function lottery_events_fetch()----!
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
          
            now = timezone.now()
            lottery_events = LotteryEvent.objects.filter(
                is_active=True,
                draw_date__gte=now
            ).order_by('-id')
            if search_query:
                lottery_events = lottery_events.filter(title__icontains=search_query)
            if category_id:
                lottery_events = lottery_events.filter(category_id=category_id)
            favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
            serializer = LotteryEventSerializeradd_get(lottery_events, many=True)
            events_data = serializer.data
            for event in events_data:
                event['is_favorite'] = event['slug'] in favorites_slugs
            return Response(events_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#custom admin dashboard lottery section fetch lottery view functions 
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function fetchLotteryEvents function)
class api_get_lottery_events_admin(APIView):  
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
          
            lottery_events = LotteryEvent.objects.order_by('-id')
            if search_query:
                lottery_events = lottery_events.filter(title__icontains=search_query)
            if category_id:
                lottery_events = lottery_events.filter(category_id=category_id)
            favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
            serializer = LotteryEventSerializeradd_get(lottery_events, many=True)
            events_data = serializer.data
            for event in events_data:
                event['is_favorite'] = event['slug'] in favorites_slugs
            return Response(events_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#!-----category_lottery_events.html-custom.js-function fetchCategoryLotteryEvents()-----!
class APIGetCategoryLotteryEvents(APIView):
    def get(self, request, category_id):
        try:
            category = LotteryCategory.objects.get(id=category_id)
            
            now = timezone.now()

            events = LotteryEvent.objects.filter(
                category=category,
                is_active=True,
                draw_date__gte=now
            )
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

# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function submitAddLotteryEvent function)
class api_lottery_events_add(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = LotteryEventSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                lottery_event = serializer.save()

                additional_images = request.FILES.getlist('additional_images')
                for image in additional_images:
                    LotteryEventImages.objects.create(lottery_event=lottery_event, image=image)

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function lottery_events_edit_saveChanges,deleteLotteryEvent function)
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

        additional_images = event.additional_images.all() 
        images = [{"id": img.id, "url": img.image.url} for img in additional_images]

        serializer = LotteryEventSerializeradd_get(event)
        data = serializer.data
        data['additional_images'] = images 
        return Response(data)

    def put(self, request, pk):
        try:
            event = LotteryEvent.objects.get(pk=pk)
        except LotteryEvent.DoesNotExist:
            return Response({"error": "Lottery event not found"}, status=status.HTTP_404_NOT_FOUND)
        event_serializer = LotteryEventSerializer(event, data=request.data,partial=True)
        if event_serializer.is_valid():
            event_serializer.save()

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
        lottery_event = get_object_or_404(LotteryEvent, id=event_id)
        
        lottery_event_image = get_object_or_404(LotteryEventImages, id=image_id, lottery_event=lottery_event)

        try:
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


#!-----lottery_detail.html-custom.js- function addToCart(event, redirectToCart = false)-----!
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
               set_remaining_ticket = 0  
            return Response({
                "success": False,
                "message": (
                    f"max limit reached . only {set_remaining_ticket} remaining tickets can be added"
                ),
                "event_title": event_title,
                "current_quantity": current_quantity,
                "remaining_tickets": set_remaining_ticket,
                "max_limit": actual_limit
            }, status=400)

        
        cart[event_slug] = {
            "title": event_title,
            "per_ticket_price": str(event.per_ticket_price),
            "quantity": new_total_quantity,
            "image": event.image.url if event.image else None,
            "max_limit": actual_limit,
            "remaining_tickets": remaining_tickets - quantity  
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

#!-----cart.html-custom.js-function fetchCartItems(),function updateCartCount(),function updateCartCount_cartpage()-----!
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

#!-----cart.html-custom.js-function removeFromCart(event)-----!
@api_view(['POST'])
@permission_classes([AllowAny])
def remove_from_cart(request):

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

#!-----cart.html-custom.js-function updateCartQuantity(event, cart, delta),fetch('/api/update-cart/'-----!
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

        
        user = request.user if request.user.is_authenticated else None

        
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
        
#!-----favorites.html-custom.js-function fetchFavorites(),function updateFavoritesCount(),-----!
@api_view(['GET'])
@permission_classes([AllowAny])
def get_favorites(request):
    
    favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))    
    
    events = LotteryEvent.objects.filter(slug__in=favorites_slugs, draw_date__gt=now(),is_active=True)
    
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
    
    response = Response({"favorites": favorite_events})
    updated_slugs = [event['slug'] for event in favorite_events]
    
    response.set_cookie('favorites', json.dumps(updated_slugs),max_age=7 * 24 * 60 * 60,  
        httponly=True,  
        secure=False, )
    
    return response

#!-----favorites.html-custom.js-function toggleFavorite(eventSlug),toggleFavoriteSimilar(targetSlug)-----!  
@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_favorites(request):
    event_slug = request.data.get('event_slug')

    if not event_slug:
        return Response({"success": False, "message": "Event ID is required."}, status=400)
  
    favorites = json.loads(request.COOKIES.get('favorites', '[]'))
 
    if event_slug in favorites:
        
        favorites.remove(event_slug)
        message = "Removed from favorites."
    else:
        
        favorites.append(event_slug)
        message = "Added to favorites."
     
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

#!-----lottery_events.html-custom.js- function fetchBanner(),function category_fetchBanner()-----!
class BannerView(APIView):
    def get(self, request):
        try:
            banner = Banner.objects.last()  
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

#!-----lottery_events.html-custom.js- function fetchWinners_mainpage()-----!
class PreviousWinnersimgAPIView(APIView):
    def get(self, request):
        try:
            
            winners = WinnersWallWinnersList.objects.filter(
                flag=True,
                image__isnull=False
            ).exclude(image='').order_by('-updated_at')
            
            serializer = PreviousWinnerimgSerializer(winners, many=True)
            return Response({'winners': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'An unexpected error occurred: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from django.db.models.functions import ExtractMonth, ExtractYear
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from calendar import month_abbr
from datetime import datetime
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function report_and_analytics_sales_chart_fetchSalesData function)
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
                'month': month_abbr[item['month']],  
                'sales_amount': item['sales_amount']
            } for item in queryset
        ]
        return Response(response)
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function report_and_analytics_sales_chart_populateYearDropdown function)        
class lottery_sales_availableYearsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        years = (
            PaymentLottery.objects
            .filter(payment_status='completed', payment_at__isnull=False)  
            .annotate(year=ExtractYear('payment_at'))
            .values_list('year', flat=True)
            .distinct()
            .order_by('year')
        )
        return Response({'years': list(years)})

class SimilarLotteryEvents(APIView):
    def get(self, request, slug, format=None):
        event = get_object_or_404(LotteryEvent, slug=slug)
        category = event.category
        now = timezone.now()
        similar_events = LotteryEvent.objects.filter(
            category=category,
            is_active=True,
            draw_date__gte=now
        ).exclude(slug=slug)
        
        favorites_slugs = json.loads(request.COOKIES.get('favorites', '[]'))
        serializer = LotteryEventSerializeradd_get(similar_events, many=True)
        
        events_data = serializer.data
        for event in events_data:
            event['is_favorite'] = event['slug'] in favorites_slugs
            
        return Response(events_data)
    
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


logger = logging.getLogger(__name__)
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
stripe.api_key = settings.STRIPE_API_KEY
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function new_lottery_title,lottery_events_add_edit_title,keyup event)
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

logger = logging.getLogger(__name__)
import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
stripe.api_key = settings.STRIPE_API_KEY
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function handleRefundClick function)
class api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_fetch_paid_amount_view(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, payment_intent):
        try:
            payments = PaymentLottery.objects.filter(payment_intent=payment_intent)

            if not payments.exists():
                return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            paid_amount = sum(payment.amount for payment in payments)

            payment_status = payments.first().payment_status

            lottery_details = [
                {
                    "lottery_name": payment.lottery_event.title,
                    "amount": float(payment.amount),
                    "quantity": payment.quantity,
                }
                for payment in payments
            ]

            try:
                full_payment_intent = f"pi_{payment_intent}"
                stripe_refunds = stripe.Refund.list(payment_intent=full_payment_intent)
                refunded_amount = sum(refund.amount for refund in stripe_refunds.data) / 100  
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error fetching refund details: {e}")
                refunded_amount = 0 

            return Response({
                "paid_amount": paid_amount,
                "payment_status": payment_status,
                "lottery_details": lottery_details,
                "refunded_amount": refunded_amount, 
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function confirmRefundButton click event)
class api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_refund_payment_view(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, payment_intent):
        try:
            payments = PaymentLottery.objects.filter(payment_intent=payment_intent)

            if not payments.exists():
                return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            if payments.filter(payment_status="refunded").exists():
                return Response({"error": "This payment has already been refunded"}, status=status.HTTP_400_BAD_REQUEST)

            if payments.exclude(payment_status="completed").exists():
                return Response({"error": "Only completed payments can be refunded"}, status=status.HTTP_400_BAD_REQUEST)

            refund_amount = request.data.get("refund_amount")
            if not refund_amount or refund_amount <= 0:
                return Response({"error": "Invalid refund amount"}, status=status.HTTP_400_BAD_REQUEST)

            refund_amount_cents = int(refund_amount * 100)

            try:
                full_payment_intent = f"pi_{payment_intent}"
                      
                refund = stripe.Refund.create(
                      payment_intent=full_payment_intent, 
                    amount=refund_amount_cents,
                    reason="requested_by_customer",
                )

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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function custom_admin_dashboard_transactions_management_fetchData function)
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
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

class AdminLotteryDrawView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 3)
        
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            page = 1
            page_size = 3

        
        if page_size > 50:
            page_size = 50
        elif page_size < 1:
            page_size = 3

        events = LotteryEvent.objects.all().order_by('-id')
        
        paginator = Paginator(events, page_size)
        
        try:
            paginated_events = paginator.page(page)
        except PageNotAnInteger:
            
            paginated_events = paginator.page(1)
            page = 1
        except EmptyPage:
            
            paginated_events = paginator.page(paginator.num_pages)
            page = paginator.num_pages

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
                    "winner_chosen": Winner.objects.filter(lottery_event=event).exists()  
                }
                for event in paginated_events
            ],
            "pagination": {
                "current_page": page,
                "total_pages": paginator.num_pages,
                "page_size": page_size,
                "total_count": paginator.count,
                "has_next": paginated_events.has_next(),
                "has_previous": paginated_events.has_previous(),
                "next_page": paginated_events.next_page_number() if paginated_events.has_next() else None,
                "previous_page": paginated_events.previous_page_number() if paginated_events.has_previous() else None
            },
            "total_count": paginator.count  
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

        
        if Winner.objects.filter(lottery_event=event).exists():
            return Response({"error": "Winner has already been chosen for this lottery"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        valid_tickets = LotteryTicket.objects.filter(
            lottery_event=event,
            payment__payment_status='completed'
        )
        
        if method == "method1":
            tickets = list(valid_tickets)
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
            for ticket in valid_tickets:
                user_ticket_counts[ticket.user] = user_ticket_counts.get(ticket.user, 0) + 1

            if not user_ticket_counts:
                return Response({"error": "No tickets purchased for this lottery"}, status=status.HTTP_400_BAD_REQUEST)

            max_tickets = max(user_ticket_counts.values())
            top_users = [user for user, count in user_ticket_counts.items() if count == max_tickets]
            selected_user = random.choice(top_users)
            winner_ticket = random.choice(LotteryTicket.objects.filter(user=selected_user,lottery_event=event,payment__payment_status='completed'))
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

            winner_ticket = valid_tickets.filter(ticket_number=selected_ticket).first()
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

# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function fetchWinners function)	
class api_admin_dashboard_prize_management_winner_list_api_view(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset =  Winner.objects.order_by('-created_at')
    serializer_class = prize_management_WinnerSerializer
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function updateWinnerStatus function)    
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
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import WinnersWallWinnersList
from .serializers import WinnersWallWinnersListSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import models
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function custom_admin_dashboard_winners_wall_fetchWinners,winners_wall_Winners_edit_add_show_popup function)
class custom_admin_dashboard_winner_wall_winners_list(APIView):

    def get(self, request, format=None):
       
        winners = WinnersWallWinnersList.objects.all().order_by('-updated_at','-draw_date')
     
        
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function custom_admin_dashboard_winners_wall_add_winners_function function)
class custom_admin_dashboard_winner_wall_winner_detail(APIView):
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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Testimonial
from .serializers import custom_admin_dashboard_winners_wall_testimonials_serializer
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function winners_wall_testimonial_load_testimonials function)
class custom_admin_dashboard_winners_wall_testimonials_list(APIView):
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function winners_wall_testimonial_handle_submit function)
class custom_admin_dashboard_winners_wall_testimonial_detail(APIView):
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function report_and_analytics_Pending_vs_completed_draws_pie_chart_export_function function)
class api_report_and_analytics_Pending_vs_completed_draws_pie_chart(APIView):
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function report_and_analytics_winners_vs_losers_chart_function,report_and_analytics_winners_vs_losers_chart_export_function function)
class WinnersVsLosersChartAPI(APIView):
    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        
        today_winners = Winner.objects.filter(created_at__date=today).count()
        
        winning_lotteries = Winner.objects.filter(
            created_at__date=today
        ).values_list('lottery_event', flat=True).distinct()
        
        participants = PaymentLottery.objects.filter(
            lottery_event__in=winning_lotteries,
            payment_status='completed'
        ).values('user').distinct().count()
        
        today_losers = participants - today_winners if participants > today_winners else 0
        
        weekly_data = []
        for i in range(7):
            day = week_ago + timedelta(days=i)
            
            day_winners = Winner.objects.filter(created_at__date=day).count()
            
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the function report_and_analytics_overall_transaction_report_chart_export_function,report_and_analytics_overall_transaction_report_chart_function function)
class OverallTransactionReportView(APIView):
    def get(self, request):
        current_year = datetime.now().year
        current_month = datetime.now().strftime('%B %Y')
        
        queryset = PaymentLottery.objects.filter(
            payment_at__year=current_year,
            payment_status__in=['completed', 'refunded']
        ).annotate(
            month=TruncMonth('payment_at')
        ).values('month', 'payment_status').annotate(
            total_amount=Sum('amount')
        ).order_by('month')
        
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        successful = [0] * 12
        refunded = [0] * 12
        
        for entry in queryset:
            month_index = entry['month'].month - 1
            if entry['payment_status'] == 'completed':
                successful[month_index] = float(entry['total_amount'])
            elif entry['payment_status'] == 'refunded':
                refunded[month_index] = float(entry['total_amount'])
        
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

from django.db.models.functions import TruncDate
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WinnersWallWinnersList
from datetime import datetime
#!-----winner.html-custom.js-function fetchWinnersusersdraw()-----!
class WinnersWallListView(APIView):
    def get(self, request, *args, **kwargs):

        winners = WinnersWallWinnersList.objects.filter(flag=True).order_by('-draw_date')
        
        grouped_winners = defaultdict(list)
        for winner in winners:

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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the  report_and_analytics_marginal_chart_function function)
class MarginalChartDataView(APIView):
    def get(self, request):
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        lotteries_query = Q(created_at__year=year)
        if month and month != 'all':
            lotteries_query &= Q(created_at__month=month)
        
        lotteries = LotteryEvent.objects.filter(lotteries_query).select_related('category')
        
        payments = PaymentLottery.objects.filter(
            lottery_event__in=lotteries,
            payment_status='completed'
        )
        
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
        
        overall_sales = sum(item['total_sales'] for item in data)
        overall_target = sum(item['total_amount'] for item in data)
        overall_margin = overall_sales - overall_target
        overall_status = 'Reached' if overall_margin >= 0 else 'Not Reached'
        
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the  report_and_analytics_marginal_chart_export_function function)
class MarginalChartExportView(APIView):
    def get(self, request):
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        view = MarginalChartDataView()
        response = view.get(request)
        data = response.data['data']
        overall = response.data['overall']
        
        df = pd.DataFrame(data)
        df = df[['category', 'total_sales', 'total_amount', 'margin', 'margin_status']]
        df.columns = ['Category', 'Sales', 'Target', 'Margin', 'Status']
        
        overall_df = pd.DataFrame([{
            'Category': 'TOTAL',
            'Sales': overall['total_sales'],
            'Target': overall['total_target'],
            'Margin': overall['margin'],
            'Status': overall['margin_status']
        }])
        df = pd.concat([df, overall_df])
        
        output = BytesIO()
        writer = pd.ExcelWriter(output, engine='xlsxwriter')
        df.to_excel(writer, sheet_name='Margin Chart', index=False, startrow=2)
        
        workbook = writer.book
        worksheet = writer.sheets['Margin Chart']
        
        title_format = workbook.add_format({
            'bold': True,
            'size': 16,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        month_name = calendar.month_name[int(month)] if month and month != 'all' else ''
        title = f'Margin Chart - {year}' + (f' {month_name}' if month_name else '')
        worksheet.merge_range('A1:E1', title, title_format)
        
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
        
        data_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        money_format = workbook.add_format({
            'num_format': '£#,##0.00',
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
        
        for row_num in range(3, len(df) + 3):
            for col_num in range(5): 
                if col_num in [1, 2, 3]: 
                    worksheet.write(row_num, col_num, df.iloc[row_num-3, col_num], money_format)
                elif col_num == 4: 
                    status = df.iloc[row_num-3, col_num]
                    if status == 'Reached':
                        worksheet.write(row_num, col_num, status, reached_format)
                    else:
                        worksheet.write(row_num, col_num, status, not_reached_format)
                else:
                    worksheet.write(row_num, col_num, df.iloc[row_num-3, col_num], data_format)
        
        worksheet.set_column('A:A', 20)
        worksheet.set_column('B:D', 15)
        worksheet.set_column('E:E', 15)
        
        writer.close()
        output.seek(0)
        
        month_name = calendar.month_name[int(month)].title() if month and month != 'all' else ''
        filename = f'margin_chart_{year}' + (f'_{month_name}' if month_name else '') + '.xlsx'
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename={filename}'
        return response


from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from datetime import datetime, timedelta
from .models import Winner, LotteryEvent
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_function function)
class overall_won_and_lost_lotteries_report_LotteryReportAPI(APIView):
    def get(self, request):
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
# custom_admin_dashboard.html (adminpanel template)
# custom.js (JavaScript handling the admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_function function)
class overall_won_and_lost_lotteries_report_LotteryReportExportAPI(APIView):
    def get(self, request):
        output = BytesIO()

        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('Lottery Report')
        
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
        
        worksheet.merge_range('A1:D1', 'Overall Won and Lost Lotteries Report', title_format)
        
        worksheet.write('A2', 'Year', header_format)
        worksheet.write('B2', 'Won', header_format)
        worksheet.write('C2', 'Lost', header_format)
        worksheet.write('D2', 'Total', header_format)
        
        row = 2
        for item in data:
            worksheet.write(row, 0, item['year'], data_format)
            worksheet.write(row, 1, item['won'], data_format)
            worksheet.write(row, 2, item['lost'], data_format)
            worksheet.write(row, 3, item['won'] + item['lost'], data_format)
            row += 1
        
        worksheet.write(row, 0, 'Total', total_format)
        worksheet.write(row, 1, total_won, total_format)
        worksheet.write(row, 2, total_lost, total_format)
        worksheet.write(row, 3, total_won + total_lost, total_format)
        
       
     
        worksheet.set_column('A:A', 12)
        worksheet.set_column('B:D', 12)
        
        workbook.close()
        
        output.seek(0)
        
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
#!-----my_won_lottery_page.html-custom.js-function fetch("/api/my-won-lottery/",-----!
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_won_lottery(request):
    winners = Winner.objects.filter(user=request.user).order_by('-created_at')
    serializer = WonLotteryWinnerSerializer(winners, many=True)
    return Response(serializer.data)
