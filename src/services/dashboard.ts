import { supabase } from './supabase';

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
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total writing submissions count  
      const { count: totalSubmissions } = await supabase
        .from('writing_submissions')
        .select('*', { count: 'exact', head: true });

      // Get active users (users who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      return {
        totalUsers: totalUsers || 0,
        totalSubmissions: totalSubmissions || 0,
        activeUsers: activeUsers || 0,
        databaseSize: 'N/A', // This would need database admin access
      };
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
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user progress:', error);
        return [];
      }

      return data?.map(item => ({
        skill: item.skill_type,
        current: item.current_level || 0,
        target: item.target_score || 7.0,
        totalExercises: item.total_exercises || 0,
        completedExercises: item.completed_exercises || 0,
      })) || [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  },

  // Get recent writing submissions (for admin)
  async getRecentSubmissions(limit: number = 10): Promise<WritingSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('writing_submissions')
        .select(`
          *,
          profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent submissions:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        userId: item.user_id,
        taskType: item.task_type,
        prompt: item.prompt,
        content: item.content,
        aiScore: item.ai_score,
        aiFeedback: item.ai_feedback,
        createdAt: item.created_at,
        userEmail: (item.profiles as any)?.email,
      })) || [];
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      return [];
    }
  },

  // Get user's writing submissions
  async getUserSubmissions(userId: string, limit: number = 5): Promise<WritingSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('writing_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }
  },

  // Create or update user progress
  async updateUserProgress(userId: string, skillType: string, progress: Partial<UserProgress>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          skill_type: skillType,
          current_level: progress.current,
          target_score: progress.target,
          total_exercises: progress.totalExercises,
          completed_exercises: progress.completedExercises,
          updated_at: new Date().toISOString(),
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
};