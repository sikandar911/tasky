from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiExample, OpenApiResponse,
    OpenApiParameter,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsProjectAdmin, IsProjectMember, IsNotMember
from apps.accounts.models import User
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer, AddMemberSerializer

# ── Shared examples ─────────────────────────────────────────────────────────

_MEMBER_EXAMPLE = {
    'id': 1,
    'user': {
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'MEMBER',
        'is_verified': True,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    'date_added': '2024-03-01T12:00:00Z',
}

_PROJECT_EXAMPLE = {
    'id': 'a1b2c3d4-1234-5678-abcd-ef0123456789',
    'name': 'Website Redesign',
    'description': 'Redesign the company website with a modern look.',
    'created_by': {
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'ADMIN',
        'is_verified': True,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    'members': [_MEMBER_EXAMPLE],
    'created_at': '2024-03-01T12:00:00Z',
    'updated_at': '2024-03-01T12:00:00Z',
}


# ── ViewSet ─────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Projects'],
        summary='List my projects',
        description='Returns all projects the authenticated user is a member of.',
        responses={
            200: OpenApiResponse(
                description='Paginated project list',
                examples=[
                    OpenApiExample(
                        'Project list',
                        value={
                            'count': 1,
                            'next': None,
                            'previous': None,
                            'results': [_PROJECT_EXAMPLE],
                        },
                        response_only=True,
                    )
                ],
            )
        },
    ),
    retrieve=extend_schema(
        tags=['Projects'],
        summary='Get a single project',
        responses={
            200: OpenApiResponse(
                description='Project detail',
                examples=[OpenApiExample('Project', value=_PROJECT_EXAMPLE, response_only=True)],
            ),
            404: OpenApiResponse(description='Not found or not a member'),
        },
    ),
    create=extend_schema(
        tags=['Projects'],
        summary='Create a new project',
        description='Creator is automatically added as the first member.',
        request=OpenApiExample(
            'Create project',
            value={'name': 'Website Redesign', 'description': 'Redesign the company website.'},
            request_only=True,
        ),
        responses={
            201: OpenApiResponse(
                description='Project created',
                examples=[OpenApiExample('Created project', value=_PROJECT_EXAMPLE, response_only=True)],
            ),
            400: OpenApiResponse(description='Validation error'),
        },
    ),
    update=extend_schema(
        tags=['Projects'],
        summary='Update a project (Project Admin only)',
        request=OpenApiExample(
            'Update payload',
            value={'name': 'New Name', 'description': 'Updated description.'},
            request_only=True,
        ),
        responses={
            200: OpenApiResponse(
                description='Updated project',
                examples=[OpenApiExample('Updated', value=_PROJECT_EXAMPLE, response_only=True)],
            ),
            403: OpenApiResponse(description='Not the project creator'),
        },
    ),
    partial_update=extend_schema(
        tags=['Projects'],
        summary='Partially update a project (Project Admin only)',
        responses={200: OpenApiResponse(description='Patched project')},
    ),
    destroy=extend_schema(
        tags=['Projects'],
        summary='Delete a project (Project Admin only)',
        responses={
            204: OpenApiResponse(description='Deleted'),
            403: OpenApiResponse(description='Not the project creator'),
        },
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            members__user=self.request.user
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        ProjectMember.objects.get_or_create(project=project, user=self.request.user)

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsProjectAdmin()]
        if self.action == 'create':
            return [IsNotMember()]
        return [IsAuthenticated()]

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj


# ── Member management ────────────────────────────────────────────────────────

@extend_schema(tags=['Project Members'])
class ProjectMemberView(APIView):
    """POST to add a member, DELETE to remove a member."""
    permission_classes = [IsProjectAdmin]

    def _get_project(self, pk):
        try:
            return Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return None

    @extend_schema(
        summary='Add a member to a project (Project Admin only)',
        description='The target user must be verified (`is_verified=True`).',
        parameters=[
            OpenApiParameter('pk', OpenApiTypes.UUID, OpenApiParameter.PATH, description='Project UUID'),
        ],
        request=OpenApiExample(
            'Add member payload',
            value={'user_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6'},
            request_only=True,
        ),
        responses={
            201: OpenApiResponse(
                description='Member added',
                examples=[OpenApiExample('New member', value=_MEMBER_EXAMPLE, response_only=True)],
            ),
            400: OpenApiResponse(description='Already a member or user not verified'),
            403: OpenApiResponse(description='Not the project creator'),
            404: OpenApiResponse(description='Project or user not found'),
        },
    )
    def post(self, request, pk):
        project = self._get_project(pk)
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, project)

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        member, created = ProjectMember.objects.get_or_create(project=project, user=user)
        if not created:
            return Response({'detail': 'User is already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary='Remove a member from a project (Project Admin only)',
        description='The project creator cannot be removed.',
        parameters=[
            OpenApiParameter('pk', OpenApiTypes.UUID, OpenApiParameter.PATH, description='Project UUID'),
        ],
        request=OpenApiExample(
            'Remove member payload',
            value={'user_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6'},
            request_only=True,
        ),
        responses={
            204: OpenApiResponse(description='Member removed'),
            400: OpenApiResponse(description='Cannot remove project creator'),
            403: OpenApiResponse(description='Not the project creator'),
            404: OpenApiResponse(description='Project or member not found'),
        },
    )
    def delete(self, request, pk):
        project = self._get_project(pk)
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        self.check_object_permissions(request, project)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if str(project.created_by_id) == str(user_id):
            return Response(
                {'detail': 'Cannot remove the project creator.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = ProjectMember.objects.filter(project=project, user_id=user_id).delete()
        if not deleted:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=['Project Members'],
    summary='List members of a project',
    description='Returns all members of the given project. Requires membership.',
    parameters=[
        OpenApiParameter('pk', OpenApiTypes.UUID, OpenApiParameter.PATH, description='Project UUID'),
    ],
    responses={
        200: OpenApiResponse(
            description='Member list',
            examples=[
                OpenApiExample(
                    'Members',
                    value={
                        'count': 1,
                        'next': None,
                        'previous': None,
                        'results': [_MEMBER_EXAMPLE],
                    },
                    response_only=True,
                )
            ],
        ),
        403: OpenApiResponse(description='Not a project member'),
    },
)
class ProjectMemberListView(generics.ListAPIView):
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        return ProjectMember.objects.filter(
            project_id=self.kwargs['pk']
        ).select_related('user').order_by('date_added')
