from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserPrivacy

@receiver(post_save, sender=User)
def create_user_privacy(sender, instance, created, **kwargs):
    if created:
        UserPrivacy.objects.create(user=instance)

