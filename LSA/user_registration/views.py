 #!------------- api logics ------------!
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


class LoginView(APIView):
    def post(self, request):
        user_agent = request.headers.get('User-Agent', '')
        if not user_agent or 'Mozilla' not in user_agent:
            return Response(
                {"detail": "Access denied. This endpoint is restricted to browsers only."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    # Specify the backend as a string
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

                    return Response({
                        "message": "Login successful.",
                        "user_id": user.id
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KYCStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
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



class KYCUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Fetch the user's profile
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize and validate the incoming data
        serializer = KYCUploadSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Update the profile with validated data
                serializer.update(profile, serializer.validated_data)

                # Set KYC status to 'waiting'
                profile.kyc_status = 'waiting'
                profile.save()
                return Response({'status': 'success'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Failed to save KYC data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """ Admin can update KYC status to 'rejected' or reset to 'pending' """
        try:
            # Fetch the user's profile
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get the new status from request data
        status_update = request.data.get('kyc_status', None)
        if status_update:
            if status_update in ['rejected', 'pending', 'verified']:
                try:
                    # Update profile status and reset kyc_window_shown if needed
                    profile.kyc_status = status_update
                    profile.kyc_window_shown = False if status_update != 'verified' else profile.kyc_window_shown
                    profile.save()
                    return Response({'status': 'success'}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({'error': f'Failed to update KYC status: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'No status provided'}, status=status.HTTP_400_BAD_REQUEST)

       
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
