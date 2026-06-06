import api from '@/lib/axios';

export const getUsersApi = (params?: { page?: number }) =>
  api.get('/users/', { params }).then((r) => r.data);

export const verifyUserApi = (id: string) =>
  api.patch(`/users/${id}/verify/`).then((r) => r.data);

export interface CreateUserPayload {
  email: string;
  full_name: string;
  password: string;
  role?: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
}

export const createUserApi = (payload: CreateUserPayload) =>
  api.post('/users/create/', payload).then((r) => r.data);
