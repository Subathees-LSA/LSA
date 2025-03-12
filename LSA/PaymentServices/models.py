from django.db import models
from django.contrib.auth.models import User
from adminpanel.models import LotteryEvent

class PaymentLottery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_lotteries')
    lottery_event = models.ForeignKey(LotteryEvent, on_delete=models.CASCADE, related_name='payment_lotteries')
    quantity = models.PositiveIntegerField(default=1)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Amount in EUR
    payment_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending'
    )
    stripe_session_id = models.CharField(max_length=255, null=True, blank=True)  # Store Stripe session ID
    payment_at = models.DateTimeField(null=True, blank=True) 
    payment_intent = models.CharField(max_length=255, null=True, blank=True)
    receipt_url = models.CharField(max_length=512, null=True, blank=True)
    def __str__(self):
        return f"{self.user.username} -{self.payment_intent}- {self.lottery_event.title} - {self.quantity} tickets - {self.amount} GBP"
