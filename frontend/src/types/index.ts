export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
  is_verified: boolean;
  date_joined: string;
}

export interface ProjectMember {
  id: number;
  user: User;
  date_added: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_by: User;
  members: ProjectMember[];
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_url: string | null;
  video_url: string | null;
  media_type: 'IMAGE' | 'VIDEO_URL';
  uploaded_by: User;
  uploaded_at: string;
}

export interface Task {
  id: string;
  project: string;
  title: string;
  description: Record<string, unknown>;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_by: User;
  assigned_to: User | null;
  due_date: string | null;
  attachments: TaskAttachment[];
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task: string;
  author: User;
  body: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginResponse {
  access: string;
  refresh: string;
  role: string;
  full_name: string;
  user_id: string;
  email: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  role?: string;
}

export interface TaskFiltersParams {
  status?: string;
  priority?: string;
  project?: string;
  search?: string;
  ordering?: string;
}

export interface Notification {
  id: number;
  task_id: string;
  task_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
