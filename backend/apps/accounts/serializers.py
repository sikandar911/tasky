from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Public self-registration — always creates a MEMBER, always unverified."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'password')
        read_only_fields = ('id',)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(role='MEMBER', **validated_data)
        user.set_password(password)
        user.is_verified = False
        user.save()
        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    """
    Admin/Superadmin user creation.
    - Superadmin: any role allowed.
    - Admin: role is forced to MEMBER.
    - Created users are auto-verified.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'password', 'role')
        read_only_fields = ('id',)
        extra_kwargs = {'role': {'required': False}}

    def validate_role(self, value):
        request = self.context.get('request')
        requester = getattr(request, 'user', None)
        if requester and getattr(requester, 'role', None) == 'SUPERADMIN':
            return value or 'MEMBER'
        # Admin can only create MEMBERs
        if value and value != 'MEMBER':
            raise serializers.ValidationError('Admins can only create users with the MEMBER role.')
        return 'MEMBER'

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.setdefault('role', 'MEMBER')
        user = User(**validated_data)
        user.set_password(password)
        user.is_verified = True   # Admin-created users are auto-verified
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'is_verified', 'date_joined')
        read_only_fields = fields


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.is_verified:
            raise AuthenticationFailed(
                'Your account is not yet verified. Please contact a superadmin.'
            )
        data['role'] = user.role
        data['full_name'] = user.full_name
        data['user_id'] = str(user.id)
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token
