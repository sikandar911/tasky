Role: You are a Senior Backend Engineer.
Objective: Implement a Task Management System backend using Django, Django REST Framework (DRF), PostgreSQL, and MinIO for file storage.
Constraint: Follow a strictly modular approach. Use demo credentials for all environment variables. Do not include test cases; focus entirely on the core implementation logic and code.

Phase 1: Project Setup & Environment
Initialize a Django project named task_manager.

Create four apps: accounts, projects, tasks, and core.

Configure settings.py to use psycopg2 for PostgreSQL and django-storages with S3Boto3Storage for MinIO.

Demo Credentials: - DB_NAME: task_db, DB_USER: postgres, DB_PASS: password123, DB_HOST: localhost.

MINIO_ENDPOINT: http://127.0.0.1:9000, MINIO_ACCESS_KEY: minioadmin, MINIO_SECRET_KEY: minioadmin.

Phase 2: User Management (accounts app)
Model: Implement a Custom User model (AbstractUser) adding role (Superadmin, Admin, Member) and is_verified (Boolean, default False).

Logic: Ensure only users with is_verified=True can obtain JWT tokens.

Superadmin Action: Create an endpoint for Superadmins to toggle is_verified for new signups.

Phase 3: Project & Task Models (projects & tasks)
Projects: Implement Project and ProjectMember (Through table).

Tasks: Implement Task with fields for title, description (Textfield), priority, status, and FKs to Project, Creator, and Assignee.

Attachments: Create a TaskAttachment model. Use FileField configured to upload to MinIO. Store Video URLs as URLField.

Phase 4: Storage & Permissions (core app)
Storage: Create a utility in core/storage.py to handle MinIO connection via S3Boto3Storage.

Permissions: - IsSuperAdmin: Only verified superadmins.

IsProjectAdmin: Only the creator of the project.

IsProjectMember: Only users listed in the ProjectMember table for that specific project.

Phase 5: Business Logic & Mentions
Mention Parser: Create a signal or helper function that scans Task.description for @username.

Validation: If a user is mentioned but NOT in the ProjectMember table, do not trigger a notification.

Phase 6: API Endpoints (DRF ViewSets)
Provide full serializers.py and views.py for:

User Registration & Verification.

Project Creation and Member Assignment.

Task Creation with multi-file upload (Screenshots) and Video URL linking.

Filtering: Users should only see tasks for projects they are members of.

Implementation Delivery Format:
Please provide the code for each file clearly labeled (e.g., apps/tasks/models.py). Start from the models and move toward the views and URLs.