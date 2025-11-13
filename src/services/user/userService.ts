import { apiFetch } from '../../services/_apiClient';
import type { WritingSubmission } from '../../services/dashboard';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
}

export interface UserProgressItem {
  id: string;
  user_id: string;
  skill_type: string;
  current_level: number;
  target_score: number;
  completed_exercises: number;
  created_at: string;
}

export interface DashboardData {
  account: UserProfile;
  gradingHistory: Array<{
    id: string;
    task_type?: string;
    prompt: string;
    content?: string;
    created_at: string;
    ai_score: number | null;
    ai_criteria?: Record<string, number>;
    ai_feedback?: string[] | string;
    ai_corrected?: string;
    ai_corrections?: string;
    graded_at: string;
  }>;
  aiScores: {
    average: number | null;
    latest: Array<{ id: string; ai_score: number | null; graded_at: string }>;
  };
  progress: {
    attemptsCount: number;
    gradedAttempts: number;
    lastAttempt: unknown | null;
    skills: UserProgressItem[];
  };
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
  }>;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await apiFetch(`/profiles/${userId}`);
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
    return data as UserProfile;
  },
async getUserProgress(userId: string): Promise<UserProgressItem[]> {
    const { data, error } = await apiFetch(`/users/${userId}/progress`);
    if (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
    return data as UserProgressItem[];
  },
 async getUserSubmissions(userId: string, limit = 10): Promise<WritingSubmission[]> {
    const { data, error } = await apiFetch(`/submissions?user_id=${encodeURIComponent(userId)}&limit=${limit}`);
    if (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
    return data as WritingSubmission[];
  },
  async getDashboard(): Promise<DashboardData> {
    try {
      const { data, error } = await apiFetch('/profiles/me/dashboard');
      if (error) {
        console.error('Error fetching dashboard:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error in getDashboard:', err);
      throw err;
    }
  },
async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await apiFetch(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data as UserProfile;
  },

  async updateTargetScore(userId: string, skillType: string, targetScore: number) {
    const { data, error } = await apiFetch(`/users/${userId}/progress/${skillType}/target`, {
      method: 'PUT',
      body: JSON.stringify({ target_score: targetScore })
    });

    if (error) {
      console.error('Error updating target score:', error);
      throw error;
    }

    return data;
  }
};