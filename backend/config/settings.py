from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'storages',
    'django_filters',
    'drf_spectacular',
    # Local apps
    'core',
    'apps.accounts',
    'apps.projects',
    'apps.tasks',
    'apps.notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='task_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASS', default='password123'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# MinIO / S3-compatible storage
MINIO_ENDPOINT = config('MINIO_ENDPOINT', default='127.0.0.1')
MINIO_PORT = config('MINIO_PORT', default='9000')
MINIO_USE_SSL = config('MINIO_USE_SSL', default=False, cast=bool)

if not MINIO_ENDPOINT.startswith(('http://', 'https://')):
    protocol = 'https://' if MINIO_USE_SSL else 'http://'
    AWS_S3_ENDPOINT_URL = f"{protocol}{MINIO_ENDPOINT}:{MINIO_PORT}"
else:
    AWS_S3_ENDPOINT_URL = MINIO_ENDPOINT

AWS_ACCESS_KEY_ID = config('MINIO_ACCESS_KEY', default='minioadmin')
AWS_SECRET_ACCESS_KEY = config('MINIO_SECRET_KEY', default='minioadmin')
AWS_STORAGE_BUCKET_NAME = config('MINIO_BUCKET_NAME', default=config('MINIO_BUCKET', default='task-assets'))
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'private'
AWS_S3_VERIFY = False
AWS_QUERYSTRING_AUTH = True
DEFAULT_FILE_STORAGE = 'core.storage.MinIOStorage'

# ---------------------------------------------------------------------------
# drf-spectacular – OpenAPI 3.0 / Swagger configuration
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'Tasky API',
    'DESCRIPTION': (
        'Task Management System REST API.\n\n'
        '## Authentication\n'
        'All protected endpoints require a **Bearer JWT** token.\n'
        '1. Register via `POST /api/users/register/`\n'
        '2. A Superadmin must verify your account via `PATCH /api/users/{id}/verify/`\n'
        '3. Obtain tokens via `POST /api/auth/login/`\n'
        '4. Pass the **access** token as: `Authorization: Bearer <token>`'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,   # separate request/response schemas
    'SORT_OPERATIONS': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'filter': True,
    },
    'SWAGGER_UI_FAVICON_HREF': 'https://www.djangoproject.com/favicon.ico',
    'REDOC_SETTINGS': {
        'lazyRendering': True,
        'nativeScrollbars': True,
    },
    'SECURITY': [{'BearerAuth': []}],
}
