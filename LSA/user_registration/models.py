
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    newsletter = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    kyc_status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('waiting', 'Waiting'), ('verified', 'Verified'), ('rejected', 'Rejected')],
        default='pending'
    )
    kyc_image = models.BinaryField(null=True, blank=True)
    kyc_window_shown = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True) 
    def __str__(self):
        return self.user.username

