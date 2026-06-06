from rest_framework import serializers
from apps.accounts.models import User
from apps.accounts.serializers import UserDetailSerializer
from .models import Project, ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ('id', 'user', 'date_added')
        read_only_fields = ('id', 'date_added')


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserDetailSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'created_by', 'members', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()

    def validate_user_id(self, value):
        try:
            user = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('User with this ID does not exist.')
        if not user.is_verified:
            raise serializers.ValidationError('User is not verified and cannot be added to projects.')
        return value
