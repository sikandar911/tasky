import api from '@/lib/axios';
import { Notification } from '@/types';

export const getNotificationsApi = (): Promise<Notification[]> =>
  api.get('/notifications/').then((r) => {
    const data = r.data;
    return Array.isArray(data) ? data : data.results || [];
  });

export const markAllReadApi = () =>
  api.patch('/notifications/mark-all-read/').then((r) => r.data);

export const markReadApi = (id: number) =>
  api.patch(`/notifications/${id}/read/`).then((r) => r.data);
