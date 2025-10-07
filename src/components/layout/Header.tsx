import React, { useState } from 'react';
import { Menu, X, BookOpen, User, LogOut, ChevronDown, Home, BarChart3, Settings, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../ui/AuthModal';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, isAuthenticated, signOut, refreshUser } = useAuth();
  const location = useLocation();

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  const handleRefreshRole = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      console.log('✅ Role refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing role:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-lg border-b border-blue-100/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center ml-2 md:ml-0">
              <div className="relative">
                <BookOpen className="h-8 w-8 text-blue-600 drop-shadow-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                HIDAY <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BETA</span>
              </span>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated ? (
              // Authenticated navigation
              <>
                <Link to="/" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Trang chủ
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                <Link to="/dashboard" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                    Admin
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                  </Link>
                )}
              </>
            ) : (
              // Public navigation 
              <>
                <a href="#home" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Trang chủ
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </a>
                <a href="#features" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Tính năng
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </a>
                <a href="#ai-writing" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  <span className="relative">
                    AI Writing
                    <span className="absolute -top-1 -right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </a>
                <a href="#pricing" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Bảng giá
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </a>
                <a href="#contact" className="relative text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 group">
                  Liên hệ
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-200"></span>
                </a>
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="font-medium text-gray-700">
                    {user?.fullName || user?.email}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link 
                      to={user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} 
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="mr-3" />
                      Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings size={16} className="mr-3" />
                      Hồ sơ
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin-dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        <BarChart3 size={16} className="mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleRefreshRole}
                      disabled={isRefreshing}
                      className="flex items-center w-full px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={`mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Đang cập nhật...' : 'Refresh Role'}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleAuthClick('login')}
                  className="relative px-6 py-2.5 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 group overflow-hidden"
                >
                  <span className="relative z-10">Đăng nhập</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                </button>
                <button 
                  onClick={() => handleAuthClick('register')}
                  className="relative px-6 py-2.5 font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 group overflow-hidden"
                >
                  <span className="relative z-10">Đăng ký</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce opacity-75"></div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100/50 transition-all duration-300 transform",
        isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 hidden"
      )}>
        <div className="px-4 pt-3 pb-4 space-y-2">
          <a href="#home" className="block px-4 py-3 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white/60 transition-all duration-200">
            Trang chủ
          </a>
          <a href="#features" className="block px-4 py-3 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white/60 transition-all duration-200">
            Tính năng
          </a>
          <a href="#ai-writing" className="block px-4 py-3 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white/60 transition-all duration-200 relative">
            <span className="flex items-center">
              AI Writing
              <span className="ml-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            </span>
          </a>
          <a href="#pricing" className="block px-4 py-3 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white/60 transition-all duration-200">
            Bảng giá
          </a>
          <a href="#contact" className="block px-4 py-3 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-white/60 transition-all duration-200">
            Liên hệ
          </a>
          
          {/* Mobile Auth Buttons */}
          {!isAuthenticated && (
            <div className="pt-4 space-y-3 border-t border-blue-100">
              <button 
                onClick={() => handleAuthClick('login')}
                className="w-full px-4 py-3 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => handleAuthClick('register')}
                className="w-full px-4 py-3 font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};

export default Header;