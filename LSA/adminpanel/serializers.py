from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *
from rest_framework import serializers
from .models import LotteryEventImages
from .models import Contact

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

    class Meta:
        model = admin_navbar_access
        fields = ['name', 'url_name', 'resolved_url', 'identifier'] 

    def get_resolved_url(self, obj):
        return obj.get_url()

   
class api_admin_login_Serializer(serializers.Serializer):
    admin_email = serializers.EmailField(required=True)
    admin_password = serializers.CharField(required=True)

class LotteryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LotteryCategory
        fields = ['id', 'name']

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
