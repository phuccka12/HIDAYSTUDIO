import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Target, TrendingUp, Clock, Award, Users } from 'lucide-react';
import { dashboardService } from '../../services/dashboard';
import type { UserProgress, WritingSubmission } from '../../services/dashboard';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<WritingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch user progress
        const progress = await dashboardService.getUserProgress(user.id);
        setUserProgress(progress);

        // Fetch user's writing submissions
        const submissions = await dashboardService.getUserSubmissions(user.id, 5);
        setUserSubmissions(submissions);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Calculate stats from real data
  const totalExercises = userProgress.reduce((sum, skill) => sum + skill.completedExercises, 0);
  const targetScore = userProgress.length > 0 ? 
    userProgress.reduce((sum, skill) => sum + skill.target, 0) / userProgress.length : 7.5;
  const currentScore = userProgress.length > 0 ? 
    userProgress.reduce((sum, skill) => sum + skill.current, 0) / userProgress.length : 0;
  const studyHours = Math.floor(totalExercises * 0.5); // Estimate: 30min per exercise

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Xin chào, {user?.fullName || user?.email}! 👋
              </h1>
              <p className="text-gray-600">
                Chào mừng bạn đến với dashboard học IELTS cá nhân
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="text-lg font-semibold text-blue-600 capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Bài học hoàn thành</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '...' : totalExercises}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Điểm mục tiêu</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '...' : targetScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Điểm hiện tại</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '...' : currentScore > 0 ? currentScore.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Thời gian học</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '...' : `${studyHours}h`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Progress */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tiến độ 4 kỹ năng</h2>
            
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Đang tải dữ liệu...</p>
                </div>
              ) : userProgress.length > 0 ? (
                userProgress.map((skill) => (
                  <div key={skill.skill}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700 capitalize">{skill.skill}</span>
                      <span className="text-sm text-gray-500">
                        {skill.current.toFixed(1)} / {skill.target.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-blue-500 h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min((skill.current / skill.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{skill.completedExercises} bài đã hoàn thành</span>
                      <span>{((skill.current / skill.target) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có dữ liệu tiến độ</p>
                  <p className="text-sm text-gray-400 mt-1">Bắt đầu học để theo dõi tiến độ của bạn</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Hành động nhanh</h2>
            
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Bài học mới
              </button>
              
              <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Luyện Writing AI
              </button>
              
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Làm bài test
              </button>
              
              <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Tham gia nhóm học
              </button>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Bài viết gần đây</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Đang tải bài viết...</p>
            </div>
          ) : userSubmissions.length > 0 ? (
            <div className="space-y-4">
              {userSubmissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800 capitalize">
                      {submission.taskType.replace('_', ' ')} Task
                    </h3>
                    <div className="flex items-center space-x-2">
                      {submission.aiScore && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {submission.aiScore}/9.0
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {submission.prompt}
                  </p>
                  {submission.aiFeedback && (
                    <p className="text-green-600 text-sm italic">
                      "{submission.aiFeedback.slice(0, 100)}..."
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có bài viết nào</p>
              <p className="text-sm text-gray-400 mt-1">Bắt đầu luyện Writing AI để xem kết quả ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;