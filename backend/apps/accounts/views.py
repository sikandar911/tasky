from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiExample, OpenApiResponse,
    OpenApiParameter,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from core.permissions import IsSuperAdmin, IsSuperAdminOrAdmin
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    AdminCreateUserSerializer,
    UserDetailSerializer,
    CustomTokenObtainPairSerializer,
)

# ── Shared example payloads ─────────────────────────────────────────────────

_USER_DETAIL_EXAMPLE = OpenApiExample(
    'User object',
    value={
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'MEMBER',
        'is_verified': False,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    response_only=True,
)

_VERIFIED_USER_EXAMPLE = OpenApiExample(
    'Verified user object',
    value={
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'alice@example.com',
        'full_name': 'Alice Smith',
        'role': 'MEMBER',
        'is_verified': True,
        'date_joined': '2024-01-15T10:30:00Z',
    },
    response_only=True,
)


# ── Views ────────────────────────────────────────────────────────────────────

@extend_schema(tags=['Auth'])
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        summary='Obtain JWT access + refresh tokens',
        description=(
            'Login with **email** and **password**.\n\n'
            '> ⚠️ The account must be **verified** by a Superadmin before login is allowed.'
        ),
        request=OpenApiExample(
            'Login credentials',
            value={'email': 'alice@example.com', 'password': 'secret123'},
            request_only=True,
        ),
        responses={
            200: OpenApiResponse(
                description='Tokens issued successfully',
                examples=[
                    OpenApiExample(
                        'Success',
                        value={
                            'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            'role': 'MEMBER',
                            'full_name': 'Alice Smith',
                            'user_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                        },
                        response_only=True,
                    )
                ],
            ),
            401: OpenApiResponse(description='Invalid credentials or account not verified'),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


@extend_schema(tags=['Users'])
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Register a new user account',
        description=(
            'Creates a new user. `is_verified` defaults to **False** — '
            'a Superadmin must verify the account before the user can log in.'
        ),
        request=OpenApiExample(
            'Registration payload',
            value={
                'email': 'alice@example.com',
                'full_name': 'Alice Smith',
                'password': 'secret123',
                'role': 'MEMBER',
            },
            request_only=True,
        ),
        responses={
            201: OpenApiResponse(
                description='User created (pending verification)',
                examples=[_USER_DETAIL_EXAMPLE],
            ),
            400: OpenApiResponse(description='Validation error (duplicate email, weak password, etc.)'),
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserDetailSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Users'])
class AdminCreateUserView(generics.CreateAPIView):
    """
    Superadmin can create SUPERADMIN, ADMIN, or MEMBER.
    Admin can only create MEMBER.
    Created users are auto-verified (no separate verification step needed).
    """
    serializer_class = AdminCreateUserSerializer
    permission_classes = [IsSuperAdminOrAdmin]

    @extend_schema(
        summary='Create a user (Admin / Superadmin)',
        description=(
            '- **Superadmin**: may set `role` to `SUPERADMIN`, `ADMIN`, or `MEMBER`.\n'
            '- **Admin**: `role` is forced to `MEMBER`.\n\n'
            'Created users are **auto-verified** and can log in immediately.'
        ),
        request=OpenApiExample(
            'Create user payload',
            value={'email': 'newuser@example.com', 'full_name': 'New User', 'password': 'secret123', 'role': 'MEMBER'},
            request_only=True,
        ),
        responses={
            201: OpenApiResponse(description='User created', examples=[_USER_DETAIL_EXAMPLE]),
            400: OpenApiResponse(description='Validation error'),
            403: OpenApiResponse(description='Insufficient permissions'),
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserDetailSerializer(user).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Users'])
class UserVerifyView(APIView):
    permission_classes = [IsSuperAdmin]

    @extend_schema(
        summary='Toggle user verification status (Superadmin only)',
        description=(
            'Flips `is_verified` for the target user.\n\n'
            '- `False → True`: user can now log in.\n'
            '- `True → False`: user is suspended.\n\n'
            '**Requires:** `role=SUPERADMIN` and own `is_verified=True`.'
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description='Updated user object',
                examples=[_VERIFIED_USER_EXAMPLE],
            ),
            403: OpenApiResponse(description='Not a verified Superadmin'),
            404: OpenApiResponse(description='User not found'),
        },
        parameters=[
            OpenApiParameter('pk', OpenApiTypes.UUID, OpenApiParameter.PATH, description='Target user UUID'),
        ],
    )
    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.role == 'SUPERADMIN':
            return Response(
                {'detail': 'Verification status of a Superadmin cannot be changed.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.is_verified = not user.is_verified
        user.save(update_fields=['is_verified'])
        return Response(UserDetailSerializer(user).data)


@extend_schema(
    tags=['Users'],
    summary='List all users (Superadmin only)',
    description='Returns a paginated list of every registered user.',
    responses={
        200: OpenApiResponse(
            description='Paginated user list',
            examples=[
                OpenApiExample(
                    'User list',
                    value={
                        'count': 2,
                        'next': None,
                        'previous': None,
                        'results': [
                            {
                                'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'email': 'alice@example.com',
                                'full_name': 'Alice Smith',
                                'role': 'MEMBER',
                                'is_verified': True,
                                'date_joined': '2024-01-15T10:30:00Z',
                            },
                            {
                                'id': 'a1b2c3d4-1234-5678-abcd-ef0123456789',
                                'email': 'bob@example.com',
                                'full_name': 'Bob Jones',
                                'role': 'ADMIN',
                                'is_verified': False,
                                'date_joined': '2024-02-01T09:00:00Z',
                            },
                        ],
                    },
                    response_only=True,
                )
            ],
        ),
        403: OpenApiResponse(description='Not a verified Superadmin'),
    },
)
class UserListView(generics.ListAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsSuperAdminOrAdmin]
    queryset = User.objects.all().order_by('-date_joined')
