from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *



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


class api_admin_login_Serializer(serializers.Serializer):
    admin_email = serializers.EmailField(required=True)
    admin_password = serializers.CharField(required=True)

# class LotteryEventSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LotteryEvent
#         #fields = ['id','slug','title', 'description', 'price', 'draw_date', 'image', 'is_active', 'sold_percentage','total_tickets','mini_limit','max_limit','free_postal_description']
#         fields = '__all__'
#     def validate_image(self, value):
#         # If image is not provided in request data
#         if not value:
#             # Check if an instance is already available (for PUT requests)
#             instance = getattr(self, 'instance', None)
#             # If instance exists and has an image, pass validation
#             if instance and instance.image:
#                 return instance.image
#             # Otherwise, raise validation error
#             raise serializers.ValidationError("An image is required for the lottery event.")
#         return value

class LotteryEventSerializer(serializers.ModelSerializer):
    additional_images = serializers.SerializerMethodField()

    class Meta:
        model = LotteryEvent
        fields = '__all__'
   
        

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

from rest_framework import serializers
from .models import LotteryEventImages

class LotteryEventImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotteryEventImages
        fields = ['id', 'image', 'uploaded_at']
