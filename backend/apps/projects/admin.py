from django.contrib import admin
from .models import Project, ProjectMember


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name', 'created_by__email')
    list_filter = ('created_at',)


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'date_added')
    search_fields = ('project__name', 'user__email')
    list_filter = ('date_added',)
