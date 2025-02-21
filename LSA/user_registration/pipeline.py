from django.contrib.auth import get_user_model
from .models import UserProfile
from django.db import transaction
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import redirect

User = get_user_model()

@transaction.atomic
def save_user_profile(backend, user, response, *args, **kwargs):
    """
    Custom pipeline step to save or merge user data in the UserProfile model.
    """
    if backend.name == 'google-oauth2':
        email = response.get('email', '')
        first_name = response.get('given_name', '')
        last_name = response.get('family_name', '')
        is_verified = response.get('email_verified', False)

        if email:
            # Check if a user with the same email already exists
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                backend.strategy.request.session['google_user_email'] = email  
                backend.strategy.request.session.modified = True 
                # Store email in a cookie (without returning response)
                backend.strategy.request.COOKIES["google_user_email"] = email  

                if user != existing_user:
                    # Merge Google user data into the existing user
                    existing_user.first_name = first_name or existing_user.first_name
                    existing_user.last_name = last_name or existing_user.last_name
                    existing_user.save()

                    # Use the existing user for the session
                    user = existing_user

            # Ensure the existing user is updated or the new user is handled correctly
            user.email = email
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
            user.save()

            # Ensure a UserProfile instance exists
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'is_verified': is_verified,
                    'newsletter': True,  # Default value
                },
            )
              # 🔹 Check if the user has a password; if not, redirect to password reset confirm page
            if not user.has_usable_password():
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                return redirect(f"/password-reset-confirm/{uidb64}/{token}/")  # Updated

            
def link_to_existing_user(backend, user, response, *args, **kwargs):
    if backend.name == 'google-oauth2':
        email = response.get('email', '')
        if email:
            # Try to find the existing user by email
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                sociallogin = kwargs.get('sociallogin')
                if sociallogin:
                    sociallogin.user = existing_user  # Assign the existing user
                    sociallogin.connect(request=None, user=existing_user)  # Link accounts
                return {'user': existing_user} 