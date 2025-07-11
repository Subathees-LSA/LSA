
dashboard_preview_data = [
    {'name': 'Lottery Management', 'identifier': 'lotterys', 'type': 'lotterys', 'ordering': 9},
    {'name': 'User Management Table', 'identifier': 'users_table', 'type': 'user_management_table', 'ordering': 8},
    {'name': 'Kyc Pending Users', 'identifier': 'pending_kyc', 'type': 'Statistics_count', 'ordering': 12},
    {'name': 'Verified Users', 'identifier': 'verified_users', 'type': 'Statistics_count', 'ordering': 13},
    {'name': 'Total Users', 'identifier': 'total_users', 'type': 'Statistics_count', 'ordering': 14},
    {'name': 'Sales', 'identifier': 'overview_sales_amount', 'type': 'overview_counts', 'dashboard_preview_image': 'dashboard_preview_image/Background_1.png', 'ordering': 1},
    {'name': 'Active users', 'identifier': 'overview_active_users_count', 'type': 'overview_counts', 'dashboard_preview_image': 'dashboard_preview_image/Background_2.png', 'ordering': 2},
    {'name': 'Active Lotteries', 'identifier': 'overview_active_lotteries_count', 'type': 'overview_counts', 'dashboard_preview_image': 'dashboard_preview_image/Background_dFo80PC.png', 'ordering': 3},
    {'name': 'Margin Chart', 'identifier': 'report_and_analytics_marginal_chart', 'type': 'charts', 'ordering': 7},
    {'name': 'user chats and notification bell icon', 'identifier': 'user_chats_and_notification_bell_icon', 'type': 'user_chats_and_notification_bell_icon', 'ordering': 11},
    {'name': 'Monthly/Weekly Sales Chart', 'identifier': 'report_and_analytics_monthly_sales_bar_chart', 'type': 'charts', 'ordering': 10},
    {'name': 'Pending vs Completed Draws chart', 'identifier': 'report_and_analytics_Pending_vs_completed_draws_pie_chart', 'type': 'charts', 'ordering': 15},
    {'name': 'Number of Winners Week chart', 'identifier': 'report_and_analytics_winners_vs_losers_chart', 'type': 'charts', 'ordering': 16},
    {'name': 'Overall Transaction chart', 'identifier': 'report_and_analytics_overall_transaction_report_chart', 'type': 'charts', 'ordering': 17},
    {'name': 'Overall Won and Lost Lotteries chart', 'identifier': 'admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart', 'type': 'charts', 'ordering': 6},
    {'name': 'Inactive Users', 'identifier': 'inactive_users', 'type': 'overview_counts', 'ordering': 4},
    {'name': 'New Users', 'identifier': 'new_users_this_month', 'type': 'overview_counts', 'ordering': 5},
    ]
from .models import admin_dashboard_preview 
def insert_dashboard_previews():
    for data in dashboard_preview_data:
        identifier = data['identifier']
        if admin_dashboard_preview.objects.filter(identifier=identifier).exists():
            print(f"Skipped (already exists): {data['name']} ({identifier})")
            continue

        obj = admin_dashboard_preview(
            name=data['name'],
            identifier=data['identifier'],
            type=data['type'],
            ordering=data['ordering'],
        )

        if 'dashboard_preview_image' in data:
            obj.dashboard_preview_image = data['dashboard_preview_image']

        try:
            obj.full_clean()  
            obj.save()
            print(f"Created: {obj.name} ({obj.identifier})")
        except Exception as e:
            print(f"Error creating '{data['name']}': {e}")

from .models import admin_navbar_access 
import os

nav_items = [
    {
        "name": "Report & Analytics",
        "url_name": "",
        "identifier": "custom_admin_dashboard_dynamic_lottery_sales_count_and_bar_chart",
        "nav_bar_image": "navbar_images/line-md_document-report.png",
        "ordering": 8
    },
    {
        "name": "Lotteries",
        "url_name": "",
        "identifier": "lottery_cards_add_and_list",
        "nav_bar_image": "navbar_images/Group_9.png",
        "ordering": 3
    },
    {
        "name": "Overview",
        "url_name": "custom_admin_dashboard",
        "identifier": "",
        "nav_bar_image": "navbar_images/Group_260dfdfd_1.png",
        "ordering": 1
    },
    {
        "name": "Users",
        "url_name": "",
        "identifier": "custom_admin_dashboard_user_list_table",
        "nav_bar_image": "navbar_images/Group_8.1_rm1mqo1.png",
        "ordering": 2
    },
    {
        "name": "Transactions",
        "url_name": "",
        "identifier": "custom_admin_dashboard_all_transactions_management",
        "nav_bar_image": "navbar_images/reuse.png",
        "ordering": 4
    },
    {
        "name": "Refund",
        "url_name": "",
        "identifier": "custom_admin_dashboard_transactions_management_refunded",
        "nav_bar_image": "navbar_images/gridicons_refund.png",
        "ordering": 5
    },
    {
        "name": "Prize Management",
        "url_name": "",
        "identifier": "custom_admin_dashboard_prize_management_id",
        "nav_bar_image": "navbar_images/material-symbols_price-change-outline.png",
        "ordering": 6
    },
    {
        "name": "Customer Support",
        "url_name": "",
        "identifier": "admin_reply_chat_bot",
        "nav_bar_image": "navbar_images/ic_sharp-support-agent.png",
        "ordering": 7
    },
    {
        "name": "Winner Walls",
        "url_name": "",
        "identifier": "custom_admin_dashboard_winners_wall_management_winners_and_testimonials",
        "nav_bar_image": "navbar_images/codicon_feedback.png",
        "ordering": 9
    },
    {
        "name": "Lottery Draw winners",
        "url_name": "",
        "identifier": "draw-lottery-container",
        "nav_bar_image": "navbar_images/icons8-winner-24.png",
        "ordering": 10
    }
]
def create_navbar_items():
    for item in nav_items:
        name = item.get("name")
        identifier = item.get("identifier")

        if admin_navbar_access.objects.filter(name=name).exists():
            print(f"'{name}' already exists by name.")
            continue

        if identifier and admin_navbar_access.objects.filter(identifier=identifier).exists():
            print(f"'{identifier}' already exists by identifier.")
            continue

        obj = admin_navbar_access(
            name=name,
            url_name=item.get("url_name", ""),
            identifier=identifier or None,
            ordering=item.get("ordering", 0)
        )

        nav_bar_image_path = item.get("nav_bar_image")
        if nav_bar_image_path:
            filename = os.path.basename(nav_bar_image_path)
            obj.nav_bar_image.name = f"navbar_images/{filename}"

        obj.save()
        print(f"'{obj.name}' created successfully.")


# python manage.py shell
# from adminpanel.custom_admin_navbar_and_preview_object_creation import *
# insert_dashboard_previews()
# create_navbar_items()

# import adminpanel.custom_admin_navbar_and_preview_object_creation as custom
# print(custom.nav_items)  
# custom.nav_items =[]

