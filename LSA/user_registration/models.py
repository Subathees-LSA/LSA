from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_image = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
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
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.validators import RegexValidator
class UserPrivacy(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    two_factor_auth_enabled = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiration = models.DateTimeField(blank=True, null=True)

    # Personal Information
    # first_name = models.CharField(max_length=50, blank=True, null=True)
    # last_name = models.CharField(max_length=50, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)  # Date of Birth
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\+44\d{10}$', 'Enter a valid UK phone number starting with +44')],
    )
    profile_photo = models.ImageField(
        upload_to='profile_photos/', 
        blank=True, 
        null=True, 
        default='default-profile.jpg'  # Default image file
    )
    # Address Information
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Social Media
    website = models.URLField(blank=True, null=True)
    twitter = models.CharField(max_length=100, blank=True, null=True)
    def __str__(self):
        return f"Privacy settings for {self.user.username}"
    def set_otp(self, otp):
        self.otp = otp
        self.otp_expiration = timezone.now() + timedelta(minutes=5)  # Timezone-aware datetime
        self.save()

from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now

class UserDeviceHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device_info = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    login_time = models.DateTimeField(default=now)
    logout_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.device_info} ({self.ip_address})"
