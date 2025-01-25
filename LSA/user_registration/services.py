  #!------------- bussiness logic views ------------!
  
from django.contrib.auth.decorators import user_passes_test
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import UserProfile
from django.utils.html import format_html
import base64
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import logout
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model
import random
from django.http import HttpResponseForbidden, HttpResponseServerError

User = get_user_model()

def user_chats(request):
    try:
        if not request.user.is_authenticated or not User.objects.filter(id=request.user.id).exists():
            return redirect('/login/')  # Redirects unauthenticated users or those not in User table
        return render(request, 'user_chats.html')
    except Exception as e:
        return HttpResponseServerError(f"Error rendering user chat page")

def contact_page(request):
    try:
        if not request.user.is_authenticated or not User.objects.filter(id=request.user.id).exists():
            return redirect('/login/')  # Redirects unauthenticated users or those not in User table
        return render(request, 'contact.html')
    except Exception as e:
        return HttpResponseServerError("Sorry, the Contact Us page is currently unavailable. Please try again later.")

def user_signup(request):
    return render(request, 'signup.html')


def user_login(request):
    return render(request, 'login.html')


@user_passes_test(lambda u: u.is_staff)
def user_list_details(request):
    return render(request, 'user_list_details.html')

@user_passes_test(lambda u: u.is_staff)
def user_kyc_waiting_list_details(request):
    return render(request, 'user_kyc_waiting_list_details.html')

def user_welcome_page(request):
    # Check if user is authenticated and exists in User table
    if not request.user.is_authenticated or not User.objects.filter(id=request.user.id).exists():
        return redirect('/login/')  # Redirects unauthenticated users or those not in User table
    
    return render(request, 'user_welcome_page.html')

#try exceptionssssss
def user_logout(request):
    logout(request)  # Logs out the user
    return redirect('/login/')  # Redirects to the login page after logout





def check_username(request):
    try:
        username = request.GET.get('username')
        if not username:
            return JsonResponse({'error': 'Username parameter is missing'}, status=400)
        
        exists = User.objects.filter(username=username).exists()
        
        # If username exists, suggest a new one
        suggestion = None
        if exists:
            # Generate a suggestion, e.g., by appending random numbers to the original username
            suggestion = f"{username}{random.randint(1, 1000)}"
        
        return JsonResponse({'exists': exists, 'suggestion': suggestion})
    except Exception as e:
        return JsonResponse({'error': f"An error occurred: {str(e)}"}, status=500)


def check_email(request):
    try:
        email = request.GET.get('email', None)
        if not email:
            return JsonResponse({'error': 'Email parameter is missing'}, status=400)
        
        exists = User.objects.filter(email=email).exists()
        return JsonResponse({'exists': exists})
    except Exception as e:
        return JsonResponse({'error': f"An error occurred: {str(e)}"}, status=500)



def view_image(request, profile_id):
    try:
        # Get the user profile object
        user_profile = get_object_or_404(UserProfile, id=profile_id)

        if user_profile.kyc_image:
            # Decrypt the image (base64 decode here if needed)
            image_data = base64.b64decode(user_profile.kyc_image)  # If image is base64-encoded
            return HttpResponse(image_data, content_type='image/png')  # Adjust content type if needed (e.g., 'image/jpeg')
        else:
            return HttpResponse("No Image Available", status=404)

    except UserProfile.DoesNotExist:
        return HttpResponse("Profile not found", status=404)
    except Exception as e:
        return HttpResponse(f"An error occurred: {str(e)}", status=500)


def view_kyc_image(self, obj):
    try:
        if obj.kyc_image:
            # Generate the link to view the image
            image_url = f"/view_kyc_image/{obj.id}/"  # The URL for viewing the image
            return format_html('<a href="{}" target="_blank">View Image</a>', image_url)
        return "No Image"
    except AttributeError:
        return "Error retrieving KYC image"
    except Exception as e:
        return f"An error occurred: {str(e)}"
view_kyc_image.short_description = "KYC Image"





def password_reset_request_page(request):
    return render(request, 'password_reset.html')


def password_reset_confirm_page(request, uidb64, token):
    try:
        # Decode the uid
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None


    try:
        # Check if the token is valid
        if user is not None and default_token_generator.check_token(user, token):
            # Token is valid, proceed with password reset form rendering
            return render(request, 'password_reset_confirm.html', {'uidb64': uidb64, 'token': token})
    except Exception as e:
        messages.error(request, f"An error occurred: {str(e)}")
        return redirect(reverse('password_reset_page'))  # Assuming the URL name for password reset request is 'password_reset_request'


    # Token is invalid, redirect to the reset request page with error message
    messages.error(request, "The reset link is invalid. Please request a new one.")
    return redirect(reverse('password_reset_page'))



def check_reset_token(uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return False


    try:
        return default_token_generator.check_token(user, token)
    except Exception:
        return False



