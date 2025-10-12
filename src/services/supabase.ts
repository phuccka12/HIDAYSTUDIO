// Lightweight REST API client to replace Supabase in the frontend.
// The app will call a backend server (Express + MongoDB) that exposes
// compatible endpoints. Set VITE_API_URL in your environment (default http://localhost:4000).

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const isApiAvailable = !!API_URL;

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options && options.headers) as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    return { data: null, error: { message: (data && data.message) || res.statusText } };
  }
  return { data, error: null };
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      return await apiFetch('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi đăng nhập' } };
    }
  },

  async signUp(email: string, password: string, userData: { fullName: string }) {
    try {
      return await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, userData })
      });
    } catch (err) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi đăng ký' } };
    }
  },

  async signOut() {
    try {
      return await apiFetch('/auth/signout', { method: 'POST' });
    } catch (err) {
      return { data: null, error: { message: 'Đăng xuất thất bại' } };
    }
  },

  async getSession() {
    try {
      return await apiFetch('/auth/session');
    } catch (err) {
      return { data: { session: null } };
    }
  },

  async resetPassword(email: string) {
    try {
      return await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (err) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi gửi email khôi phục' } };
    }
  },

  async updatePassword(newPassword: string) {
    try {
      return await apiFetch('/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
    } catch (err) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi cập nhật mật khẩu' } };
    }
  },

  async updateProfile(updates: Partial<Profile>) {
    try {
      return await apiFetch('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (err) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi cập nhật thông tin' } };
    }
  }
};