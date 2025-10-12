import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, PencilLine, BarChart2, User, Sparkle } from 'lucide-react';

const UserSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white rounded-3xl p-6 shadow-xl border border-blue-100">
      <ul className="space-y-4 text-base font-semibold">
        <li>
          <Link to="/user" className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors text-blue-700">
            <LayoutDashboard className="w-6 h-6 text-blue-600" /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/user/writing" className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-purple-50 transition-colors text-purple-700">
            <PencilLine className="w-6 h-6 text-purple-600" /> Writing Practice
          </Link>
        </li>
        <li>
          <Link to="/user/progress" className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-green-50 transition-colors text-green-700">
            <BarChart2 className="w-6 h-6 text-green-600" /> My Progress
          </Link>
        </li>
        <li>
          <Link to="/user/writing-history" className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-yellow-50 transition-colors text-yellow-700">
            <Sparkle className="w-6 h-6 text-yellow-500" /> Writing History
          </Link>
        </li>
        <li>
          <Link to="/user/profile" className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-pink-50 transition-colors text-pink-700">
            <User className="w-6 h-6 text-pink-600" /> Profile
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default UserSidebar;