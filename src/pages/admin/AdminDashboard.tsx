import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, BarChart3, Settings, Shield, Database, UserPlus, UserCog, UserMinus, Lock } from 'lucide-react';
import { dashboardService } from '../../services/dashboard';
import type { DashboardStats, WritingSubmission } from '../../services/dashboard';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSubmissions: 0,
    activeUsers: 0,
    databaseSize: 'Loading...',
  });
  const [recentSubmissions, setRecentSubmissions] = useState<WritingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const adminStats = await dashboardService.getAdminStats();
        setStats(adminStats);
        const submissions = await dashboardService.getRecentSubmissions(5);
        setRecentSubmissions(submissions || []);
      } catch (e) {
        console.error('Error loading admin data', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🛡️ Admin Dashboard</h1>
              <p className="text-gray-600">Xin chào, {user?.fullName || user?.email} - Bảng điều khiển quản trị</p>
            </div>
            <div className="flex items-center bg-red-100 px-4 py-2 rounded-full">
              <Shield className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-600 font-semibold">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Tổng học viên</p>
                <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Bài writing đã chấm</p>
                <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.totalSubmissions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Người dùng hoạt động</p>
                <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Dung lượng DB</p>
                <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.databaseSize}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management – redesigned to match other sections */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Quản lý người dùng
            </h2>
            <div className="space-y-4">
              <Link to="/admin/users" className="w-full block">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center"><Users className="w-5 h-5 mr-2" />Danh sách người dùng</span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/users/create" className="w-full block">
                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center"><UserPlus className="w-5 h-5 mr-2" />Thêm người dùng</span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/users/roles" className="w-full block">
                <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center"><UserCog className="w-5 h-5 mr-2" />Phân quyền & vai trò</span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/users/status" className="w-full block">
                <button className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center"><Lock className="w-5 h-5 mr-2" />Khóa / Mở khóa tài khoản</span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/users/remove" className="w-full block">
                <button className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-between">
                  <span className="flex items-center"><UserMinus className="w-5 h-5 mr-2" />Xóa / vô hiệu hóa</span>
                  <span>→</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Content Management */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-green-600" />
              Quản lý nội dung
            </h2>
            <div className="space-y-4">
              <Link to="/admin/recent-submissions" className="w-full block">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center">📝 <span className="ml-2">Xem bài writing đã chấm</span></span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/content/lessons" className="w-full block">
                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center">📚 <span className="ml-2">Quản lý bài học</span></span>
                  <span>→</span>
                </button>
              </Link>

              <Link to="/admin/content/exams" className="w-full block">
                <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between">
                  <span className="flex items-center">🎯 <span className="ml-2">Quản lý đề thi</span></span>
                  <span>→</span>
                </button>
              </Link>

              <button className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors text-left">📊 Báo cáo chi tiết</button>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-purple-600" />
              Cài đặt hệ thống
            </h2>
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-left">🔧 Cấu hình chung</button>
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-left">🔐 Bảo mật & quyền</button>
              <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-left">🔄 Backup & restore</button>
              <button className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors text-left">🚨 Logs & monitoring</button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Bài writing gần đây</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chưa có bài writing nào được nộp</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((submission) => {
                const timeAgo = new Date(submission.createdAt).toLocaleString('vi-VN');
                return (
                  <div key={submission.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${submission.aiScore ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <div>
                        <p className="font-medium text-gray-800">Writing {(submission.taskType || 'unknown').toUpperCase()}{submission.aiScore && (<span className="ml-2 text-sm text-green-600 font-semibold">(Điểm: {submission.aiScore})</span>)}</p>
                        <p className="text-sm text-gray-500">{submission.userEmail || 'Unknown user'}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{(submission.content || '').substring(0, 100)}...</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
