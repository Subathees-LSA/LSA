
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
    path('api/get-users/', get_users_table_data, name='get_users_table_data'),
    
	path('api/marginal-chart-data/', MarginalChartDataView.as_view(), name='marginal_chart_data'),
    path('api/marginal-chart-export/', MarginalChartExportView.as_view(), name='marginal_chart_export'),
    path('api/overall_won_and_lost_lotteries_report_LotteryReportAPI/', 
         overall_won_and_lost_lotteries_report_LotteryReportAPI.as_view(), 
         name='overall_won_and_lost_lotteries_report_LotteryReportAPI'),
    path('api/overall_won_and_lost_lotteries_report_LotteryReportExportAPI/', overall_won_and_lost_lotteries_report_LotteryReportExportAPI.as_view(), name='overall_won_and_lost_lotteries_report_LotteryReportExportAPI'),
    # Overall Transaction Report
    path('api/report_and_analytics/overall_transaction_report/', 
         OverallTransactionReportView.as_view(), 
         name='overall_transaction_report'),
    # Number of Winners Today
    path('api/winners-vs-losers-chart/', WinnersVsLosersChartAPI.as_view(), name='winners-vs-losers-chart'),
     # Pending vs Completed Draws
    path('api/report_and_analytics_Pending_vs_completed_draws_pie_chart/', api_report_and_analytics_Pending_vs_completed_draws_pie_chart.as_view(), name='api_report_and_analytics_Pending_vs_completed_draws_pie_chart'),
    # winners wall winners
    path('api/custom_admin_dashboard_winner_wall_winners_list/', custom_admin_dashboard_winner_wall_winners_list.as_view(), name='custom_admin_dashboard_winner_wall_winners_list'),
    path('api/custom_admin_dashboard_winner_wall_winner_detail/<int:pk>/', custom_admin_dashboard_winner_wall_winner_detail.as_view(), name='custom_admin_dashboard_winner_wall_winner_detail'),
    #winners wall testimonials
    path('api/custom_admin_dashboard_winners_wall_testimonials_list/', custom_admin_dashboard_winners_wall_testimonials_list.as_view(), name='custom_admin_dashboard_winners_wall_testimonials_list'),
    path('api/custom_admin_dashboard_winners_wall_testimonial_detail/<int:pk>/', custom_admin_dashboard_winners_wall_testimonial_detail.as_view(), name='custom_admin_dashboard_winners_wall_testimonial_detail'),
    #admin signup urls
    path('custom/admin/signup/',admin_signup, name='admin_signup'),
    path('api/admin/signup/', api_admin_signup.as_view(), name='api_admin_signup'),
    path('custom/admin/login/', custom_admin_login, name='custom_admin_login'),
    path('api/admin/login/', api_admin_login.as_view(), name='api_admin_login'),
    path('custom/admin/dashboard/', custom_admin_dashboard, name='custom_admin_dashboard'),
    path('lottery-events/', lottery_events, name='lottery_events'),
    path('api/get_lottery_events/', api_get_lottery_events.as_view(), name='api_get_lottery_events'),
    path('api/get_lottery_events/admin', api_get_lottery_events_admin.as_view(), name='api_get_lottery_events_admin'),
    path('api/edit-delete-lottery-events/<int:pk>/', api_edit_delete_lottery_events.as_view(), name='api_edit_delete_lottery_events'),
    path('api/lottery-events/add/', api_lottery_events_add.as_view(), name='api_lottery_events_add'),
    path('cart/', cart, name='cart'),
    path('api/add-to-cart/', add_to_cart, name='add_to_cart'),
    path('api/get-cart/', get_cart, name='api_get_cart'),
    path('api/remove-from-cart/', remove_from_cart, name='api_remove_from_cart'),
    path('api/update-cart/', update_cart, name='api_update_cart'),
    path('api/lottery_detail/<slug:slug>/', LotteryDetail.as_view(), name='api_get_lottery_event_detail'),
    path('lottery_detail/<slug:slug>/', lottery_detail_view, name='lottery_detail'),
    path('api/similar_lottery_events/<slug:slug>/', SimilarLotteryEvents.as_view(), name='api_get_similar_lottery_events'),
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
    path('api/lottery/categories/', get_lottery_categories, name='api_get_lottery_categories'),
    path('api/categories/', GetLotteryCategories.as_view(), name='get-lottery-categories'),
    path('api/get_category_lottery_events/<int:category_id>/', APIGetCategoryLotteryEvents.as_view(), name='api_get_category_lottery_events'),
    path('category_lottery_events/<str:category_name>/', category_lottery_events_view, name='category_lottery_events'),
    #user chat urls
    path('api/user/chat/', UserChatView.as_view(), name='api_user_chat'),
    #admin chat urls
    path('api/admin/messages/', ContactListView.as_view(), name='contact-list'),
    path('api/admin/reply/', AdminReplyView.as_view(), name='admin-reply'),
    path('api/mark-read/<str:email>/', mark_messages_as_read, name='mark-messages-as-read'),
    path('api/latest-unread-notifications/', latest_unread_notifications, name='latest_unread_notifications'),
    path('api/admin/chat/<str:email>/', ChatMessagesView.as_view(), name='chat-messages'),
    path('api/admin/delete-contact/<str:email>/', DeleteContactView.as_view(), name='delete-contact'),
    path('api/admin/reply/<int:reply_id>/edit_delete/', EditdeleteAdminReplyView.as_view(), name='edit_delete-admin-reply'),
    path('api/banner/', BannerView.as_view(), name='api_banner'),
    path('api/previous-winners/', PreviousWinnersimgAPIView.as_view(), name='api_get_previous_winners'),
    #Monthly/Weekly Sales Chart
    path('api/lottery_sales_bar_chart/', lottery_sales_bar_chart_View.as_view(), name='api_lottery_sales_bar_chart'),
    path('api/lottery_sales_available_years/', lottery_sales_availableYearsView.as_view(), name='api_lottery_sales_available_years'),
    path('api/lottery_sales_available_months/', lottery_sales_availableMonthsView.as_view(), name='api_lottery_sales_available_months'),
    path('block-user/', block_user, name='block-user'), 
    path('social-links/', footer_view, name='social_links'),
    path('locations/', locations_view, name='locations'),
    path('api/admin/lottery-draw/', AdminLotteryDrawView.as_view(), name='admin-lottery-draw'),
    path('api/admin/send-otp/', AdminSendOTPView.as_view(), name='Admin-send-otp'),
    path('api/admin/verify-otp/', AdminVerifyOTPView.as_view(), name='Admin-verify-otp'),
    path('api/admin/publish-winner/', PublishWinnerView.as_view(), name='publish-winner'),
    # lottery title and transaction pages api urls
    path('check_lottery_title_unique/', check_lottery_title_unique, name='check_lottery_title_unique'),
	path("api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/", api_admin_dashboard_payment_lottery_list_view_transactions_and_refund.as_view(), name="api_admin_dashboard_payment_lottery_list_view_transactions_and_refund"),
    path("api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/<str:payment_intent>/fetch-paid-amount/", api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_fetch_paid_amount_view.as_view(), name="api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_fetch_paid_amount_view"),
    path("api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/<str:payment_intent>/refund/", api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_refund_payment_view.as_view(), name="api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_refund_payment_view"),
    # prize management api urls
    path('api_admin_dashboard_prize_management_winner_list_api_view/', api_admin_dashboard_prize_management_winner_list_api_view.as_view(), name='api_admin_dashboard_prize_management_winner_list_api_view'),
    path('api_admin_dashboard_prize_management/<int:pk>/update_winner_status/', api_admin_dashboard_prize_management_update_winner_status, name='api_admin_dashboard_prize_management_update_winner_status'),
    path('winners/', winners_page, name='winners_page'),
    path('api/winners-wall/', WinnersWallListView.as_view(), name='winners-wall-list'),
    path('api/my-won-lottery/', my_won_lottery, name='my_won_lottery'),
    path('my-won-lottery/', my_won_lottery_page, name='my_won_lottery_page'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'adminpanel.urls.custom_404'

