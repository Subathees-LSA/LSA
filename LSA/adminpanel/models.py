from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify

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
    slug = models.SlugField(unique=True, blank=True)  # Slug field
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    draw_date = models.DateTimeField()
    image = models.ImageField(upload_to='lottery_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sold_percentage = models.PositiveIntegerField(default=0)
    total_tickets = models.PositiveIntegerField(default=0)  # New field for total tickets
    sold_tickets = models.PositiveIntegerField(default=0)   # Field for sold tickets
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    revenue_type = models.CharField(max_length=50, choices=[('fixed', 'Fixed'), ('percentage', 'Percentage')], default='fixed')
    revenue_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    per_ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # New Field

    mini_limit = models.PositiveIntegerField(default=1)  # Minimum number of tickets
    max_limit = models.PositiveIntegerField(default=10)  # Maximum number of tickets
    free_postal_description = models.TextField(default="Enter the description for free postal entry.")
    
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1


            # Ensure slug is unique
            while LotteryEvent.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
        
            self.slug = slug


        # Calculate the sold percentage
        if self.total_tickets > 0:
            self.sold_percentage = (self.sold_tickets / self.total_tickets) * 100
        else:
            self.sold_percentage = 0


        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.sold_percentage}% sold"
    