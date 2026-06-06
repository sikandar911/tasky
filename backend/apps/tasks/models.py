from django.db import models
from core.models import TimeStampedModel
from core.storage import MinIOStorage
from apps.accounts.models import User
from apps.projects.models import Project


class Task(TimeStampedModel):
    STATUS_CHOICES = [
        ('TODO', 'Todo'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW', 'Review'),
        ('DONE', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)  # Tiptap JSON content
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='assigned_tasks',
        null=True,
        blank=True,
    )
    due_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class TaskAttachment(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('VIDEO_URL', 'Video URL'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='task-attachments/',
        storage=MinIOStorage(),
        null=True,
        blank=True,
    )
    video_url = models.URLField(null=True, blank=True)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_attachments')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']

    def __str__(self):
        return f'{self.file_name} ({self.media_type})'


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    body = models.JSONField()  # Tiptap JSON — bold + list support
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author.email} on {self.task.title}'
