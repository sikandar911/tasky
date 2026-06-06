import os

# Content for the technical planning document
md_content = """# Backend Implementation Plan: In-House Task Management Tool

## 1. Tech Stack Overview
* **Framework:** Django (Python)
    * **REST API:** Django REST Framework (DRF)
* **Database:** PostgreSQL (v14+)
* **Storage:** MinIO (Object Storage for Screenshots/Videos)
* **Authentication:** JWT (JSON Web Tokens) or Session-based (In-house focus)

---

## 2. Database Schema Design (PostgreSQL)

### A. `accounts_user` (Custom User Model)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Primary Key |
| `email` | String (Unique) | Login credential |
| `full_name` | String | User's display name |
| `role` | Enum | `SUPERADMIN`, `ADMIN`, `MEMBER` |
| `is_verified` | Boolean | Default: `False`. Set by Superadmin |
| `is_active` | Boolean | Account status |
| `date_joined`| DateTime | Auto-timestamp |

### B. `projects_project`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Primary Key |
| `name` | String | Project Title |
| `description` | Text | Project Scope |
| `created_by` | FK (User) | The Admin who created it |
| `created_at` | DateTime | Auto-timestamp |

### C. `projects_projectmember` (Membership Logic)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Primary Key |
| `project` | FK (Project) | Related Project |
| `user` | FK (User) | Related User |
| `date_added` | DateTime | Verification of when they joined |

### D. `tasks_task`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Primary Key |
| `project` | FK (Project) | Related Project |
| `title` | String | Task Heading |
| `description` | Text | Supports Markdown & @mentions |
| `status` | Enum | `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `created_by` | FK (User) | Task Creator |
| `assigned_to` | FK (User) | Task Owner |
| `due_date` | DateTime | Optional Deadline |

### E. `tasks_attachment` (MinIO Linkage)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | BigInt (PK) | Primary Key |
| `task` | FK (Task) | Related Task |
| `file_name` | String | Original filename |
| `file_path` | String | MinIO Object Key (Path in bucket) |
| `media_type` | Enum | `IMAGE`, `VIDEO_URL` |
| `uploaded_by` | FK (User) | Uploader |

---

## 3. Storage Strategy (MinIO)
1.  **Configuration:** Use `django-storages[s3]` to treat MinIO as an S3-compatible backend.
2.  **Bucket Policy:** `task-assets` bucket set to private. 
3.  **Access:** Backend generates **Presigned URLs** (valid for 1 hour) to serve images/videos to the frontend. This ensures direct file links are never public.

---

## 4. Feature Implementation Logic

### User Verification Workflow
1.  **Signup:** User registers via API. `is_active` is True, but `is_verified` is False.
2.  **Superadmin Approval:** `PATCH /api/users/{id}/verify/`. Only a user with `role=SUPERADMIN` can access this endpoint.
3.  **Access Control:** A custom Middleware or Permission class checks `is_verified` on every request.

### Mention & Notification System
1.  **Parsing:** When `Task.description` is saved, a post-save signal scans for the `@` regex.
2.  **Validation:** Ensure the mentioned user is a member of the current project (`ProjectMember` check).
3.  **Action:** Create a record in a `Notification` table for the mentioned user.

### Project Isolation
* **Querysets:** Every API call for tasks/projects must be filtered by `project__members__in=[request.user]`. This prevents users from "guessing" UUIDs of projects they don't belong to.

---

## 5. Proposed Folder Structure (Django)
```text
backend/
├── config/ (Settings, WSGI, ASGI)
├── apps/
│   ├── accounts/ (Models, Serializers, Views for Auth/Verification)
│   ├── projects/ (Models, Serializers, Views for Projects & Members)
│   ├── tasks/ (Models, Serializers, Views for Tasks & Attachments)
│   └── notifications/ (Logic for @mentions)
├── core/ (Base models, MinIO Utils, Mixins)
└── manage.py