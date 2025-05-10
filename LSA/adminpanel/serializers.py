from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *
from rest_framework import serializers
# serializers.py
from rest_framework import serializers
from .models import Testimonial

from rest_framework import serializers
from .models import Testimonial

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['year', 'win_lottery', 'lost_lottery']

class RegionalSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionalSales
        fields = ['region', 'total_sales', 'average', 'return_value']

class api_admin_signup_Serializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(write_only=True)
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['admin_username', 'admin_email', 'admin_password']
        extra_kwargs = {
            'admin_password': {'write_only': True}
        }

   
    def validate_admin_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username already exists. Please provide a different name.")
        return value

    # Email uniqueness validation
    def validate_admin_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        # Extract `admin_username`, `admin_email`, and `admin_password`
        username = validated_data.pop('admin_username')
        email = validated_data.pop('admin_email')
        password = validated_data.pop('admin_password')

        # Create the user instance with the mapped values
        user = User(username=username, email=email)
        user.set_password(password)
        
        # Set Staff and Superuser status
        user.is_staff = True
        user.is_superuser = True
        
        user.save()

        # Create the admin profile with an empty role
        adminProfile.objects.create(user=user, role='')  # Role is set to an empty string by default
        
        return user


class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user_profile.user.username")

    class Meta:
        model = Leaderboard
        fields = ['username', 'points', 'correct_percentage', 'rank','image']

class LotteryStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotteryStatistics
        fields = '__all__'


class admin_navbar_accessSerializer(serializers.ModelSerializer):
    resolved_url = serializers.SerializerMethodField()
    nav_bar_image_url = serializers.SerializerMethodField()  # Serialize the image URL

    class Meta:
        model = admin_navbar_access
        fields = ['name', 'url_name', 'resolved_url', 'identifier', 'nav_bar_image_url']

    def get_resolved_url(self, obj):
        return obj.get_url()

    def get_nav_bar_image_url(self, obj):
        if obj.nav_bar_image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.nav_bar_image.url)  # Full image URL
        return None  # No image uploaded


   
class api_admin_login_Serializer(serializers.Serializer):
    admin_email = serializers.EmailField(required=True)
    admin_password = serializers.CharField(required=True)

class LotteryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LotteryCategory
        fields = ['id', 'name','category_logo']

class LotteryEventSerializer(serializers.ModelSerializer):
    additional_images = serializers.SerializerMethodField()
    category = serializers.PrimaryKeyRelatedField(queryset=LotteryCategory.objects.all(), required=True)
    class Meta:
        model = LotteryEvent
        fields = '__all__'
   
        
    
    def validate_competition_details(self, value):
       
        if not isinstance(value,str):
            raise serializers.ValidationError("Competition details must be a string.")
        return value

   
    def validate_slug(self, value):
        if not value:  # Allow slug to be auto-generated if not provided
            return value
        if LotteryEvent.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value


    def get_additional_images(self, obj):
        # Retrieve all additional images related to this LotteryEvent
        images = LotteryEventImages.objects.filter(lottery_event=obj)
        # Use LotteryEventImagesSerializer to serialize the images
        return LotteryEventImagesSerializer(images, many=True).data

    def validate_image(self, value):
        # If image is not provided in request data
        if not value:
            # Check if an instance is already available (for PUT requests)
            instance = getattr(self, 'instance', None)
            # If instance exists and has an image, pass validation
            if instance and instance.image:
                return instance.image
            # Otherwise, raise validation error
            raise serializers.ValidationError("An image is required for the lottery event.")
        return value

