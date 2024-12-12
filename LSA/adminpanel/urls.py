
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
    path('cart/', cart, name='cart'),
    path('api/add-to-cart/', add_to_cart, name='add_to_cart'),
    path('api/get-cart/', get_cart, name='api_get_cart'),
    path('api/remove-from-cart/', remove_from_cart, name='api_remove_from_cart'),
    path('api/update-cart/', update_cart, name='api_update_cart'),
    path('api/lottery_detail/<slug:slug>/', LotteryDetail.as_view(), name='api_get_lottery_event_detail'),
    path('lottery_detail/<slug:slug>/', lottery_detail_view, name='lottery_detail'),
    path('api/add_to_favorites/', add_to_favorites, name='add_to_favorites'),
    path('favorites/', favorites_page, name='favorites'),
    path('api/get_favorites/', get_favorites, name='get_favorites'),
    path('api/navbar_access_tabsView/', api_navbar_access_tabsView.as_view(), name='api_navbar_access_tabsView'),
    path('api/dashboard_preview_admin_view/', api_dashboard_preview_admin_view.as_view(), name='api_dashboard_preview_admin_view'),
    path('admin_logout_view/', admin_logout_view, name='admin_logout_view'),  
    path('lottery-events/<int:event_id>/additional-images/<int:image_id>/delete/',DeleteLotteryEventImageView.as_view(), 
         name='delete_lottery_event_image')    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

