// Admin emails configuration
const ADMIN_EMAILS = [
  'phuccao03738@gmail.com',
  'admin@ielts-platform.com',
  // Thêm email admin khác ở đây
];

// Admin middleware
export const adminMiddleware = {
  // Check if user is admin
  isAdmin: (email: string): boolean => {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  },

  // Get user role based on email
  getUserRole: (email: string): 'admin' | 'user' => {
    return adminMiddleware.isAdmin(email) ? 'admin' : 'user';
  },

  // Middleware function for route protection
  requireAdmin: (user: any) => {
    if (!user) {
      throw new Error('Không có thông tin user');
    }
    
    if (!user.email) {
      throw new Error('Email không hợp lệ');
    }
    
    if (!adminMiddleware.isAdmin(user.email)) {
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