from rest_framework import permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from user_registration.models import UserPrivacy
from user_registration.serializers import UserPrivacySerializer

class UserPrivacyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Allow file uploads

    def get(self, request):
        """Retrieve user's profile info"""
        user_privacy, _ = UserPrivacy.objects.get_or_create(user=request.user)
        serializer = UserPrivacySerializer(user_privacy)
        return Response(serializer.data, status=200)

    def put(self, request):
        """Update user's profile info"""
        user_privacy, _ = UserPrivacy.objects.get_or_create(user=request.user)
        serializer = UserPrivacySerializer(user_privacy, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully", "data": serializer.data}, status=200)

        return Response({"error": serializer.errors}, status=400)  # ✅ Always return JSON, not Django error page

from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from user_registration.models import UserPrivacy  # Corrected import
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django_user_agents.utils import get_user_agent
from django.http import JsonResponse
from django.utils.timezone import now
from django.contrib.sessions.models import Session
from django.contrib.auth import logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from user_registration.models import UserDeviceHistory

class LogoutDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip_address = request.data.get("ip_address")

        if not ip_address:
            return Response({"success": False, "message": "IP address is required."}, status=400)

        try:
            device = UserDeviceHistory.objects.filter(
                user=request.user, 
                ip_address=ip_address, 
                logout_time__isnull=True
            ).first()

            if not device:
                return Response({"success": False, "message": "Device not found."}, status=404)

            # Check if user is logging out from their own session
            is_current_session = (request.META.get('REMOTE_ADDR') == ip_address)

            # Delete session
            sessions = Session.objects.filter(expire_date__gte=now())
            for session in sessions:
                session_data = session.get_decoded()
                if session_data.get('_auth_user_id') == str(request.user.id):
                    session.delete()

            logout(request)  # Log out user
            device.logout_time = now()
            device.save()

            return Response({
                "success": True, 
                "message": "Device logged out successfully.",
                "is_current_session": is_current_session
            })

        except Exception as e:
            return Response({"success": False, "message": f"An error occurred: {str(e)}"}, status=500)


from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.http import JsonResponse

@login_required
@csrf_exempt
def update_password(request):
    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)  # Important to keep the user logged in
            return JsonResponse({"success": True, "message": "Password updated successfully!"})
        else:
            return JsonResponse({"success": False, "message": "Invalid password."}, status=400)
    return JsonResponse({"success": False, "message": "Invalid request method."}, status=400)


    # user_dashboard/views.py
from django.shortcuts import render

def subscription_page(request):
    return render(request, 'subscription_page.html')