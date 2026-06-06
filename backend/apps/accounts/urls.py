from django.urls import path
from .views import UserRegistrationView, AdminCreateUserView, UserListView, UserVerifyView

urlpatterns = [
    path('users/register/', UserRegistrationView.as_view(), name='user-register'),
    path('users/create/', AdminCreateUserView.as_view(), name='user-create'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:pk>/verify/', UserVerifyView.as_view(), name='user-verify'),
]
