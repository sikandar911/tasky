from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiExample, OpenApiResponse,
    OpenApiParameter,
)
from drf_spectacular.types import OpenApiTypes
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from core.permissions import IsProjectMember, IsNotMember
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCreateSerializer, TaskStatusSerializer, TaskCommentSerializer

# ── Shared example data ──────────────────────────────────────────────────────

_ATTACHMENT_EXAMPLE = {
    'id': 1,
    'file_name': 'screenshot.png',
    'file_url': 'http://127.0.0.1:9000/task-assets/task-attachments/screenshot.png?X-Amz-Signature=abc',
    'video_url': None,
    'media_type': 'IMAGE',
    'uploaded_by': {
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'MEMBER',
        'is_verified': True,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    'uploaded_at': '2024-03-10T14:00:00Z',
}

_TASK_EXAMPLE = {
    'id': 'c3d4e5f6-3456-7890-cdef-012345678901',
    'project': 'a1b2c3d4-1234-5678-abcd-ef0123456789',
    'title': 'Implement login page',
    'description': 'Build the login form. @alice@example.com please review the design.',
    'status': 'IN_PROGRESS',
    'priority': 'HIGH',
    'created_by': {
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'ADMIN',
        'is_verified': True,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    'assigned_to': None,
    'due_date': '2024-04-01T00:00:00Z',
    'attachments': [_ATTACHMENT_EXAMPLE],
    'created_at': '2024-03-10T12:00:00Z',
    'updated_at': '2024-03-10T14:00:00Z',
}


# ── ViewSet ─────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Tasks'],
        summary='List tasks (filtered to my projects)',
        description=(
            'Returns tasks belonging to projects the authenticated user is a member of.\n\n'
            '**Filter params:** `status`, `priority`, `project`\n'
            '**Search fields:** `title`, `description`\n'
            '**Order fields:** `created_at`, `due_date`, `priority`'
        ),
        parameters=[
            OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status: TODO | IN_PROGRESS | REVIEW | DONE'),
            OpenApiParameter('priority', OpenApiTypes.STR, description='Filter by priority: LOW | MEDIUM | HIGH | URGENT'),
            OpenApiParameter('project', OpenApiTypes.UUID, description='Filter by project UUID'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Search in title and description'),
            OpenApiParameter('ordering', OpenApiTypes.STR, description='Order by: created_at, due_date, priority'),
        ],
        responses={
            200: OpenApiResponse(
                description='Paginated task list',
                examples=[
                    OpenApiExample(
                        'Task list',
                        value={
                            'count': 1,
                            'next': None,
                            'previous': None,
                            'results': [_TASK_EXAMPLE],
                        },
                        response_only=True,
                    )
                ],
            )
        },
    ),
    retrieve=extend_schema(
        tags=['Tasks'],
        summary='Get a single task',
        responses={
            200: OpenApiResponse(
                description='Task detail with attachments',
                examples=[OpenApiExample('Task', value=_TASK_EXAMPLE, response_only=True)],
            ),
            403: OpenApiResponse(description='Not a project member'),
            404: OpenApiResponse(description='Task not found'),
        },
    ),
    create=extend_schema(
        tags=['Tasks'],
        summary='Create a task with optional file uploads',
        description=(
            'Creates a task and optionally attaches screenshots (uploaded to MinIO) and/or video URLs.\n\n'
            '- `files` — list of image/file uploads (multipart/form-data)\n'
            '- `video_urls` — list of video URL strings\n'
            '- `assigned_to_id` — UUID of a project member to assign\n'
            '- Mentions in `description` (e.g. `@alice@example.com`) automatically create notifications for project members.\n\n'
            '> Use `multipart/form-data` when uploading files.'
        ),
        request=OpenApiExample(
            'Create task (with files)',
            value={
                'project': 'a1b2c3d4-1234-5678-abcd-ef0123456789',
                'title': 'Implement login page',
                'description': 'Build the login form. @alice@example.com please review.',
                'status': 'TODO',
                'priority': 'HIGH',
                'assigned_to_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                'due_date': '2024-04-01T00:00:00Z',
                'files': ['<binary file>'],
                'video_urls': ['https://www.loom.com/share/abc123'],
            },
            request_only=True,
        ),
        responses={
            201: OpenApiResponse(
                description='Task created',
                examples=[OpenApiExample('Created task', value=_TASK_EXAMPLE, response_only=True)],
            ),
            400: OpenApiResponse(description='Validation error'),
            403: OpenApiResponse(description='Not a project member'),
        },
    ),
    update=extend_schema(
        tags=['Tasks'],
        summary='Update a task (full)',
        request=OpenApiExample(
            'Update payload',
            value={
                'project': 'a1b2c3d4-1234-5678-abcd-ef0123456789',
                'title': 'Implement login page v2',
                'description': 'Updated description.',
                'status': 'REVIEW',
                'priority': 'URGENT',
                'assigned_to_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                'due_date': '2024-04-15T00:00:00Z',
            },
            request_only=True,
        ),
        responses={
            200: OpenApiResponse(
                description='Updated task',
                examples=[OpenApiExample('Updated', value=_TASK_EXAMPLE, response_only=True)],
            ),
            403: OpenApiResponse(description='Not a project member'),
        },
    ),
    partial_update=extend_schema(
        tags=['Tasks'],
        summary='Partially update a task',
        description='Send only the fields you want to change.',
        request=OpenApiExample(
            'Patch status',
            value={'status': 'DONE'},
            request_only=True,
        ),
        responses={
            200: OpenApiResponse(description='Patched task'),
            403: OpenApiResponse(description='Not a project member'),
        },
    ),
    destroy=extend_schema(
        tags=['Tasks'],
        summary='Delete a task',
        responses={
            204: OpenApiResponse(description='Deleted'),
            403: OpenApiResponse(description='Not a project member'),
        },
    ),
)
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsProjectMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project']
    search_fields = ['title']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsNotMember()]
        return [IsProjectMember()]

    def get_queryset(self):
        return Task.objects.filter(
            project__members__user=self.request.user
        ).select_related('project', 'created_by', 'assigned_to').prefetch_related('attachments').distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        # MEMBER may only patch the `status` field on tasks
        if getattr(user, 'role', None) == 'MEMBER':
            allowed_keys = set(request.data.keys()) - {'status'}
            if allowed_keys:
                raise PermissionDenied('Members may only update the status field.')
            serializer = TaskStatusSerializer(task, data={'status': request.data.get('status')}, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(TaskSerializer(task, context={'request': request}).data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


from rest_framework.pagination import PageNumberPagination

class CommentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(tags=['Comments'])
class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    Nested viewset for task comments.
    URL: /api/tasks/{task_pk}/comments/
    - GET  (list)   — any project member
    - POST (create) — any project member; admin/superadmin can comment on any task
    - DELETE        — author or admin/superadmin
    - PATCH/PUT     — comment author only
    """
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CommentPagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def _get_task(self):
        task_pk = self.kwargs.get('task_pk')
        user = self.request.user
        # Superadmin/Admin can access any task's comments
        if getattr(user, 'role', None) in ('SUPERADMIN', 'ADMIN'):
            try:
                return Task.objects.get(pk=task_pk)
            except Task.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound('Task not found.')
        # Members must be in the project
        try:
            task = Task.objects.get(
                pk=task_pk,
                project__members__user=user,
            )
            return task
        except Task.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Task not found or you are not a project member.')

    def get_queryset(self):
        task = self._get_task()
        return TaskComment.objects.filter(task=task).select_related('author')

    def perform_create(self, serializer):
        task = self._get_task()
        serializer.save(task=task, author=self.request.user)

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author_id != request.user.id:
            raise PermissionDenied('You can only edit your own comments.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if getattr(request.user, 'role', None) not in ('SUPERADMIN', 'ADMIN') and comment.author_id != request.user.id:
            raise PermissionDenied('You can only delete your own comments.')
        return super().destroy(request, *args, **kwargs)
