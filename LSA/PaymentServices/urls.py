
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
    path("check-user-authentication/", check_user_authentication, name="check_user_authentication"),
    path("create-checkout-session/", create_checkout_session, name="create_checkout_session"),
    path("stripe-webhook/", stripe_webhook, name="stripe_webhook"),
    path('success/',success,name='success'),
    path('cancel/',cancel,name='cancel'),
    path('my-orders/',my_order,name='my-orders'),
    path('api/my-orders/', my_order_api, name='my_orders_api'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = 'PaymentServices.urls.custom_404'

