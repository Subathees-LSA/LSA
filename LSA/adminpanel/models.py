from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify
from django.utils.timezone import now
from django.urls import reverse
from django.core.exceptions import ValidationError


class admin_dashboard_preview(models.Model):
    name = models.CharField(max_length=100, help_text="Tab name to display")
    identifier = models.CharField(max_length=50, unique=True, help_text="Unique identifier for this container (used in frontend)")
    type = models.CharField(
        max_length=10,
        choices=[(' ', 'Select type'),('count', 'count'), ('table', 'Table'), ('rate', 'rate'), ('lotterys', 'lotterys')],
        default='',
        help_text="Type of content"
    )

    def __str__(self):
        return self.name
        

    def clean(self):
        # Get the identifiers from the "data" dictionary (mock this part for now if necessary)
        allowed_identifiers = {
            " ",
            "total_users",
            "verified_users",
            "pending_kyc",
            "total_tickets_sold",
            "total_transaction_amount",
            "users_table",
            "conversion_rate",
            "lotterys"
        
        }

        if self.identifier not in allowed_identifiers:
            raise ValidationError(f"The identifier '{self.identifier}' is not valid or doesn't exist in the allowed identifiers.")

    def save(self, *args, **kwargs):
        # Call the clean method for validation
        self.clean()
        super().save(*args, **kwargs)

class admin_navbar_access(models.Model):
    name = models.CharField(max_length=50, unique=True)
    url_name = models.CharField(max_length=100, unique=True)  # Store the URL pattern name

    def get_url(self):
        """
        Dynamically resolve the URL using its name.
        """
        try:
            return reverse(self.url_name)
        except Exception:
            return "#"  # Return a placeholder if the URL can't be resolved

    def __str__(self):
        return self.name

 
class adminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role_CHOICES = [
                ('', 'Select Role'),
                ('admin', 'Admin'),
                ('sales', 'Sales'),  # New role added here
                # Add more roles here if needed
                    ]
    role = models.CharField(max_length=12, choices=role_CHOICES, blank=True, default='')
    navbar_access = models.ManyToManyField(admin_navbar_access, blank=True)
    dashboard_preview = models.ManyToManyField(admin_dashboard_preview, blank=True)

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
                        
class LotteryCategory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    


    def __str__(self):
        return self.name  
                            
class LotteryEvent(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)  # Slug field
    category = models.ForeignKey(LotteryCategory, related_name='lottery_events', on_delete=models.CASCADE, null=True, blank=True,default=1)
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
    competition_details = models.TextField(default="")   

    
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


class LotteryEventImages(models.Model):
    lottery_event = models.ForeignKey(LotteryEvent, related_name="additional_images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to='lottery_event_additional_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def _str_(self):
        return f"Image for {self.lottery_event.title}" 
    

class TicketTransaction(models.Model):
    lottery_event = models.ForeignKey(LotteryEvent, on_delete=models.CASCADE, related_name='transactions')
    tickets_sold = models.PositiveIntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(default=now)
    is_successful = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.lottery_event.title} - {self.tickets_sold} tickets sold"


class ConversionRate(models.Model):
    card_type = models.CharField(max_length=50)  # e.g., iTunes, Amazon, Bitcoin
    region = models.CharField(max_length=50)    # e.g., USA, UK
    rate = models.DecimalField(max_digits=10, decimal_places=2)  # e.g., 400.00
    is_physical = models.BooleanField(default=True)  # Physical or e-code card

    def __str__(self):
        return f"{self.card_type} ({self.region}) - {'Physical' if self.is_physical else 'E-code'}"


class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email}"        