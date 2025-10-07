import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, authService, type Profile } from '../services/supabase';
import adminMiddleware from '../middleware/adminMiddleware';

// User interface that matches our app needs
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
}

// Helper function to convert Supabase user + profile to our User type
const convertSupabaseUser = (supabaseUser: any, profile?: Profile | null): User | null => {
  if (!supabaseUser) return null;
  
  // Use middleware to determine role
  const role = adminMiddleware.getUserRole(supabaseUser.email);
  
  console.log('🔄 Converting Supabase user:', {
    supabaseUserId: supabaseUser.id,
    email: supabaseUser.email,
    profile: profile,
    profileRole: profile?.role,
    middlewareRole: role,
    finalRole: role
  });
  
  const convertedUser = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email,
    role: role, // Use middleware role instead of profile role
    avatar: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
  };
  
  console.log('✅ Converted user result:', convertedUser);
  return convertedUser;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ data?: any; error?: any }>;
  resetPassword: (email: string) => Promise<{ data?: any; error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ data?: any; error?: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      setIsLoading(true);
      console.log('🔍 Checking existing session...');
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          console.log('👤 Found existing session for:', data.session.user.email);
          
          // QUICK FIX: Skip profile query on startup too
          console.log('🔍 Trying to fetch profile for role...');
          
          try {
            // Try to fetch profile with timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
            
            console.log('📊 Profile query created, waiting for response...');
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 2000) // Reduced to 2s
            );
            
            const { data: profile, error } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;
          
            console.log('📋 Profile query result:', { 
              profile, 
              error,
              hasProfile: !!profile,
              profileRole: profile?.role 
            });
          
            if (error) {
              console.error('❌ Profile fetch error on startup:', error);
              // Use basic user without profile
              const basicUser = convertSupabaseUser(data.session.user, null);
              setUser(basicUser);
              console.log('⚠️ Using basic user without profile on startup');
            } else {
              console.log('✅ Profile loaded on startup:', profile);
              const convertedUser = convertSupabaseUser(data.session.user, profile);
              setUser(convertedUser);
            }
          } catch (error) {
            console.error('❌ Profile query timeout on startup:', error);
            // Fallback to basic user
            const basicUser = convertSupabaseUser(data.session.user, null);
            setUser(basicUser);
            console.log('⚠️ Timeout fallback: Using basic user');
          }
        } else {
          console.log('🚫 No existing session found');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
      } finally {
        console.log('⏹️ Session check complete, setting loading to false');
        setIsLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth timeout - setting loading to false');
      setIsLoading(false);
    }, 5000); // 5 second timeout

    checkSession().then(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          console.log('👤 User signed in:', session.user.email);
          
          console.log('🔍 Trying to fetch profile for role...');
          
          try {
            console.log('👤 Fetching user profile...');
            
            // Debug: Test simple query first
            console.log('🔍 Testing auth.uid():', session.user.id);
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 2000)
            );
            
            const { data: profile, error } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;
            
            console.log('📊 Raw profile query result:', { profile, error });
            
            if (error) {
              console.error('❌ Profile fetch error:', error);
              
              // Create user without profile for now
              const basicUser = convertSupabaseUser(session.user, null);
              setUser(basicUser);
              console.log('⚠️ Using basic user without profile');
              
            } else {
              console.log('✅ Profile found:', profile);
              const convertedUser = convertSupabaseUser(session.user, profile);
              setUser(convertedUser);
            }
          } catch (err) {
            console.error('❌ Unexpected error:', err);
            // Fallback: create user without profile
            const basicUser = convertSupabaseUser(session.user, null);
            setUser(basicUser);
            console.log('⚠️ Fallback: Using basic user due to error');
          }
        } else {
          console.log('🚪 User signed out');
          setUser(null);
        }
        console.log('⏹️ Setting loading to false');
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.signIn(email, password);
      
      if (result.data?.user) {
        // Profile is included in our custom response
        const profile = (result.data as any).profile;
        const convertedUser = convertSupabaseUser(result.data.user, profile);
        setUser(convertedUser);
      }
      
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      return { data: null, error: { message: 'Đã xảy ra lỗi khi đăng nhập' } };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    try {
      const result = await authService.signUp(email, password, userData);
      
      // For email confirmation flow, user won't be logged in immediately
      // So we set loading to false and don't set user
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      return { data: null, error: { message: 'Đã xảy ra lỗi khi đăng ký' } };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const result = await authService.updateProfile(updates);
      
      if (result.data) {
        // Refresh user data
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          const convertedUser = convertSupabaseUser(data.user, profile);
          setUser(convertedUser);
        }
      }
      
      return result;
    } catch (error) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi cập nhật thông tin' } };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi gửi email khôi phục' } };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (error) {
      return { data: null, error: { message: 'Đã xảy ra lỗi khi cập nhật mật khẩu' } };
    }
  };

  const refreshUser = async () => {
    if (isRefreshing) {
      console.log('🔄 Already refreshing, skipping...');
      return;
    }
    
    setIsRefreshing(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        setUser(null);
        return;
      }

      console.log('🔄 Refreshing user data...');
      
      // Fetch fresh profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (error) {
        console.error('❌ Error refreshing profile:', error);
        // Keep existing user data
        return;
      }

      console.log('✅ Profile refreshed:', profile);
      const updatedUser = convertSupabaseUser(data.session.user, profile);
      setUser(updatedUser);
      console.log('🎯 User role updated to:', updatedUser?.role);
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};