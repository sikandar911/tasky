from rest_framework import serializers
from core.storage import generate_presigned_url
from apps.accounts.serializers import UserDetailSerializer
from .models import Task, TaskAttachment, TaskComment


class TaskAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by = UserDetailSerializer(read_only=True)

    class Meta:
        model = TaskAttachment
        fields = (
            'id', 'file_name', 'file_url', 'video_url',
            'media_type', 'uploaded_by', 'uploaded_at',
        )
        read_only_fields = fields

    def get_file_url(self, obj):
        if obj.media_type == 'IMAGE' and obj.file:
            return generate_presigned_url(str(obj.file.name))
        return None


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserDetailSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'author', 'body', 'created_at', 'updated_at')
        read_only_fields = ('id', 'task', 'author', 'created_at', 'updated_at')


class TaskSerializer(serializers.ModelSerializer):
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    created_by = UserDetailSerializer(read_only=True)
    assigned_to = UserDetailSerializer(read_only=True)
    assigned_to_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'title', 'description', 'status', 'priority',
            'created_by', 'assigned_to', 'assigned_to_id',
            'due_date', 'attachments', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at', 'attachments')

    def update(self, instance, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', ...)
        if assigned_to_id is not ...:
            instance.assigned_to_id = assigned_to_id
        return super().update(instance, validated_data)


class TaskStatusSerializer(serializers.ModelSerializer):
    """Restricted serializer for MEMBER role -- only allows updating status."""

    class Meta:
        model = Task
        fields = ('status',)


class TaskCreateSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        default=list,
    )
    video_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        default=list,
    )
    assigned_to_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    description = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = Task
        fields = (
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assigned_to_id', 'due_date', 'files', 'video_urls',
        )
        read_only_fields = ('id',)

    def to_internal_value(self, data):
        if 'description' in data and isinstance(data['description'], str):
            import json
            try:
                mutable = data.copy() if hasattr(data, 'copy') else dict(data)
                mutable['description'] = json.loads(data['description'])
                data = mutable
            except (ValueError, TypeError):
                data = data.copy() if hasattr(data, 'copy') else dict(data)
                data['description'] = {}
        return super().to_internal_value(data)

    def create(self, validated_data):
        files = validated_data.pop('files', [])
        video_urls = validated_data.pop('video_urls', [])
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        request = self.context['request']

        task = Task.objects.create(
            **validated_data,
            created_by=request.user,
            assigned_to_id=assigned_to_id,
        )

        for f in files:
            TaskAttachment.objects.create(
                task=task,
                file_name=f.name,
                file=f,
                media_type='IMAGE',
                uploaded_by=request.user,
            )

        for url in video_urls:
            TaskAttachment.objects.create(
                task=task,
                file_name=url,
                video_url=url,
                media_type='VIDEO_URL',
                uploaded_by=request.user,
            )

        return task
