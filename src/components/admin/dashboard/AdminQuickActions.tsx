import React from 'react';
import { Users, Settings, FileText, TrendingUp, Database, Shield } from 'lucide-react';

const AdminQuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Quản lý người dùng',
      description: 'Thêm, sửa, xóa tài khoản người dùng',
      icon: Users,
      color: 'blue',
      onClick: () => console.log('Navigate to user management')
    },
    {
      title: 'Xem tất cả bài nộp',
      description: 'Duyệt và quản lý bài writing của học viên',
      icon: FileText,
      color: 'green',
      onClick: () => console.log('Navigate to submissions')
    },
    {
      title: 'Báo cáo thống kê',
      description: 'Xem báo cáo chi tiết và phân tích dữ liệu',
      icon: TrendingUp,
      color: 'purple',
      onClick: () => console.log('Navigate to reports')
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình và tùy chỉnh hệ thống',
      icon: Settings,
      color: 'orange',
      onClick: () => console.log('Navigate to settings')
    },
    {
      title: 'Quản lý database',
      description: 'Backup, restore và tối ưu database',
      icon: Database,
      color: 'indigo',
      onClick: () => console.log('Navigate to database')
    },
    {
      title: 'Bảo mật hệ thống',
      description: 'Kiểm tra logs và cài đặt bảo mật',
      icon: Shield,
      color: 'red',
      onClick: () => console.log('Navigate to security')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <Settings className="h-6 w-6 text-purple-600 mr-2" />
        Thao tác nhanh
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`${getColorClasses(action.color)} text-white p-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-left group`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminQuickActions;