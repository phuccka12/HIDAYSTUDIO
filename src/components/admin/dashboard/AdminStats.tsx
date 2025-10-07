import React from 'react';
import { Users, UserCheck, UserX, Crown } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  totalSubmissions: number;
  databaseSize: string;
}

const AdminStats: React.FC<AdminStatsProps> = ({
  totalUsers,
  activeUsers,
  totalSubmissions,
  databaseSize
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Tổng người dùng</p>
            <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
            <p className="text-sm text-blue-600 mt-1">+12% so với tháng trước</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Người dùng hoạt động</p>
            <p className="text-3xl font-bold text-gray-800">{activeUsers}</p>
            <p className="text-sm text-green-600 mt-1">+8% so với tuần trước</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Total Submissions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Tổng bài nộp</p>
            <p className="text-3xl font-bold text-gray-800">{totalSubmissions}</p>
            <p className="text-sm text-purple-600 mt-1">+25% so với tháng trước</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Database Size */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Dung lượng DB</p>
            <p className="text-3xl font-bold text-gray-800">{databaseSize}</p>
            <p className="text-sm text-orange-600 mt-1">Còn 2.1GB trống</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <UserX className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;