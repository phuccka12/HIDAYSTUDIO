import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
🚨 Missing Supabase environment variables!

Please create a .env.local file in your project root with:

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

See SUPABASE_SETUP.md for complete setup instructions.
  `);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// Authentication Service
export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      // Get user profile
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        return {
          data: {
            user: data.user,
            session: data.session,
            profile,
          },
          error: null,
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Đã xảy ra lỗi khi đăng nhập' },
      };
    }
  },

  // Sign up with email and password
  async signUp(email: string, password: string, userData: { fullName: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
          },
        },
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Đã xảy ra lỗi khi đăng ký' },
      };
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    return await supabase.auth.getSession();
  },

  // Reset password - send email
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { 
        data: { message: 'Email khôi phục mật khẩu đã được gửi!' }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Đã xảy ra lỗi khi gửi email khôi phục' },
      };
    }
  },

  // Update password (after reset)
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { 
        data: { message: 'Mật khẩu đã được cập nhật thành công!' }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Đã xảy ra lỗi khi cập nhật mật khẩu' },
      };
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<Profile>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'Chưa đăng nhập' } };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Đã xảy ra lỗi khi cập nhật thông tin' },
      };
    }
  },
};