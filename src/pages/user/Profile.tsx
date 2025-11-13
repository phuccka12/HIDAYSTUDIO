import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isApiAvailable, authService } from '../../services/api';
import { User, Mail, Lock, Camera, Save, Shield, Target } from 'lucide-react';
import { userService } from '../../services/user/userService';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Target scores state
  const [targetScores, setTargetScores] = useState({
    listening: 7.0,
    reading: 7.0, 
    writing: 7.0,
    speaking: 6.5
  });

  // Available IELTS band scores
  const bandScoreOptions = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

  // Load user progress data
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user?.id) return;
      
      try {
        const progress = await userService.getUserProgress(user.id);
        const targets: any = { listening: 7.0, reading: 7.0, writing: 7.0, speaking: 6.5 };
        
        progress.forEach(p => {
          if (p.target_score) {
            targets[p.skill_type] = p.target_score;
          }
        });
        
        setTargetScores(targets);
      } catch (error) {
        console.error('Failed to load user progress:', error);
      }
    };

    loadUserProgress();
  }, [user?.id]);

  const getErrorMessage = (e: unknown) => {
    if (!e) return '';
    if (typeof e === 'string') return e;
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message?: unknown }).message);
    return JSON.stringify(e);
  };

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

      // Update profiles via authenticated endpoint (/profiles/me)
      try {
        await authService.updateProfile({ full_name: trimmedName });
      } catch (err: unknown) {
        console.error('authService.updateProfile error:', err);
        setStatusMessage(`Lỗi khi cập nhật hồ sơ: ${getErrorMessage(err)}`);
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
    } catch (error: unknown) {
      console.error('Unexpected error updating profile:', error);
      setStatusMessage(`Không thể cập nhật hồ sơ. Chi tiết: ${getErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for target score changes
  const handleTargetScoreChange = (skillType: string, score: number) => {
    setTargetScores(prev => ({ ...prev, [skillType]: score }));
  };

  // Save target scores
  const handleSaveTargets = async () => {
    if (!user?.id) return;
    
    setIsLoadingTargets(true);
    try {
      // Update each skill's target score
      for (const [skillType, score] of Object.entries(targetScores)) {
        await userService.updateTargetScore(user.id, skillType, score);
      }
      
      setIsEditingTargets(false);
      setStatusMessage('Cập nhật điểm mục tiêu thành công!');
    } catch (error) {
      console.error('Failed to save target scores:', error);
      setStatusMessage('Có lỗi xảy ra khi cập nhật điểm mục tiêu');
    } finally {
      setIsLoadingTargets(false);
    }
  };

  // Calculate target average
  const targetAverage = Object.values(targetScores).reduce((sum, score) => sum + score, 0) / 4;

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

          {/* Target Goals Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Điểm mục tiêu IELTS</h3>
              </div>
              <button
                onClick={() => {
                  if (isEditingTargets) {
                    handleSaveTargets();
                  } else {
                    setIsEditingTargets(true);
                  }
                }}
                disabled={isLoadingTargets}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-60"
              >
                {isEditingTargets ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu mục tiêu
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(targetScores).map(([skill, score]) => {
                const skillNames: Record<string, string> = {
                  listening: 'Listening',
                  reading: 'Reading', 
                  writing: 'Writing',
                  speaking: 'Speaking'
                };

                return (
                  <div key={skill} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {skillNames[skill]}
                    </label>
                    {isEditingTargets ? (
                      <select
                        value={score}
                        onChange={(e) => handleTargetScoreChange(skill, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {bandScoreOptions.map(band => (
                          <option key={band} value={band}>{band}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center justify-center h-10 bg-gray-50 rounded-lg border">
                        <span className="text-lg font-semibold text-blue-600">{score}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Average Target Score */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Điểm trung bình mục tiêu</p>
                <p className="text-2xl font-bold text-blue-600">{targetAverage.toFixed(1)}</p>
              </div>
            </div>
          </div>

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