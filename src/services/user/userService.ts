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

// Real backend queries - no mock data
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
    const { data, error } = await apiFetch(`/users/${userId}/submissions?limit=${limit}`);
    if (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
    return data as WritingSubmission[];
  }
  ,
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
  }
};
