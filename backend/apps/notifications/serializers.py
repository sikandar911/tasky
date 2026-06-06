from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_id = serializers.UUIDField(source='task.id', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'task_id', 'task_title', 'message', 'is_read', 'created_at')
        read_only_fields = fields
