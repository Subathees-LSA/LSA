import random
import string
from datetime import datetime, timedelta
from django.utils import timezone  # Import Django's timezone module

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def verify_otp(user, otp):
    try:
        user_privacy = user.userprivacy  # Access the `userprivacy` instance
        now = timezone.now()  # Use timezone-aware datetime
        if user_privacy.otp == otp and user_privacy.otp_expiration > now:
            return True
    except AttributeError:
        # Handle cases where `userprivacy` does not exist for the user
        pass
    return False
