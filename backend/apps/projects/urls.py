from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectMemberView, ProjectMemberListView

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')

urlpatterns = router.urls + [
    path('projects/<uuid:pk>/members/', ProjectMemberView.as_view(), name='project-members'),
    path('projects/<uuid:pk>/members/list/', ProjectMemberListView.as_view(), name='project-members-list'),
]
