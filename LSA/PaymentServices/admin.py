from django.contrib import admin
from .models import *
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered

app_config = apps.get_app_config('PaymentServices')
app_models = app_config.get_models()


for model in app_models:
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        # Skip if the model is already registered
        pass
