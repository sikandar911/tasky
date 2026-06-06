from django.db import models
from core.models import TimeStampedModel
from apps.accounts.models import User


class Project(TimeStampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_projects',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='project_memberships',
    )
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')
        ordering = ['date_added']

    def __str__(self):
        return f'{self.user.email} in {self.project.name}'
