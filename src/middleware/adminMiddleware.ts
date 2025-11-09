// Admin middleware: rely on user.role (from server) instead of a hardcoded email list
export const adminMiddleware = {
  // Check if user is admin. Accepts either a user object or an email string.
  isAdmin: (userOrEmail: any): boolean => {
    if (!userOrEmail) return false;
    if (typeof userOrEmail === 'string') {
      // We no longer grant admin via email string on the client. Return false.
      return false;
    }
    // If an object was provided, prefer role check
    return (userOrEmail.role || '').toLowerCase() === 'admin';
  },

  // Get user role based on provided user object (fallback to 'user')
  getUserRole: (user: any): 'admin' | 'user' => {
    if (!user) return 'user';
    return adminMiddleware.isAdmin(user) ? 'admin' : 'user';
  },

  // Middleware function for route protection (throws on failure)
  requireAdmin: (user: any) => {
    if (!user || !user.email) {
      throw new Error('Không có thông tin user hợp lệ');
    }
    if (!adminMiddleware.isAdmin(user)) {
      throw new Error('Chỉ admin mới có thể truy cập');
    }
    return true;
  },

  // Middleware for API calls
  checkAdminPermission: async (user: any) => {
    try {
      adminMiddleware.requireAdmin(user);
      return {
        success: true,
        role: 'admin'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        role: 'user'
      };
    }
  }
};

export default adminMiddleware;