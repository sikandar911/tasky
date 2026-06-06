from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from apps.accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ────────────────────────────────────────────────────────────────
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ── App routes ──────────────────────────────────────────────────────────
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/', include('apps.tasks.urls')),
    path('api/', include('apps.notifications.urls')),

    # ── OpenAPI / Swagger ───────────────────────────────────────────────────
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
