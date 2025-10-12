import { apiFetch } from './_apiClient';

// Dashboard data interfaces
export interface DashboardStats {
  totalUsers: number;
  totalSubmissions: number;
  activeUsers: number;
  databaseSize: string;
}

export interface UserProgress {
  skill: string;
  current: number;
  target: number;
  totalExercises: number;
  completedExercises: number;
}

export interface RecentActivity {
  id: string;
  time: string;
  action: string;
  user: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface WritingSubmission {
  id: string;
  userId: string;
  taskType: 'task1' | 'task2';
  prompt: string;
  content: string;
  aiScore: number | null;
  aiFeedback: any;
  createdAt: string;
  userEmail?: string;
}

// Dashboard Service
export const dashboardService = {
  // Get admin dashboard stats
  async getAdminStats(): Promise<DashboardStats> {
    try {
      const { data, error } = await apiFetch('/admin/stats');
      if (error) throw error;
      return data as DashboardStats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        totalSubmissions: 0,
        activeUsers: 0,
        databaseSize: 'Error',
      };
    }
  },

  // Get user's personal progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const { data, error } = await apiFetch(`/users/${userId}/progress`);
      if (error) {
        console.error('Error fetching user progress:', error);
        return [];
      }
      return data as UserProgress[] || [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  },

  // Get recent writing submissions (for admin)
  async getRecentSubmissions(limit: number = 10): Promise<WritingSubmission[]> {
    try {
      const { data, error } = await apiFetch(`/admin/recent-submissions?limit=${limit}`);
      if (error) {
        console.error('Error fetching recent submissions:', error);
        return [];
      }
      return data as WritingSubmission[] || [];
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      return [];
    }
  },

  // Get user's writing submissions
  async getUserSubmissions(userId: string, limit: number = 5): Promise<WritingSubmission[]> {
    try {
      const { data, error } = await apiFetch(`/users/${userId}/submissions?limit=${limit}`);
      if (error) {
        console.error('Error fetching user submissions:', error);
        return [];
      }
      return data as WritingSubmission[] || [];
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }
  },

  // Create or update user progress
  async updateUserProgress(userId: string, skillType: string, progress: Partial<UserProgress>): Promise<boolean> {
    try {
      const { error } = await apiFetch(`/users/${userId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ skillType, progress })
      });

      if (error) {
        console.error('Error updating user progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user progress:', error);
      return false;
    }
  },

  // Admin: list users
  async listUsers(): Promise<Array<any>> {
    try {
      const { data, error } = await apiFetch('/admin/users');
      if (error) throw error;
      return data as any[] || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Admin: update user role
  async updateUserRole(userId: string, role: 'user' | 'admin') {
    try {
      const { data, error } = await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Admin: delete user
  async deleteUser(userId: string) {
    try {
      const { data, error } = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
,
  // Admin: create user
  async createUser(payload: { email: string; password: string; full_name?: string; role?: string }) {
    try {
      const { data, error } = await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Admin: change user password
  async changeUserPassword(userId: string, newPassword: string) {
    try {
      const { data, error } = await apiFetch(`/admin/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error changing user password:', error);
      throw error;
    }
  }
};