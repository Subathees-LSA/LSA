from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponse
from django.shortcuts import render
from django.core.files.base import ContentFile
import base64
from .models import *

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
from django.contrib import admin
from django.utils.html import format_html
from .models import UserPrivacy

@admin.register(UserPrivacy)
class UserPrivacyAdmin(admin.ModelAdmin):
    list_display = ('user', 'two_factor_auth_enabled', 'phone_number', 'city', 'country', 'profile_photo_preview')
    search_fields = ('user__username', 'phone_number', 'city', 'country')
    list_filter = ('two_factor_auth_enabled', 'country')
    readonly_fields = ('otp', 'otp_expiration', 'profile_photo_preview')

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'two_factor_auth_enabled', 'otp', 'otp_expiration')
        }),
        ('Personal Details', {
            'fields': ('dob', 'phone_number', 'profile_photo', 'profile_photo_preview')
        }),
        ('Address Details', {
            'fields': ('address', 'city', 'country', 'postal_code')
        }),
        ('Social Media', {
            'fields': ('website', 'twitter')
        }),
        
    )

    def profile_photo_preview(self, obj):
        if obj.profile_photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.profile_photo.url)
        return "No Image"
    
    profile_photo_preview.short_description = "Profile Photo Preview"

admin.site.site_header = "User Privacy Admin"
admin.site.site_title = "User Privacy Admin Panel"
admin.site.index_title = "Manage User Privacy"

from django.contrib import admin
from user_registration.models import UserDeviceHistory

@admin.register(UserDeviceHistory)
class UserDeviceHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_info', 'ip_address', 'login_time', 'logout_time')
    search_fields = ('user__username', 'ip_address', 'device_info')
    list_filter = ('login_time', 'logout_time')
    readonly_fields = ('user', 'device_info', 'ip_address', 'login_time', 'logout_time')

    def has_add_permission(self, request):
        """Disable adding new records manually."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable editing records manually."""
        return False
