from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import TaskViewSet, TaskCommentViewSet

router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='task')

tasks_router = NestedDefaultRouter(router, 'tasks', lookup='task')
tasks_router.register('comments', TaskCommentViewSet, basename='task-comment')

urlpatterns = router.urls + tasks_router.urls
