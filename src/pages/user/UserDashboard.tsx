import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Target, TrendingUp, Clock, Award, Users } from 'lucide-react';
import { userService, type UserProgressItem } from '../../services/user/userService';
import type { WritingSubmission } from '../../services/dashboard';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgressItem[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<WritingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // Fetch user progress from userService (real DB)
        const progress = await userService.getUserProgress(user.id);
        setUserProgress(progress);

        // Fetch user's writing submissions
        const submissions = await userService.getUserSubmissions(user.id, 5);
        setUserSubmissions(submissions);
      } catch (error) {
        setUserProgress([]);
        setUserSubmissions([]);
  setErrorMsg('Không thể tải dữ liệu dashboard. Vui lòng thử lại hoặc kiểm tra kết nối.');
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  // Calculate stats from real data
  const totalExercises = userProgress.reduce((sum, skill) => sum + (skill.completed_exercises || 0), 0);
  const targetScore = userProgress.length > 0 ? 
    userProgress.reduce((sum, skill) => sum + (skill.target_score || 0), 0) / userProgress.length : 7.5;
  const currentScore = userProgress.length > 0 ? 
    userProgress.reduce((sum, skill) => sum + (skill.current_level || 0), 0) / userProgress.length : 0;
  const studyHours = Math.floor(totalExercises * 0.5); // Estimate: 30min per exercise

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="container mx-auto px-4 py-10">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Xin chào, {user?.fullName || user?.email}! <span className="animate-wave inline-block">👋</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Chào mừng bạn đến với dashboard học IELTS cá nhân
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="text-xl font-bold text-blue-600 capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {errorMsg ? (
          <div className="text-center py-10">
            <p className="text-red-600 text-lg font-bold mb-4">{errorMsg}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-8 flex items-center gap-6 border border-blue-100">
              <div className="p-4 bg-blue-200 rounded-full shadow-lg">
                <BookOpen className="w-8 h-8 text-blue-700" />
              </div>
              <div>
                <p className="text-base text-gray-500 font-semibold">Bài học hoàn thành</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {isLoading ? '...' : totalExercises}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-8 flex items-center gap-6 border border-green-100">
              <div className="p-4 bg-green-200 rounded-full shadow-lg">
                <Target className="w-8 h-8 text-green-700" />
              </div>
              <div>
                <p className="text-base text-gray-500 font-semibold">Điểm mục tiêu</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {isLoading ? '...' : targetScore.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-8 flex items-center gap-6 border border-purple-100">
              <div className="p-4 bg-purple-200 rounded-full shadow-lg">
                <TrendingUp className="w-8 h-8 text-purple-700" />
              </div>
              <div>
                <p className="text-base text-gray-500 font-semibold">Điểm hiện tại</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {isLoading ? '...' : currentScore > 0 ? currentScore.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-xl p-8 flex items-center gap-6 border border-orange-100">
              <div className="p-4 bg-orange-200 rounded-full shadow-lg">
                <Clock className="w-8 h-8 text-orange-700" />
              </div>
              <div>
                <p className="text-base text-gray-500 font-semibold">Thời gian học</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {isLoading ? '...' : `${studyHours}h`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Skills Progress */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Tiến độ 4 kỹ năng</h2>
            <div className="space-y-8">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4 text-lg">Đang tải dữ liệu...</p>
                </div>
              ) : errorMsg ? (
                <div className="text-center py-10">
                  <p className="text-red-600 text-lg font-bold mb-4">{errorMsg}</p>
                </div>
              ) : userProgress.length > 0 ? (
                userProgress.map((skill) => (
                  <div key={skill.id} className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-700 capitalize text-lg">{skill.skill_type}</span>
                      <span className="text-base text-gray-500">
                        {skill.current_level.toFixed(1)} / {skill.target_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`bg-blue-500 h-4 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min((skill.current_level / skill.target_score) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>{skill.completed_exercises} bài đã hoàn thành</span>
                      <span>{((skill.current_level / skill.target_score) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Chưa có dữ liệu tiến độ</p>
                  <p className="text-base text-gray-400 mt-2">Bắt đầu học để theo dõi tiến độ của bạn</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 mb-8">Hành động nhanh</h2>
            <div className="space-y-6">
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold">
                <BookOpen className="w-6 h-6 mr-3" />
                Bài học mới
              </button>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold">
                <Award className="w-6 h-6 mr-3" />
                Luyện Writing AI
              </button>
              <button className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold">
                <Target className="w-6 h-6 mr-3" />
                Làm bài test
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center text-lg font-bold">
                <Users className="w-6 h-6 mr-3" />
                Tham gia nhóm học
              </button>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 border border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Bài viết gần đây</h2>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 text-lg">Đang tải bài viết...</p>
            </div>
          ) : errorMsg ? (
            <div className="text-center py-10">
              <p className="text-red-600 text-lg font-bold mb-4">{errorMsg}</p>
            </div>
          ) : userSubmissions.length > 0 ? (
            <div className="space-y-6">
              {userSubmissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 capitalize text-lg">
                      {submission.taskType.replace('_', ' ')} Task
                    </h3>
                    <div className="flex items-center space-x-2">
                      {submission.aiScore && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-base font-bold">
                          {submission.aiScore}/9.0
                        </span>
                      )}
                      <span className="text-base text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-base mb-2 line-clamp-2">
                    {submission.prompt}
                  </p>
                  {submission.aiFeedback && (
                    <p className="text-green-600 text-base italic">
                      "{submission.aiFeedback.slice(0, 100)}..."
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
              <p className="text-base text-gray-400 mt-2">Bắt đầu luyện Writing AI để xem kết quả ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;