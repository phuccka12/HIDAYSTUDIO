import React, { useState } from 'react';
import { userService } from '../../services/user/userService';
import { useAuth } from '../../contexts/AuthContext';
import { isApiAvailable, authService } from '../../services/api';
import { User, Mail, Lock, Camera, Save, Shield } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setStatusMessage(null);
      setIsSaving(true);
      console.log('Saving profile:', formData);

      // Trim full name to avoid trailing spaces
      const trimmedName = formData.fullName?.trim();

      // Update profiles table
      try {
        await userService.updateProfile(user.id, { full_name: trimmedName });
      } catch (err: any) {
        console.error('userService.updateProfile error:', err);
        setStatusMessage(`Lỗi khi cập nhật profiles table: ${err.message || JSON.stringify(err)}`);
        return;
      }

      // Change password if provided
      if (formData.newPassword || formData.confirmPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          alert('Mật khẩu xác nhận không khớp!');
          return;
        }

  const { error: pwError } = await authService.updatePassword(formData.newPassword as string);
        if (pwError) {
          console.error('authService.updatePassword error:', pwError);
          setStatusMessage(`Lỗi khi đổi mật khẩu: ${pwError.message || JSON.stringify(pwError)}`);
          return;
        }

        setStatusMessage('Đã đổi mật khẩu thành công!');
      } else {
        setStatusMessage('Tên đã được cập nhật ở cả tài khoản và hồ sơ!');
      }
      await refreshUser();
      setIsEditing(false);
    } catch (error: any) {
      console.error('Unexpected error updating profile:', error);
      setStatusMessage(`Không thể cập nhật hồ sơ. Chi tiết: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Thông tin cá nhân</h1>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                    return;
                  }
                  setIsEditing(true);
                }}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60"
              >
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.fullName || 'Chưa cập nhật tên'}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex items-center mt-2">
                  <Shield className={`w-4 h-4 mr-2 ${user?.role === 'admin' ? 'text-red-500' : 'text-blue-500'}`} />
                  <span className={`text-sm font-medium ${user?.role === 'admin' ? 'text-red-600' : 'text-blue-600'}`}>
                    {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status message banner */}
          {statusMessage && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-800 text-sm">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Config error: missing API URL */}
          {!isApiAvailable && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-red-800 text-sm">Backend API not configured. Please set <code>VITE_API_URL</code> to your backend server and restart the dev server.</p>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true} // Email usually can't be changed
                      className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-50 cursor-not-allowed"
                      placeholder="Email không thể thay đổi"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Bảo mật</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Xác nhận mật khẩu mới"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto disabled:opacity-60"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;