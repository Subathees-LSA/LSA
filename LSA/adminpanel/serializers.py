from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *
from rest_framework import serializers
# serializers.py
from rest_framework import serializers
from .models import Testimonial

from rest_framework import serializers
from .models import Testimonial


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

    def validate_admin_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
       
        username = validated_data.pop('admin_username')
        email = validated_data.pop('admin_email')
        password = validated_data.pop('admin_password')
        user = User(username=username, email=email)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        adminProfile.objects.create(user=user, role='') 
        return user

class admin_navbar_accessSerializer(serializers.ModelSerializer):
    resolved_url = serializers.SerializerMethodField()
    nav_bar_image_url = serializers.SerializerMethodField() 

    class Meta:
        model = admin_navbar_access
        fields = ['name', 'url_name', 'resolved_url', 'identifier', 'nav_bar_image_url']

    def get_resolved_url(self, obj):
        return obj.get_url()

    def get_nav_bar_image_url(self, obj):
        if obj.nav_bar_image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.nav_bar_image.url)  
        return None 


   
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
        if not value: 
            return value
        if LotteryEvent.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value

    def get_additional_images(self, obj):
        images = LotteryEventImages.objects.filter(lottery_event=obj)
        return LotteryEventImagesSerializer(images, many=True).data

    def validate_image(self, value):
        if not value:
            instance = getattr(self, 'instance', None)
            if instance and instance.image:
                return instance.image
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
        if not value: 
            return value
        if LotteryEvent.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value

    def get_additional_images(self, obj):
        images = LotteryEventImages.objects.filter(lottery_event=obj)
        return LotteryEventImagesSerializer(images, many=True).data

    def validate_image(self, value):
        if not value: 
            instance = getattr(self, 'instance', None)
            if instance and instance.image:
                return instance.image
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
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = WinnersWallWinnersList
        fields = ['winner_name', 'ticket_number', 'lottery_name', 'draw_date', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

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
            return obj.draw_date.strftime("%B %d, %Y %I:%M %p")
        return "No date specified"
   
    def to_representation(self, instance):
        rep = super().to_representation(instance)

        if instance.image:
            rep['image'] = instance.image.url
        else:
            rep['image'] = None

        rep['draw_date'] = instance.draw_date.isoformat() if instance.draw_date else None

        return rep

#winners wall testimonials
class custom_admin_dashboard_winners_wall_testimonials_serializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)  
    
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

  
from rest_framework import serializers
from .models import Winner

class WonLotteryWinnerSerializer(serializers.ModelSerializer):
    lottery_event = serializers.CharField(source='lottery_event.title')
    
    class Meta:
        model = Winner
        fields = ['lottery_event', 'ticket_number', 'prize_no', 'prize_status', 'prize_comments']
