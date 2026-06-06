import api from '@/lib/axios';
import { TaskFiltersParams, TaskComment, PaginatedResponse } from '@/types';

export const getTasksApi = (params?: TaskFiltersParams) =>
  api.get('/tasks/', { params }).then((r) => r.data);

export const getTaskApi = (id: string) =>
  api.get(`/tasks/${id}/`).then((r) => r.data);

export const createTaskApi = (formData: FormData) =>
  api.post('/tasks/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateTaskApi = (id: string, data: FormData | Record<string, unknown>) =>
  api.patch(`/tasks/${id}/`, data).then((r) => r.data);

export const deleteTaskApi = (id: string) =>
  api.delete(`/tasks/${id}/`);

// ── Comments ──────────────────────────────────────────────────────────────────

export const getCommentsApi = (taskId: string, params?: { page?: number }): Promise<PaginatedResponse<TaskComment>> =>
  api.get(`/tasks/${taskId}/comments/`, { params }).then((r) => r.data);

export const createCommentApi = (taskId: string, body: Record<string, unknown>): Promise<TaskComment> =>
  api.post(`/tasks/${taskId}/comments/`, { body }).then((r) => r.data);

export const deleteCommentApi = (taskId: string, commentId: number) =>
  api.delete(`/tasks/${taskId}/comments/${commentId}/`);

