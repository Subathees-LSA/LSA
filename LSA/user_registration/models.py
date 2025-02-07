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

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from django.utils import timezone
from datetime import timedelta
from django.core.validators import RegexValidator
class UserPrivacy(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    two_factor_auth_enabled = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiration = models.DateTimeField(blank=True, null=True)
    dob = models.DateField(blank=True, null=True)  # Date field
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\+44\d{10}$', 'Enter a valid UK phone number starting with +44')],
    )
    def __str__(self):
        return f"Privacy settings for {self.user.username}"
    def set_otp(self, otp):
        self.otp = otp
        self.otp_expiration = timezone.now() + timedelta(minutes=5)  # Timezone-aware datetime
        self.save()



