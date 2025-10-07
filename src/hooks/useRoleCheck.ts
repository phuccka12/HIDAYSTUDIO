import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

/**
 * Hook to check and refresh user role, with automatic redirect
 * Useful when role might have changed in database but not in session
 */
export const useRoleCheck = (requiredRole?: 'admin' | 'user') => {
  const { user, refreshUser } = useAuth();
  // const navigate = useNavigate();

  // Temporarily disable auto-refresh to prevent loops
  // useEffect(() => {
  //   // Auto-refresh user data on mount to get latest role
  //   if (user) {
  //     console.log('🔄 Auto-refreshing user role on mount...');
  //     refreshUser();
  //   }
  // }, [user?.id, refreshUser]);

  // Temporarily disable auto-redirect to prevent infinite loops
  // useEffect(() => {
  //   // Check role and redirect if needed
  //   if (user && requiredRole && user.role !== requiredRole) {
  //     console.log(`❌ Role mismatch. Required: ${requiredRole}, Current: ${user.role}`);
      
  //     // Redirect to appropriate dashboard
  //     if (user.role === 'admin') {
  //       navigate('/admin-dashboard');
  //     } else {
  //       navigate('/user-dashboard');
  //     }
  //   }
  // }, [user?.role, requiredRole, navigate]);

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