class LotteryEventSerializeradd_get(serializers.ModelSerializer):
    additional_images = serializers.SerializerMethodField()
    category = LotteryCategorySerializer()

    class Meta:
        model = LotteryEvent
        fields = '__all__'
   
        
    
    def validate_competition_details(self, value):
       
        if not isinstance(value,str):
            raise serializers.ValidationError("Competition details must be a string.")
        return value

   
    def validate_slug(self, value):
        if not value:  # Allow slug to be auto-generated if not provided
            return value
        if LotteryEvent.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value


    def get_additional_images(self, obj):
        # Retrieve all additional images related to this LotteryEvent
        images = LotteryEventImages.objects.filter(lottery_event=obj)
        # Use LotteryEventImagesSerializer to serialize the images
        return LotteryEventImagesSerializer(images, many=True).data

    def validate_image(self, value):
        # If image is not provided in request data
        if not value:
            # Check if an instance is already available (for PUT requests)
            instance = getattr(self, 'instance', None)
            # If instance exists and has an image, pass validation
            if instance and instance.image:
                return instance.image
            # Otherwise, raise validation error
            raise serializers.ValidationError("An image is required for the lottery event.")
        return value

class LotteryEventImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotteryEventImages
        fields = '__all__'


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class AdminReplySerializer(serializers.Serializer):
    email = serializers.EmailField()
    message = serializers.CharField(max_length=1000)



class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['title', 'image','show_title', 'show_explore_button']


class PreviousWinnerimgSerializer(serializers.ModelSerializer):
    class Meta:
        model = Previous_Winner_img
        fields = ['id', 'name', 'image'] 


from PaymentServices.models import *

class AdminrefundPaymentLotterySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    lottery_event_title = serializers.CharField(source="lottery_event.title", read_only=True)

    class Meta:
        model = PaymentLottery
        fields = ['payment_intent', 'lottery_event_title', 'amount', 'payment_at', 'payment_status', 'user_email', 'quantity', 'receipt_url']	


class prize_management_WinnerSerializer(serializers.ModelSerializer):
    customer_details = serializers.SerializerMethodField()
    prize_details = serializers.SerializerMethodField()

    class Meta:
        model = Winner
        fields = ['id', 'ticket_number', 'customer_details', 'prize_details', 'prize_status', 'prize_comments','prize_no']

    def get_customer_details(self, obj):
        return {
            "user_name": obj.user.username if obj.user else "No User",
            "user_email": obj.user.email if obj.user else "N/A"
        }

    def get_prize_details(self, obj):
        return {
            "lottery_title": obj.lottery_event.title,
            "lottery_image": obj.lottery_event.image.url if obj.lottery_event.image else None
        }

from rest_framework import serializers
from .models import Winner

class WinnerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    lottery_title = serializers.CharField(source='lottery_event.title', read_only=True)

    class Meta:
        model = Winner
        fields = ['lottery_title', 'username', 'ticket_number', 'created_at']



# In serializers.py
# winners wall winners
class WinnersWallWinnersListSerializer(serializers.ModelSerializer):
    draw_date_formatted = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False)  
    
    class Meta:
        model = WinnersWallWinnersList
        fields = [
            'id',
            'winner_name',
            'ticket_number',
            'lottery_name',
            'draw_date',
            'draw_date_formatted',
            'image_url',
            'image',
            'flag'
        ]
        extra_kwargs = {
            'draw_date': {'write_only': False}
        }
    
    def get_draw_date_formatted(self, obj):
        if obj.draw_date:
            # Format as: December 6, 2024 10:00 PM
            return obj.draw_date.strftime("%B %d, %Y %I:%M %p")
        return "No date specified"
    
    # def to_representation(self, instance):
    #     rep = super().to_representation(instance)
    #     rep['draw_date'] = instance.draw_date.isoformat() if instance.draw_date else None
    #     return rep
    def to_representation(self, instance):
        rep = super().to_representation(instance)

        # Handle the image field
        if instance.image:
            rep['image'] = instance.image.url
        else:
            rep['image'] = None

        # Handle the draw_date field
        rep['draw_date'] = instance.draw_date.isoformat() if instance.draw_date else None

        return rep

#winners wall testimonials
class custom_admin_dashboard_winners_wall_testimonials_serializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)  # Make image optional for updates
    
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'quote', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            representation['image'] = instance.image.url
        else:
            representation['image'] = None
        return representation

  
