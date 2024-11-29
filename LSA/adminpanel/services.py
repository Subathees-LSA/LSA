
# #!------------- bussiness logic views ------------!

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from django.http import HttpResponseForbidden
from django.http import HttpResponseForbidden, HttpResponseServerError
from .models import LotteryEvent
from django.shortcuts import render,get_object_or_404


def admin_signup(request):
    try:
        return render(request, 'admin_signup.html')
    except Exception as e:
        return HttpResponseServerError(f"Error rendering admin signup page")

   
def custom_admin_login(request):
    try:
        return render(request, 'custom_admin_login.html')
    except Exception as e:
        return HttpResponseServerError(f"Error rendering admin login page")


@login_required(login_url='custom_admin_login')
def custom_admin_dashboard(request):
    try:
        # Ensure the user has the correct role to access the admin dashboard
        if request.user.is_staff:  # or use another role check if you have a 'role' field in your model
            return render(request, 'custom_admin_dashboard.html')
        else:
            return HttpResponseForbidden("You do not have permission to access this page.")
    except Exception as e:
        return HttpResponseServerError(f"Error rendering admin dashboard")


def lottery_events(request):
    try:
        return render(request, 'lottery_events.html')
    except Exception as e:
        return HttpResponseServerError(f"Error rendering lottery events page")


def lottery_events_add(request):
    try:
        if request.user.is_staff:  # or use another role check if you have a 'role' field in your model
            return render(request, 'lottery_events_add.html')
        else:
            return HttpResponseForbidden("You do not have permission to access this page.")
    except Exception as e:
        return HttpResponseServerError(f"Error rendering lottery events add page")


def cart(request):
    return render(request, 'cart.html')


def lottery_detail_view(request, slug):
    event = get_object_or_404(LotteryEvent, slug=slug)
    return render(request, 'lottery_detail.html', {'event': event})