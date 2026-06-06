import api from '@/lib/axios';
import { RegisterPayload } from '@/types';

export const loginApi = (data: { email: string; password: string }) =>
  api.post('/auth/login/', data).then((r) => r.data);

export const registerApi = (data: RegisterPayload) =>
  api.post('/users/register/', data).then((r) => r.data);

export const refreshTokenApi = (refresh: string) =>
  api.post('/auth/refresh/', { refresh }).then((r) => r.data);
