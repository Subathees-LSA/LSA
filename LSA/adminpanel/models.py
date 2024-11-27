# Create your models here.
from django.contrib.auth.models import User
from django.db import models


class adminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role_CHOICES = [
        ('', 'Select Role'),  # Allow for empty choice
        ('admin', 'Admin'),
        # Add more roles here if needed
    ]
    role = models.CharField(max_length=12, choices=role_CHOICES, blank=True, default='')

    def save(self, *args, **kwargs):
        if self.role == 'admin':
            self.user.is_staff = True
            self.user.is_superuser = True
        else:
            self.user.is_staff = False
            self.user.is_superuser = False
            
        self.user.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.role or 'No Role Assigned'}"
class LotteryEvent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Per Ticket Price
    draw_date = models.DateTimeField()
    image = models.ImageField(upload_to='lottery_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sold_percentage = models.PositiveIntegerField(default=0)
    total_tickets = models.PositiveIntegerField(default=0)
    sold_tickets = models.PositiveIntegerField(default=0)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    revenue_type = models.CharField(max_length=50, choices=[('fixed', 'Fixed'), ('percentage', 'Percentage')], default='fixed')
    revenue_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    per_ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # New Field

    def save(self, *args, **kwargs):
        # Calculate the sold percentage based on total tickets if total tickets > 0
        if self.total_tickets > 0:
            self.sold_percentage = (self.sold_tickets / self.total_tickets) * 100
        else:
            self.sold_percentage = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.sold_percentage}% sold"
