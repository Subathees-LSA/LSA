 #!------------- both api and bussiness logic urls ------------!
 
from django.urls import path
from .views import *
from .services import *
from django.shortcuts import render

urlpatterns = [
    #!------------- html urls ------------!
    path('',user_signup, name='user_signup'),  
    path('login/',user_login, name='user_login'), 
    path('user_welcome_page/',user_welcome_page, name='user_welcome_page'),
    path('user_logout/', user_logout, name='user_logout'),  
    path('user_list_details/', user_list_details, name='user_list_details'),
    path('user_kyc_waiting_list_details/', user_kyc_waiting_list_details, name='user_kyc_waiting_list_details'),   
    path('check-username/', check_username, name='check_username'),
    path('check-email/', check_email, name='check_email'),
    path('view_kyc_image/<int:profile_id>/', view_image, name='view_kyc_image'),
    path('password-reset/', password_reset_request_page, name='password_reset_page'),
    path('password-reset-confirm/<uidb64>/<token>/', password_reset_confirm_page, name='password_reset_confirm_page'),
      
   #!-------------  api urls ------------!
    path('api/v1/register/', RegisterView.as_view(), name='register'),
    path('api/v1/login/', LoginView.as_view(), name='login'),
    path('api/kyc-status/', KYCStatusView.as_view(), name='kyc-status'),
    path('api/kyc-upload/', KYCUploadView.as_view(), name='kyc-upload'),
    path('api/user-list/', UserListView.as_view(), name='user-list'), 
    path('api/user-kycwaitinglist/', UserKycWaitingListView.as_view(), name='user-kycwaitinglist'),
    path('api/user-kyc-status-update/', UpdateKYCStatusView.as_view(), name='user-kyc-status-update'),
    path('api/password-reset/', ApiPasswordResetRequestView.as_view(), name='api_password_reset'),
    path('api/password-reset-confirm/<uidb64>/<token>/', ApiPasswordResetConfirmView.as_view(), name='api_password_reset_confirm'),
]
