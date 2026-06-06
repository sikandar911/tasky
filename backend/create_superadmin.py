#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Check if superadmin exists
if not User.objects.filter(email='tasky-master@example.com').exists():
    user = User.objects.create_superuser(
        email='tasky-master@example.com',
        full_name='Tasky Master Admin',
        password='sikku321'
    )
    print(f"✓ Superadmin created!")
    print(f"  Email: {user.email}")
    print(f"  Full Name: {user.full_name}")
    print(f"  Role: {user.role}")
    print(f"  Verified: {user.is_verified}")
else:
    user = User.objects.get(email='tasky-master@example.com')
    print(f"✓ Superadmin already exists!")
    print(f"  Email: {user.email}")
    print(f"  Full Name: {user.full_name}")
    print(f"  Role: {user.role}")
    print(f"  Verified: {user.is_verified}")
