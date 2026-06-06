import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface LoginData {
  access: string;
  refresh: string;
  role: string;
  full_name: string;
  user_id: string;
  email: string;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (data: LoginData) => void;
  logout: () => void;
}

const getUserFromStorage = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: getUserFromStorage(),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isSuperAdmin: getUserFromStorage()?.role === 'SUPERADMIN',

  login: (data: LoginData) => {
    const user: AuthUser = {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    };
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({
      user,
      accessToken: data.access,
      refreshToken: data.refresh,
      isAuthenticated: true,
      isSuperAdmin: data.role === 'SUPERADMIN',
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isSuperAdmin: false });
  },
}));
