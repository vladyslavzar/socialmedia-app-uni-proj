from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile
from rest_framework.authtoken.models import Token

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    token = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'first_name', 'last_name', 'token')
        extra_kwargs = {
            'username': {'required': True},
            'password': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
        read_only_fields = ('id', 'token')
    
    def get_token(self, obj):
        token, _ = Token.objects.get_or_create(user=obj)
        return token.key
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        # Profile is created automatically by the post_save signal
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('bio', 'profile_picture', 'date_joined')
        read_only_fields = ('date_joined',) 