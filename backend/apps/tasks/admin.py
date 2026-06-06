from django.contrib import admin
from .models import Task, TaskAttachment, TaskComment


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'task', 'created_at')
    search_fields = ('author__email', 'task__title')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'assigned_to', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description', 'assigned_to__email')
    ordering = ('-created_at',)


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'task', 'media_type', 'uploaded_by', 'uploaded_at')
    list_filter = ('media_type',)
    search_fields = ('file_name', 'task__title')
