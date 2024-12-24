from django.contrib.auth.models import User
import base64
from rest_framework import serializers
from .models import UserProfile
from django.utils.html import format_html
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['newsletter', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = User.objects.create_user(**validated_data)  # Use `create_user` to handle password hashing
        ip_address = profile_data.pop('ip_address', None)  # Extract IP address

        # Create the profile with the extracted IP address
        UserProfile.objects.create(user=user, ip_address=ip_address, **profile_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class KYCUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, image):
        # Ensure the image file size is under 500KB
        if image.size > 500 * 1024:
            raise serializers.ValidationError("Image file too large ( > 500KB ).")
        return image

    def update(self, instance, validated_data):
        # Encrypt image data (e.g., using base64 encoding for simplicity)
        image_file = validated_data.get('image')
        encrypted_image = base64.b64encode(image_file.read())

        # Update the profile with encrypted image and status
        instance.kyc_image = encrypted_image
        instance.kyc_status = 'waiting'
        instance.kyc_window_shown = False  # Reset window shown flag when a new KYC is uploaded
        instance.save()
        return instance
 
    
class UserList(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserDetailsSerializer(serializers.ModelSerializer):
    user = UserList()  # Nest the UserSerializer to include user details
    kyc_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['user', 'newsletter', 'kyc_status', 'kyc_image_url']

    def get_kyc_image_url(self, obj):
        # Return the URL for the image view based on the profile ID
        if obj.kyc_image:
            return f"/view_kyc_image/{obj.id}/"
        return None
 
class UserKycwaitingDetailsSerializer(serializers.ModelSerializer):
    user = UserList()  # Nest the UserSerializer to include user details
    kyc_image_url = serializers.SerializerMethodField()


    class Meta:
        model = UserProfile
        fields = ['user', 'newsletter', 'kyc_status', 'kyc_image_url','ip_address']


    def get_kyc_image_url(self, obj):
        # Return the URL for the image view based on the profile ID
        if obj.kyc_image:
            return f"/view_kyc_image/{obj.id}/"
        return None

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("No user is associated with this email address."))
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password1 = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)


    def validate(self, data):
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": _("The two password fields didn’t match.")})
        return data


    def save(self, user):
        user.set_password(self.validated_data['new_password1'])
        user.save()
        return user              