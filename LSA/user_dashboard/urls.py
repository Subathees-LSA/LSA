from django.urls import path
from .services import * 
from user_dashboard.views import UserPrivacyView  
from .views import  LogoutDeviceView
from .views import *
urlpatterns = [
    # Web Rendering (HTML Page)
    path('personal-info/', personal_info_view, name='personal-info-web'),
    # API Endpoint
    path('api/personal-info/', UserPrivacyView.as_view(), name='personal-info-api'),
    # Login and Security
    path("login-security/", login_security, name="login_security"),
    path("api/logout-device/", LogoutDeviceView.as_view(), name="logout_device"),  # No IP in URL
    path('update-password/', update_password, name='update_password'),
    path('subscription/', subscription_page, name='subscription_page'),
]