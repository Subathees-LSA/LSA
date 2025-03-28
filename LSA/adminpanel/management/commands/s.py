import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from adminpanel.models import LotteryEvent
from PaymentServices.models import PaymentLottery, LotteryTicket  # Update the import based on your project structure

class Command(BaseCommand):
    help = "Generate dummy data for LotteryEvent, Users, Payments, and Lottery Tickets"

    def handle(self, *args, **kwargs):
        self.stdout.write("Creating Lottery Event...")
        
        # Create a Lottery Event
        lottery_event, created = LotteryEvent.objects.get_or_create(
            title="Laptop",
            slug="Laptop",
            defaults={
                "description": "This is a test lottery event.",
                "price": 498.00,
                "draw_date": "2025-04-01 8:00:00",
                "total_tickets": 100000,
                "sold_tickets": 0,
                "per_ticket_price": 0.95
            }
        )

        # Keep track of used ticket numbers
        existing_tickets = set(LotteryTicket.objects.values_list("ticket_number", flat=True))

        def generate_unique_ticket():
            while True:
                ticket_number = str(random.randint(100000, 999999))
                if ticket_number not in existing_tickets:
                    existing_tickets.add(ticket_number)
                    return ticket_number

        self.stdout.write("Creating 100 users with 1 ticket each...")
        for i in range(1, 101):
            username = f"person{i}"
            user, _ = User.objects.get_or_create(username=username, defaults={"password": "testpass123"})
            
            payment = PaymentLottery.objects.create(
                user=user,
                lottery_event=lottery_event,
                quantity=1,
                amount=lottery_event.per_ticket_price,
                payment_status="completed",
                payment_intent=f"intent_{i}",
                receipt_url=f"http://dummy.receipt/{i}"
            )

            LotteryTicket.objects.create(
                user=user,
                lottery_event=lottery_event,
                payment=payment,
                ticket_number=generate_unique_ticket()
            )

        self.stdout.write("Creating 20 users with 6 tickets each...")
        for i in range(1, 21):
            username = f"userbulkperson{i}"
            user, _ = User.objects.get_or_create(username=username, defaults={"password": "testpass123"})

            payment = PaymentLottery.objects.create(
                user=user,
                lottery_event=lottery_event,
                quantity=6,
                amount=lottery_event.per_ticket_price * 6,
                payment_status="completed",
                payment_intent=f"intent_bulk_{i}",
                receipt_url=f"http://dummy.receipt/bulk/{i}"
            )

            for _ in range(6):
                LotteryTicket.objects.create(
                    user=user,
                    lottery_event=lottery_event,
                    payment=payment,
                    ticket_number=generate_unique_ticket()
                )
        self.stdout.write("Creating 20 users with 6 tickets each...")
        for i in range(1, 21):
            username = f"userbulkperson{i}"
            user, _ = User.objects.get_or_create(username=username, defaults={"password": "testpass123"})

            payment = PaymentLottery.objects.create(
                user=user,
                lottery_event=lottery_event,
                quantity=6,
                amount=lottery_event.per_ticket_price * 6,
                payment_status="completed",
                payment_intent=f"intent_bulk_{i}",
                receipt_url=f"http://dummy.receipt/bulk/{i}"
            )

            for _ in range(6):
                LotteryTicket.objects.create(
                    user=user,
                    lottery_event=lottery_event,
                    payment=payment,
                    ticket_number=generate_unique_ticket()
                )
       

        # Update sold_tickets count
        lottery_event.sold_tickets = LotteryTicket.objects.filter(lottery_event=lottery_event).count()
        lottery_event.save()

        self.stdout.write(self.style.SUCCESS("Dummy data created successfully!"))
