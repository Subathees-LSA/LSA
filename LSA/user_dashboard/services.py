from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from user_registration.models import UserPrivacy


@login_required(login_url='user_login')
def personal_info_view(request):
    """Render the Personal Info Page"""
    user_privacy, _ = UserPrivacy.objects.get_or_create(user=request.user)
    return render(request, "personal_info.html", {"user_privacy": user_privacy})


from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from user_registration.models import UserPrivacy  # Corrected import
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django_user_agents.utils import get_user_agent
from django.http import JsonResponse
from django.utils.timezone import now
from user_registration.models import UserDeviceHistory
from django.utils import timezone
from django.contrib.sessions.models import Session
from user_agents import parse
from django.contrib.auth import logout


@login_required(login_url='user_login')
def login_security(request):
    device_history = UserDeviceHistory.objects.filter(user=request.user, logout_time__isnull=True).order_by('-login_time')

    return render(request, "login_security.html", {"device_history": device_history})


