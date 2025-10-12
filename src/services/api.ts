// Frontend REST API wrapper (previously named supabase.ts)
import { apiFetch } from './_apiClient';

export const isApiAvailable = true;

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
}

export const authService = {
  signIn: (email: string, password: string) => apiFetch('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signUp: (email: string, password: string, userData: any) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, userData }) }),
  signOut: () => apiFetch('/auth/signout', { method: 'POST' }),
  getSession: () => apiFetch('/auth/session'),
  resetPassword: (email: string) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmResetPassword: (email: string, token: string, newPassword: string) => apiFetch('/auth/reset-password/confirm', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) }),
  updatePassword: (newPassword: string) => apiFetch('/auth/update-password', { method: 'POST', body: JSON.stringify({ newPassword }) }),
  updateProfile: (updates: any) => apiFetch('/profiles/me', { method: 'PUT', body: JSON.stringify(updates) }),
};

export default authService;
