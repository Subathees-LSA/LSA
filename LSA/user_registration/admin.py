from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponse
from django.shortcuts import render
from django.core.files.base import ContentFile
import base64
from .models import UserProfile

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'newsletter', 'is_verified', 'kyc_status', 'view_kyc_image')


    def view_kyc_image(self, obj):
        if obj.kyc_image:

            image_data = base64.b64decode(obj.kyc_image)
            image_file = ContentFile(image_data)

            image_url = f"view_kyc_image/{obj.id}/"
            return format_html('<a href="{}" target="_blank">View Image</a>', image_url)
        return "No Image"
    view_kyc_image.short_description = "KYC Image"

    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('view_kyc_image/<int:profile_id>/', self.view_image, name='view_kyc_image')
        ]
        return custom_urls + urls

    def view_image(self, request, profile_id):

        user_profile = UserProfile.objects.get(id=profile_id)
        if user_profile.kyc_image:
            
            image_data = base64.b64decode(user_profile.kyc_image)
            return HttpResponse(image_data, content_type='image/png')
        else:
            return HttpResponse("No Image Available", status=404)

admin.site.register(UserProfile, UserProfileAdmin)
