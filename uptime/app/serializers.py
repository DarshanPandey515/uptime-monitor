from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Website, CheckResult, UserProfile, AlertSettings

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['display_name']


class AlertSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertSettings
        fields = [
            'alert_email',
            'email_enabled',
            'alert_on_down',
            'alert_on_recover',
            'cooldown_mins',
        ]

    def validate_cooldown_mins(self, value):
        if value < 0:
            raise serializers.ValidationError("Cooldown cannot be negative.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."})
        return data


class WebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Website
        fields = [
            "id",
            "website_name",
            "website_url",
            "interval",
            "last_checked",
            "last_status",
            "last_response_time",
            "is_active",
        ]

    def validate_interval(self, value):
        if value < 1 or value > 1440:
            raise serializers.ValidationError(
                "Interval must be between 1 and 1440 minutes")
        return value


class CheckResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckResult
        fields = [
            "id",
            "checked_at",
            "status",
            "status_code",
            "response_time",
            "error_message",
        ]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(
        required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A user with that username already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        email = validated_data.pop('email', '')
        user = User.objects.create_user(email=email, **validated_data)
        return user
