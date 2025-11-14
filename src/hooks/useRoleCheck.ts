import { useAuth } from '../contexts/AuthContext';

export const useRoleCheck = (requiredRole?: 'admin' | 'user') => {
  const { user, refreshUser } = useAuth();
  const manualRefresh = async () => {
    console.log('🔄 Manual role refresh requested...');
    await refreshUser();
  };

  return {
    currentRole: user?.role,
    isCorrectRole: !requiredRole || user?.role === requiredRole,
    manualRefresh,
  };
};