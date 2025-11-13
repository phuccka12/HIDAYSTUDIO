import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Camera, Save, Shield, Target } from 'lucide-react';
import { userService } from '../services/user/userService';

const ProfilePage: React.FC = () => {
  const { user } = useAuth(); // Remove updateProfile for now
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    // Implementation for profile update
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleSaveTargets = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Update target scores for each skill
      const updates = Object.entries(targetScores).map(async ([skillType, targetScore]) => {
        const response = await fetch(`http://localhost:4000/users/${user.id}/progress/${skillType}/target`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ target_score: targetScore })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update ${skillType} target score`);
        }
        
        return response.json();
      });

      await Promise.all(updates);
      setIsEditingTargets(false);
      
      // Show success message (you can add a toast notification here)
      console.log('Target scores updated successfully:', targetScores);
    } catch (error) {
      console.error('Failed to update target scores:', error);
    } finally {
      setIsLoading(false);
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
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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

          {/* Target Goals Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-600" />
                Mục tiêu học tập IELTS
              </h3>
              <button
                onClick={isEditingTargets ? handleSaveTargets : () => setIsEditingTargets(true)}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang lưu...' : (isEditingTargets ? 'Lưu mục tiêu' : 'Chỉnh sửa')}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Listening Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listening (Nghe)
                </label>
                <select
                  value={targetScores.listening}
                  onChange={(e) => setTargetScores({...targetScores, listening: parseFloat(e.target.value)})}
                  disabled={!isEditingTargets}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-bold ${
                    !isEditingTargets ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {bandScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Reading Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reading (Đọc)
                </label>
                <select
                  value={targetScores.reading}
                  onChange={(e) => setTargetScores({...targetScores, reading: parseFloat(e.target.value)})}
                  disabled={!isEditingTargets}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-bold ${
                    !isEditingTargets ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {bandScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Writing Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing (Viết)
                </label>
                <select
                  value={targetScores.writing}
                  onChange={(e) => setTargetScores({...targetScores, writing: parseFloat(e.target.value)})}
                  disabled={!isEditingTargets}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-bold ${
                    !isEditingTargets ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {bandScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>

              {/* Speaking Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speaking (Nói)
                </label>
                <select
                  value={targetScores.speaking}
                  onChange={(e) => setTargetScores({...targetScores, speaking: parseFloat(e.target.value)})}
                  disabled={!isEditingTargets}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center font-bold ${
                    !isEditingTargets ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {bandScoreOptions.map(score => (
                    <option key={score} value={score}>{score}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Mục tiêu tổng:</strong> Band {(() => {
                  const avg = (targetScores.listening + targetScores.reading + targetScores.writing + targetScores.speaking) / 4;
                  // Round to nearest 0.5 for IELTS band score format
                  const rounded = Math.round(avg * 2) / 2;
                  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
                })()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Điều chỉnh mục tiêu cho phù hợp với trình độ và thời gian luyện thi của bạn
              </p>
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
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Save className="w-5 h-5 mr-2" />
                Lưu tất cả thay đổi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;