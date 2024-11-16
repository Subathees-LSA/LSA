
from django.urls import path
from .views import *
from .services import *
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('custom/admin/signup/',admin_signup, name='admin_signup'),
    path('api/admin/signup/', api_admin_signup.as_view(), name='api_admin_signup'),
    path('custom/admin/login/', custom_admin_login, name='custom_admin_login'),
    path('api/admin/login/', api_admin_login.as_view(), name='api_admin_login'),
    path('custom/admin/dashboard/', custom_admin_dashboard, name='custom_admin_dashboard'),
    path('lottery-events/', lottery_events, name='lottery_events'),
    path('api/get_lottery_events/', api_get_lottery_events.as_view(), name='api_get_lottery_events'),
    path('api/edit-delete-lottery-events/<int:pk>/', api_edit_delete_lottery_events.as_view(), name='api_edit_delete_lottery_events'),
    path('lottery-events/add/', lottery_events_add, name='lottery_events_add'),
    path('api/lottery-events/add/', api_lottery_events_add.as_view(), name='api_lottery_events_add'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

