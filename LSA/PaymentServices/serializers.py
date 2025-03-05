from rest_framework import serializers
from .models import PaymentLottery

class PaymentLotterySerializer(serializers.ModelSerializer):
    lottery_event_title = serializers.CharField(source='lottery_event.title', read_only=True)

    class Meta:
        model = PaymentLottery
        fields = ['id', 'payment_intent', 'lottery_event_title', 'quantity', 'amount', 'payment_status', 'payment_at', 'stripe_session_id']
