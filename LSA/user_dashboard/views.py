"""personal.html--js-function piValidateForm()"""
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

        return Response({"error": serializer.errors}, status=400) 
"""login_security.html--js-function logoutDevice(sessionKey, button)"""
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from user_registration.models import UserPrivacy  # Corrected import
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django_user_agents.utils import get_user_agent
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
        session_key = request.data.get("session_key")

        if not session_key:
            return Response({"success": False, "message": "Session key is required."}, status=400)

        try:
            # Find the session and delete only that specific session
            session = Session.objects.filter(session_key=session_key).first()
            if not session:
                return Response({"success": False, "message": "Session not found."}, status=404)

            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')

            # Ensure the session belongs to the authenticated user
            if str(user_id) != str(request.user.id):
                return Response({"success": False, "message": "Unauthorized action."}, status=403)

            # Check if the user is logging out their current session
            is_current_session = (session_key == request.session.session_key)

            # Delete the session
            session.delete()

            # Update the logout time in UserDeviceHistory
            UserDeviceHistory.objects.filter(user=request.user, session_key=session_key, logout_time__isnull=True).update(logout_time=now())

            # If user is logging out their own session, log them out
            if is_current_session:
                logout(request)

            return Response({
                "success": True,
                "message": "Device logged out successfully.",
                "is_current_session": is_current_session,
                "redirect_url": "/login/" 
            })

        except Exception as e:
            return Response({"success": False, "message": f"An error occurred: {str(e)}"}, status=500)


from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.http import JsonResponse
from django.contrib.auth import update_session_auth_hash
from django.contrib.sessions.models import Session

@login_required
@csrf_exempt
def update_password(request):
    if request.method == "POST":
        user = request.user
        old_password = request.POST.get("old_password")
        new_password1 = request.POST.get("new_password1")
        new_password2 = request.POST.get("new_password2")

        if not user.check_password(old_password):
            return JsonResponse({"success": False, "message": "Incorrect current password."})

        if new_password1 != new_password2:
            return JsonResponse({"success": False, "message": "Passwords do not match."})

        # Save the current session key before rotation
        old_session_key = request.session.session_key

        user.set_password(new_password1)
        user.save()

        # This rotates the session key
        update_session_auth_hash(request, user)

        # Get the new session key
        new_session_key = request.session.session_key

        # ✅ Update the UserDeviceHistory record with the new session key
        from user_registration.models import UserDeviceHistory
        UserDeviceHistory.objects.filter(user=user, session_key=old_session_key).update(session_key=new_session_key)

        return JsonResponse({"success": True, "message": "Password updated successfully!"})

    return JsonResponse({"success": False, "message": "Invalid request."})

"""subscription_page.html"""
from django.shortcuts import render
def subscription_page(request):
    return render(request, 'subscription_page.html')