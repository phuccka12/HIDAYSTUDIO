// Local Authentication Service - No Supabase needed
export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  createdAt: string;
  avatar?: string;
}

export interface AuthResponse {
  data: {
    user: LocalUser | null;
    session: {
      access_token: string;
      user: LocalUser;
    } | null;
  };
  error: {
    message: string;
  } | null;
}

// Mock users database
const MOCK_USERS: LocalUser[] = [
  {
    id: '1',
    email: 'admin@ielts.com',
    fullName: 'IELTS Admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
    avatar: 'https://ui-avatars.com/api/?name=IELTS+Admin&background=3b82f6&color=fff'
  },
  {
    id: '2', 
    email: 'user@ielts.com',
    fullName: 'IELTS Student',
    role: 'user',
    createdAt: new Date().toISOString(),
    avatar: 'https://ui-avatars.com/api/?name=IELTS+Student&background=10b981&color=fff'
  }
];

class LocalAuthService {
  private currentUser: LocalUser | null = null;
  private readonly STORAGE_KEY = 'ielts_auth_user';
  private readonly SESSION_KEY = 'ielts_auth_session';

  constructor() {
    // Load user from localStorage on init
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      const storedSession = localStorage.getItem(this.SESSION_KEY);
      
      if (storedUser && storedSession) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearStorage();
    }
  }

  private saveUserToStorage(user: LocalUser): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        access_token: `mock_token_${user.id}_${Date.now()}`,
        user: user,
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser = null;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Find user by email
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
          resolve({
            data: { user: null, session: null },
            error: { message: 'Email không tồn tại trong hệ thống' }
          });
          return;
        }

        // Simple password check (in real app, you'd hash passwords)
        const validPasswords = ['123456', 'password', 'admin123'];
        if (!validPasswords.includes(password)) {
          resolve({
            data: { user: null, session: null },
            error: { message: 'Mật khẩu không đúng' }
          });
          return;
        }

        // Success - save user and create session
        this.currentUser = user;
        this.saveUserToStorage(user);

        const session = {
          access_token: `mock_token_${user.id}_${Date.now()}`,
          user: user
        };

        resolve({
          data: { user, session },
          error: null
        });
      }, 1000); // Simulate network delay
    });
  }

  async signUp(email: string, password: string, userData: any): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if user already exists
        const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          resolve({
            data: { user: null, session: null },
            error: { message: 'Email đã được sử dụng' }
          });
          return;
        }

        // Create new user
        const newUser: LocalUser = {
          id: Date.now().toString(),
          email: email,
          fullName: userData.fullName || 'IELTS Student',
          role: 'user',
          createdAt: new Date().toISOString(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=3b82f6&color=fff`
        };

        // Add to mock database
        MOCK_USERS.push(newUser);
        
        // Auto login after signup
        this.currentUser = newUser;
        this.saveUserToStorage(newUser);

        const session = {
          access_token: `mock_token_${newUser.id}_${Date.now()}`,
          user: newUser
        };

        resolve({
          data: { user: newUser, session },
          error: null
        });
      }, 1500); // Simulate network delay
    });
  }

  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.clearStorage();
        resolve();
      }, 500);
    });
  }

  async getSession(): Promise<{ data: { session: any | null } }> {
    try {
      const storedSession = localStorage.getItem(this.SESSION_KEY);
      if (storedSession) {
        const session = JSON.parse(storedSession);
        
        // Check if session is expired
        if (session.expires_at && Date.now() > session.expires_at) {
          this.clearStorage();
          return { data: { session: null } };
        }
        
        return { data: { session } };
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
    
    return { data: { session: null } };
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  async updateProfile(updates: Partial<LocalUser>): Promise<AuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.currentUser) {
          resolve({
            data: { user: null, session: null },
            error: { message: 'Chưa đăng nhập' }
          });
          return;
        }

        // Update current user
        this.currentUser = { ...this.currentUser, ...updates };
        
        // Update in mock database
        const userIndex = MOCK_USERS.findIndex(u => u.id === this.currentUser!.id);
        if (userIndex !== -1) {
          MOCK_USERS[userIndex] = this.currentUser;
        }
        
        // Save to storage
        this.saveUserToStorage(this.currentUser);

        resolve({
          data: { 
            user: this.currentUser, 
            session: { 
              access_token: `mock_token_${this.currentUser.id}_${Date.now()}`,
              user: this.currentUser 
            }
          },
          error: null
        });
      }, 800);
    });
  }

  // Helper method to get all users (for admin)
  getAllUsers(): LocalUser[] {
    return [...MOCK_USERS];
  }
}

// Export singleton instance
export const localAuthService = new LocalAuthService();

// Export demo credentials for easy testing
export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@ielts.com',
    password: '123456',
    description: 'Tài khoản admin với quyền quản trị'
  },
  user: {
    email: 'user@ielts.com', 
    password: '123456',
    description: 'Tài khoản học viên thông thường'
  }
};