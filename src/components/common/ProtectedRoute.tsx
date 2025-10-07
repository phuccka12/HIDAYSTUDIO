import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminMiddleware from '../../middleware/adminMiddleware';
// import { useRoleCheck } from '../../hooks/useRoleCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user' 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  // Temporarily disable auto-redirect to prevent conflicts
  // const { manualRefresh } = useRoleCheck(requiredRole);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role permissions
  console.log('🔐 ProtectedRoute Debug:', {
    requiredRole,
    userRole: user?.role,
    userEmail: user?.email,
    isAuthenticated
  });
  
  // Use middleware to check admin access (synchronous)
  const isAdminByMiddleware = user?.email ? adminMiddleware.isAdmin(user.email) : false;
  
  console.log('🛡️ Middleware check:', {
    userEmail: user?.email,
    isAdminByMiddleware,
    requiredRole
  });
  
  if (requiredRole === 'admin' && !isAdminByMiddleware) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập vào trang này. Chỉ admin mới có thể vào.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Current role: <strong>{user?.role || 'undefined'}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Required role: <strong>{requiredRole}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Admin by middleware: <strong>{isAdminByMiddleware ? 'YES' : 'NO'}</strong>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;