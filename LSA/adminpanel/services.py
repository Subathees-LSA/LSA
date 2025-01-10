
# #!------------- bussiness logic views ------------!

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from django.http import HttpResponseForbidden
from django.http import HttpResponseForbidden, HttpResponseServerError
from .models import LotteryEvent
from django.shortcuts import render,get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from .models import LotteryCategory


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


def admin_logout_view(request):
    try:
        logout(request)
        return render(request, 'custom_admin_login.html')
    except Exception as e:
        # Return an error page or a generic response
        return HttpResponseServerError(f"An error occurred during logout.")


@login_required(login_url='custom_admin_login')
def custom_admin_dashboard(request):
    try:
        admin_profile = getattr(request.user, 'adminprofile', None)
        role = admin_profile.role if admin_profile else None
        if request.user.is_staff or role == 'sales' :
            return render(request, 'custom_admin_dashboard.html')
        else:
            return HttpResponseForbidden("You do not have permission to access this page.")
    except Exception as e:
        return HttpResponseForbidden("An unexpected error occurred: " + str(e))        

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


def favorites_page(request):
    return render(request, 'favorites.html')

def faq_page(request):
    try:
        return render(request, 'faq.html')
    except Exception as e:
        return HttpResponseServerError("Sorry, the FAQ page is currently unavailable. Please try again later.")

def terms_page(request):
    try:
        return render(request, 'terms_page.html')
    except Exception as e:
        return HttpResponseServerError("Sorry, the Terms and Conditions page is currently unavailable. Please try again later.")

def about_us(request):
    try:
        return render(request, "about_us.html")
    except Exception as e:
        return HttpResponseServerError("Sorry, the about Us page is currently unavailable. Please try again later.")


def custom_404(request, exception):
    try:
        return render(request, "404.html", status=404)
    except Exception as e:
        return HttpResponseServerError("Sorry, the 404 page page is currently unavailable. Please try again later.")

@login_required(login_url='custom_admin_login')
def admin_contact_reply_page(request):
    """
    Renders the admin contact reply page for processing user messages.
    """
    if not request.user.is_staff:
        return HttpResponseForbidden("You do not have permission to access this page.")
    return render(request, 'admin_contact_reply.html')

def get_lottery_categories(request):
    categories = LotteryCategory.objects.all()    # Get all categories
    category_data = [{"id": category.id, "name": category.name} for category in categories]    
    return JsonResponse(category_data, safe=False)


def category_lottery_events_view(request, category_name):
    try:
        category = LotteryCategory.objects.get(name=category_name)
        return render(request, 'category_lottery_events.html', {'category_id': category.id, 'category_name': category.name})
    except LotteryCategory.DoesNotExist:
        return render(request, '404.html', status=404)