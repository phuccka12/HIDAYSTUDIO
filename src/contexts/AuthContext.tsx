import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type Profile } from '../services/api';
import { apiFetch } from '../services/_apiClient';
import adminMiddleware from '../middleware/adminMiddleware';

// User interface that matches our app needs
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
}

// Helper to get normalized backend id (accept _id or id)
const getBackendUserId = (backendUser: any) => {
  if (!backendUser) return undefined;
  if (backendUser.id) return String(backendUser.id);
  if (backendUser._id) return String(backendUser._id);
  // nested shape (some endpoints wrap user) — try common fields
  if (backendUser.user && (backendUser.user.id || backendUser.user._id)) return String(backendUser.user.id || backendUser.user._id);
  return undefined;
};

// Helper function to convert backend user + profile to our User type
const convertBackendUser = (backendUser: any, profile?: Profile | null): User | null => {
  if (!backendUser) return null;

  const normalizedId = getBackendUserId(backendUser);
  // Use middleware to determine role
  const role = adminMiddleware.getUserRole(backendUser.email);

  console.log('🔄 Converting backend user:', {
    userId: normalizedId,
    email: backendUser.email,
    profile: profile,
    profileRole: profile?.role,
    middlewareRole: role,
    finalRole: role
  });

  // Ưu tiên lấy tên từ user metadata, nếu không có thì lấy từ profile.full_name, cuối cùng là email
  const convertedUser = {
    id: normalizedId || '',
    email: backendUser.email,
    fullName: backendUser.user_metadata?.full_name || profile?.full_name || backendUser.email,
    role: role,
    avatar: profile?.avatar_url ?? '',
  } as User;

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
        const { data } = await authService.getSession();
        if (data.session?.user) {
          console.log('👤 Found existing session for:', data.session.user.email);
          console.log('🔍 Trying to fetch profile for role...');

          try {
            const backendId = getBackendUserId(data.session.user);
            console.debug('checkSession: backendId=', backendId);
            const profilePromise = apiFetch(`/profiles/${backendId}`);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 2000)
            );

            const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

              if (error) {
              console.error('❌ Profile fetch error on startup:', error);
              const basicUser = convertBackendUser(data.session.user, null);
              setUser(basicUser);
              console.log('⚠️ Using basic user without profile on startup');
              } else {
              console.log('✅ Profile loaded on startup:', profile);
              const convertedUser = convertBackendUser(data.session.user, profile);
              setUser(convertedUser);
            }
          } catch (error) {
            console.error('❌ Profile query timeout on startup:', error);
            const basicUser = convertBackendUser(data.session.user, null);
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

  // Listen for auth changes. With our REST backend we'll rely on cookie/session persistence
  // and manual refreshes. For development, poll session periodically to detect changes.
    let polling = true;
    const pollInterval = 5000; // 5s
    const poll = async () => {
      while (polling) {
        try {
          const { data: sessionData } = await authService.getSession();
          const session = sessionData?.session;
          if (session?.user) {
            // fetch profile
            try {
              const backendId = getBackendUserId(session.user);
              const { data: profile, error } = await apiFetch(`/profiles/${backendId}`);
                if (!error) {
                const convertedUser = convertBackendUser(session.user, profile);
                setUser(convertedUser);
              } else {
                const basicUser = convertBackendUser(session.user, null);
                setUser(basicUser);
              }
            } catch (err) {
                const basicUser = convertBackendUser(session.user, null);
                setUser(basicUser);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          // ignore poll errors
        }
        await new Promise(r => setTimeout(r, pollInterval));
      }
    };
    poll();

    return () => {
      polling = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.signIn(email, password);
      if (result.data?.user) {
        const profile = (result.data as any).profile;
        const convertedUser = convertBackendUser(result.data.user, profile);
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
        // Refresh user data from our backend
        const { data: sessionData } = await authService.getSession();
        if (sessionData?.session?.user) {
          const { data: profile } = await apiFetch(`/profiles/${sessionData.session.user.id}`) as any;
          const convertedUser = convertBackendUser(sessionData.session.user, profile);
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
      const { data } = await authService.getSession();
      if (!data.session?.user) {
        setUser(null);
        return;
      }

      console.log('🔄 Refreshing user data...');
      const backendId = getBackendUserId(data.session.user);
      const { data: profile, error } = await apiFetch(`/profiles/${backendId}`) as any;

      if (!error) {
        const convertedUser = convertBackendUser(data.session.user, profile);
        setUser(convertedUser);
        console.log('✅ Profile refreshed:', profile);
      }
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