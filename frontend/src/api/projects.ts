import api from '@/lib/axios';

export const getProjectsApi = () => api.get('/projects/').then((r) => r.data);

export const getProjectApi = (id: string) =>
  api.get(`/projects/${id}/`).then((r) => r.data);

export const createProjectApi = (data: { name: string; description: string }) =>
  api.post('/projects/', data).then((r) => r.data);

export const updateProjectApi = (id: string, data: { name: string; description: string }) =>
  api.put(`/projects/${id}/`, data).then((r) => r.data);

export const deleteProjectApi = (id: string) =>
  api.delete(`/projects/${id}/`);

export const getProjectMembersApi = (id: string) =>
  api.get(`/projects/${id}/members/list/`).then((r) => r.data);

export const addMemberApi = (id: string, user_id: string) =>
  api.post(`/projects/${id}/members/`, { user_id }).then((r) => r.data);

export const removeMemberApi = (id: string, user_id: string) =>
  api.delete(`/projects/${id}/members/`, { data: { user_id } });
