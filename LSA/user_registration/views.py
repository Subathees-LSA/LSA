 #!------------- api logics ------------!
 #!------------- signup.html,js line.no:5941 ------------!
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import RegisterSerializer, LoginSerializer
from django.shortcuts import render
from .serializers import UserDetailsSerializer
from rest_framework.permissions import IsAdminUser  
from .models import UserProfile
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import login
from rest_framework import status, permissions
from .serializers import KYCUploadSerializer,UserKycwaitingDetailsSerializer
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse  # Import reverse
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from django.contrib.auth import login
from .serializers import UserPrivacySerializer
from .utils import generate_otp  # Import the function
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import JsonResponse
from user_agents import parse
from user_registration.models import UserDeviceHistory
from django.utils import timezone  
  #ID:LP-I1-start
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    def create(self, request, *args, **kwargs):
        try:
            # Check if the request comes from a browser
            user_agent = request.headers.get('User-Agent', '')
            if not user_agent or 'Mozilla' not in user_agent:
                return Response(
                    {"detail": "Access denied. This endpoint is restricted to browsers only."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get the IP address from the request
            ip_address = self.get_client_ip(request)

            # Deserialize the data and validate
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Include the IP address in the profile data
            serializer.validated_data['profile']['ip_address'] = ip_address

            # Save the user and return success response
            user = serializer.save()
            return Response({
                "message": "Registration successful.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Log the exception (optional) and return a general error response
            print("Error during registration:", str(e))
            return Response(
                {"detail": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @staticmethod
    def get_client_ip(request):
        """Retrieve the client's IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
#login.html js-5577   #ID:LP-I1-end 
from django.utils.timezone import now
from user_agents import parse
from django.contrib.auth import login
from django.urls import reverse
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import User, UserDeviceHistory, UserPrivacy, UserProfile
from .serializers import LoginSerializer
from django.contrib.sessions.models import Session
from rest_framework.response import Response
from .models import User, UserDeviceHistory, UserPrivacy, UserProfile
from .serializers import LoginSerializer
  #ID:LP-I2-start
class LoginView(APIView):
    def post(self, request):
        user_agent_string = request.headers.get('User-Agent', '')
        parsed_agent = parse(user_agent_string)
        # Extract device info
        device_family = parsed_agent.device.family.strip() if parsed_agent.device.family else "Unknown Device"
        os_family = parsed_agent.os.family.strip() if parsed_agent.os.family else "Unknown OS"
        browser_family = parsed_agent.browser.family.strip() if parsed_agent.browser.family else "Unknown Browser"
        # Fix for "Other" device detection
        if device_family.lower() in ["other", "generic"]:
            device_family = "Unknown Device"
        device_info = f"{device_family} - {os_family} - {browser_family}"
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            try:
                user = User.objects.get(email=email)
                user_profile = UserProfile.objects.filter(user=user).first()
                user_privacy, created = UserPrivacy.objects.get_or_create(user=user)
                if user_profile and user_profile.is_blocked:
                    return Response({"error": "You are blocked."}, status=status.HTTP_403_FORBIDDEN)
                if user.check_password(password):
                    ip_address = self.get_client_ip(request)
                    # Log the user in
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    # Get session key
                    session_key = request.session.session_key
                    # Store session details in `UserDeviceHistory`
                    UserDeviceHistory.objects.create(
                        user=user,
                        device_info=device_info,
                        ip_address=ip_address,
                        login_time=now(),
                        session_key=session_key,  
                        logout_time=None
                    )

                    # Update UserPrivacy with latest login details
                    user_privacy.ip_address = ip_address
                    user_privacy.device_info = device_info
                    user_privacy.last_active = now()
                    user_privacy.save()

                    # 🔐 Handle Two-Factor Authentication (2FA)
                    if user_privacy.two_factor_auth_enabled:
                        otp = self.generate_otp()
                        user_privacy.set_otp(otp)
                        send_mail(
                            'Your OTP Code',
                            f'Your OTP code is {otp}. It is valid for the next 5 minutes.',
                            settings.DEFAULT_FROM_EMAIL,
                            [user.email],
                            fail_silently=False,
                        )
                        return Response({
                            "message": "OTP sent to your email.",
                            "user_id": user.id
                        }, status=status.HTTP_200_OK)
                    # If 2FA is disabled, log in and redirect
                    return Response({
                        "message": "Login successful.",
                        "session_key": session_key,  # 💡 Return session key for frontend tracking
                        "redirect_url": reverse('lottery_events')
                    }, status=status.HTTP_200_OK)

                return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

            except User.DoesNotExist:
                return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @staticmethod
    def get_client_ip(request):
        """Retrieve the client's IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
#ID:LP-I2-end   
#!-----lottery_events.html-custom.js- function checkKYCStatus(); #ID:LP-I7-start-----!
class KYCStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            if not request.user.is_authenticated:
               return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            profile = UserProfile.objects.get(user=request.user)
            kyc_status = profile.kyc_status
           
            status_messages = {
                'pending': ("KYC Verification", "Please upload a valid ID image for verification."),
                'rejected': ("KYC Rejected", "Your KYC submission has been rejected. Please upload a valid image."),
                'verified': ("KYC Verified", "Your KYC has been successfully verified."),
                'waiting': ("KYC Under Review", "Your KYC verification is currently being processed.")
            }

            title, message = status_messages.get(kyc_status, ("Unknown Status", "Unknown KYC status."))      
            show_kyc_window = False
            if kyc_status != 'verified':
                show_kyc_window = True  
            elif kyc_status == 'verified' and not profile.kyc_window_shown:
                show_kyc_window = True

            
            if kyc_status == 'verified' and show_kyc_window:
                profile.kyc_window_shown = True
                profile.save()

            
            response_data = {
                'kyc_status': kyc_status,
                'kyc_window_shown': show_kyc_window,
                'kyc_title': title,
                'kyc_message': message,
            }

            return Response(response_data)

        except UserProfile.DoesNotExist:
            return Response({'error': 'UserProfile does not exist'}, status=status.HTTP_400_BAD_REQUEST)
#!-----lottery_events.html-custom.js- function checkKYCStatus(); #ID:LP-I7-end-----!

#!-----lottery_events.html-custom.js- function handleKYCForm()  #ID:LP-I7-start-----!
class KYCUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)


        serializer = KYCUploadSerializer(data=request.data)
        if serializer.is_valid():
            try:

                serializer.update(profile, serializer.validated_data)

                
                profile.kyc_status = 'waiting'
                profile.save()
                return Response({'status': 'success'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Failed to save KYC data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        
        try:

            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)


        status_update = request.data.get('kyc_status', None)
        if status_update:
            if status_update in ['rejected', 'pending', 'verified']:
                try:
                    
                    profile.kyc_status = status_update
                    profile.kyc_window_shown = False if status_update != 'verified' else profile.kyc_window_shown
                    profile.save()
                    return Response({'status': 'success'}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({'error': f'Failed to update KYC status: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'No status provided'}, status=status.HTTP_400_BAD_REQUEST)
#!-----lottery_events.html-custom.js- function handleKYCForm()  #ID:LP-I7-end-----!
       
class UserListView(generics.ListAPIView):
    serializer_class = UserDetailsSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        try:
            return UserProfile.objects.all()
        except Exception as e:
            
            return Response(
                {"error": "An error occurred while fetching the KYC waiting list."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class UserKycWaitingListView(generics.ListAPIView):
    serializer_class = UserKycwaitingDetailsSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        try:
            return UserProfile.objects.filter(kyc_status='waiting')
        except Exception as e:
            
            return Response(
                {"error": "An error occurred while fetching the KYC waiting list."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class UpdateKYCStatusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user_id = request.data.get("user_id")
        new_status = request.data.get("kyc_status")

        try:
            user_profile = UserProfile.objects.get(user__id=user_id)
            user_profile.kyc_status = new_status
            user_profile.save()
            return Response({"status": "KYC status updated successfully"}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({"error": "UserProfile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
 #!------------- password rest.html #ID:LP-I2-start------------!
class ApiPasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "No user found with this email"}, status=status.HTTP_404_NOT_FOUND)


            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Generate the reset URL
            reset_url = f"{request.scheme}://{request.get_host()}{reverse('password_reset_confirm_page', kwargs={'uidb64': uidb64, 'token': token})}"
            
            # Define the HTML message with a button
            html_message = f"""
<div style="max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
    <p style="color: #555;">
        We received a request to reset your password. Click the button below to reset it:
    </p>
    <div style="text-align: center; margin: 20px 0;">
        <a href="{reset_url}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
    </div>
    <p style="color: #555;">
        This link is valid for a single use and expires in 24 hours.
        If you did not request this, please ignore this email.
    </p>
</div>
"""
            # Send the email
            try:
                send_mail(
                    subject="Password Reset Requested",
                    message=f"Use this link to reset your password: {reset_url}",  # Plain text version for compatibility
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    html_message=html_message,  # Include HTML version
                )
            except Exception as e:
                return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            return Response({"message": "Password reset link sent"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#password_confirm.html
class ApiPasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid or expired link"}, status=status.HTTP_400_BAD_REQUEST)
        if default_token_generator.check_token(user, token):
            serializer = PasswordResetConfirmSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user)
                return Response({"message": "Password has been reset"}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


        return Response({"error": "Token expired or invalid"}, status=status.HTTP_400_BAD_REQUEST)
 #ID:LP-I2-end
#privacy.html 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserPrivacy
from .serializers import UserPrivacySerializer
from rest_framework.permissions import IsAuthenticated

class PrivacySecurityView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        serializer = UserPrivacySerializer(user.userprivacy)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request):
        user = request.user
        user_privacy = user.userprivacy
        serializer = UserPrivacySerializer(user_privacy, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Privacy settings updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.shortcuts import redirect
from user_registration.utils import verify_otp  
class VerifyOTPView(APIView):
    def post(self, request):
        user_id = request.data.get("user_id")  # Retrieve `user_id` from the request body
        otp = request.data.get("otp")  # Retrieve the `otp` from the request body

        if not user_id or not otp:
            return Response({"error": "User ID and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch the user instance based on the provided `user_id`
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Verify the OTP
        if verify_otp(user, otp):
            # Log in the user after successful OTP verification
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            # Redirect to the `user_welcome_page`
            return Response({
                "message": "Login successful.",
                "redirect_url": request.build_absolute_uri('/user_welcome_page/')  # Adjust path as needed
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from user_registration.services import resend_otp_service

class ResendOTPView(APIView):
    def post(self, request):
        user_id = request.data.get("user_id")  # Retrieve user ID from the request body
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)  # Fetch the user instance
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

        try:
            message = resend_otp_service(user)
            return Response({"message": message}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
#google outh  for signup
from django.urls import path, re_path
from django.shortcuts import redirect
from social_django.views import complete
from social_core.exceptions import AuthCanceled
import logging
logger = logging.getLogger(__name__)
# Custom view to handle AuthCanceled error
def google_auth_complete(request, backend='google-oauth2'):
    try:
        return complete(request, backend=backend)
    except AuthCanceled:
        logger.error("Google Authentication Canceled")
        return redirect('user_signup')  # Redirect to signup page instead of error

#Clearing the session for POP up message
def clear_google_session(request):
    if request.method == "POST":
        request.session.pop("google_user_email", None)  # Remove session key
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"}, status=400)
