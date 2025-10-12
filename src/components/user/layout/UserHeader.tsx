import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { LayoutDashboard, PencilLine, User, LogOut } from 'lucide-react';

const UserHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  return (
    <header className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 shadow-lg p-6 flex items-center justify-between rounded-b-3xl border-b border-blue-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6D28D9" dy=".3em">H</text></svg>
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">HIDAY</span>
        </div>
        <nav className="flex gap-4 text-base font-semibold">
          <Link to="/user" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors text-blue-700">
            <LayoutDashboard className="w-6 h-6 text-blue-600" /> Dashboard
          </Link>
          <Link to="/user/writing" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-purple-50 transition-colors text-purple-700">
            <PencilLine className="w-6 h-6 text-purple-600" /> Writing
          </Link>
          <Link to="/user/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-pink-50 transition-colors text-pink-700">
            <User className="w-6 h-6 text-pink-600" /> Profile
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <span className="font-semibold text-gray-800">{user?.fullName || user?.email}</span>
        </div>
        <button onClick={signOut} className="ml-2 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-bold flex items-center gap-2 transition-colors">
          <LogOut className="w-5 h-5 text-red-600" /> Logout
        </button>
      </div>
    </header>
  );
};

export default UserHeader;