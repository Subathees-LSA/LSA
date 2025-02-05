
from django.urls import path
from .views import *
from .services import *
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.conf.urls import handler404


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
         name='delete_lottery_event_image'),   
    path('faq/', faq_page, name='faq_page'), 
    path('terms/', terms_page, name='terms_page'), 
    path('api/contact/', ContactCreateView.as_view(), name='contact-create'),
    
    path('about-us/', about_us, name='about_us'),  

    path('api/admin/messages/', ContactListView.as_view(), name='contact-list'),
    path('api/admin/reply/', AdminReplyView.as_view(), name='admin-reply'),
    path('contact-reply/', admin_contact_reply_page, name='admin-contact-reply'),
    path('api/delete_user/<int:user_id>/', UserProfileDeleteAPIView.as_view(), name='delete_user'),
    path('api/lottery/categories/', get_lottery_categories, name='api_get_lottery_categories'),
    path('api/categories/', GetLotteryCategories.as_view(), name='get-lottery-categories'),
    path('api/get_category_lottery_events/<int:category_id>/', APIGetCategoryLotteryEvents.as_view(), name='api_get_category_lottery_events'),
    path('category_lottery_events/<str:category_name>/', category_lottery_events_view, name='category_lottery_events'),
    path('api/admin/chat/<str:email>/', ChatMessagesView.as_view(), name='chat-messages'),
    path('api/admin/delete-contact/<str:email>/', DeleteContactView.as_view(), name='delete-contact'),
    path('api/user/chat/', UserChatView.as_view(), name='api_user_chat'),
    
    path('api/admin/reply/<int:reply_id>/edit_delete/', EditdeleteAdminReplyView.as_view(), name='edit_delete-admin-reply'),
    path('api/admin/messages/', ContactListView.as_view(), name='contact-list'),
    path('api/admin/reply/', AdminReplyView.as_view(), name='admin-reply'),
    path('api/banner/', BannerView.as_view(), name='api_banner'),
    path('api/previous-winners/', PreviousWinnersimgAPIView.as_view(), name='api_get_previous_winners'),
    path('api/lottery_sales_bar_chart/', lottery_sales_bar_chart_View.as_view(), name='api_lottery_sales_bar_chart'),
    path('api/lottery_sales_available_years/', lottery_sales_availableYearsView.as_view(), name='api_lottery_sales_available_years'),
    path('api/leaderboard/', LeaderboardAPIView.as_view(), name='leaderboard_api'),
    path('api/user-statistics/', user_statistics, name='user-statistics'),
    path('api/statistics/', LotteryStatisticsView.as_view(), name='lottery_statistics'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'adminpanel.urls.custom_404'

