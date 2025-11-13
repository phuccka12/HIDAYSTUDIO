import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Target, TrendingUp, Clock, Award, RefreshCw } from 'lucide-react';
import { userService, type UserProgressItem, type UserProfile } from '../../services/user/userService';
import type { WritingSubmission } from '../../services/dashboard';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgressItem[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<WritingSubmission[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchUserData = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) {
      setIsLoading(true);
      setErrorMsg(null);
    } else {
      setIsAutoRefreshing(true);
    }
    try {
      // Use consolidated dashboard endpoint when possible
      try {
        const dash = await userService.getDashboard();
        if (dash) {
          setProfile(dash.account || null);
          // Use skills progress from the dashboard
          setUserProgress(dash.progress?.skills || []);
          // gradingHistory maps to writing submissions
          const mappedSubmissions = (dash.gradingHistory || []).map((g: any) => ({
            id: g.id,
            userId: user.id || '',
            taskType: g.task_type || 'task1' as const,
            prompt: g.prompt,
            content: g.content || '',
            aiScore: g.ai_score,
            aiFeedback: g.ai_feedback,
            aiCorrected: g.ai_corrected,
            aiCorrections: g.ai_corrections,
            createdAt: g.created_at
          }));
          setUserSubmissions(mappedSubmissions as WritingSubmission[]);
        }
      } catch {
        // fallback to older granular calls
        try {
          const p = await userService.getUserProfile(user.id);
          setProfile(p);
        } catch { /* ignore */ }
        try {
          const progress = await userService.getUserProgress(user.id);
          setUserProgress(progress);
        } catch { /* ignore */ }
        try {
          const submissions = await userService.getUserSubmissions(user.id, 5);
          setUserSubmissions(submissions);
        } catch { /* ignore */ }
      }
    } catch (error) {
      setUserProgress([]);
      setUserSubmissions([]);
      if (!silent) {
        setErrorMsg('Không thể tải dữ liệu dashboard. Vui lòng thử lại hoặc kiểm tra kết nối.');
      }
      console.error('Error fetching user data:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      } else {
        setIsAutoRefreshing(false);
      }
    }
  }, [user?.id]);

  // Effect for initial load và setup auto-refresh
  useEffect(() => {
    fetchUserData();
    
    // Auto refresh every 30 seconds
    intervalRef.current = window.setInterval(() => {
      fetchUserData(true); // Silent refresh
    }, 30000);
    
    // Refresh when window gets focus
    const handleFocus = () => {
      fetchUserData(true); // Silent refresh
    };
    
    // Refresh when page becomes visible (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserData(true); // Silent refresh
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUserData]);

  const handleRefresh = async () => {
    await fetchUserData(); // Use the unified fetch function
  };

  // (No client-side sample data — use real data from backend)

  // Calculate stats from real data
  const totalExercises = userProgress.reduce((sum, skill) => sum + (skill.completed_exercises || 0), 0);
  const writingCount = userSubmissions.length;
  
  // Compute average scores with IELTS rounding (nearest 0.5)
  const targetScores = userProgress.map(s => s.target_score).filter((v) => typeof v === 'number');
  const rawTargetAvg = targetScores.length > 0 ? targetScores.reduce((sum, v) => sum + v, 0) / targetScores.length : 7.0;
  const targetScore = Math.round(rawTargetAvg * 2) / 2; // Round to nearest 0.5
  
  const currentLevels = userProgress.map(s => s.current_level).filter((v) => typeof v === 'number');
  const rawCurrentAvg = currentLevels.length > 0 ? 
    currentLevels.reduce((sum, level) => sum + level, 0) / currentLevels.length : 0;
  const currentScore = Math.round(rawCurrentAvg * 2) / 2; // Round to nearest 0.5
  
  // More realistic study hours calculation
  const studyHours = Math.floor(totalExercises * 0.75 + writingCount * 1.5); // 45min per exercise + 1.5h per writing

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="container mx-auto px-4 py-10">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Xin chào, {profile?.full_name || user?.fullName || user?.email}! <span className="animate-wave inline-block">👋</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Chào mừng bạn đến với dashboard học IELTS cá nhân
              </p>
              <p className="text-sm text-gray-500 mt-1">
                📊 Dữ liệu sẽ tự động cập nhật mỗi 30 giây
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="text-xl font-bold text-blue-600 capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleRefresh} disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
                {isAutoRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Đang cập nhật...
                  </div>
                )}
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
                  {isLoading ? '...' : isNaN(targetScore) ? '7.0' : (targetScore % 1 === 0 ? targetScore.toFixed(0) : targetScore.toFixed(1))}
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
                  {isLoading ? '...' : currentScore > 0 ? (currentScore % 1 === 0 ? currentScore.toFixed(0) : currentScore.toFixed(1)) : '0.0'}
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
                userProgress.map((skill) => {
                  const skillNames: Record<string, string> = {
                    'listening': 'Nghe hiểu (Listening)',
                    'reading': 'Đọc hiểu (Reading)', 
                    'writing': 'Viết (Writing)',
                    'speaking': 'Nói (Speaking)'
                  };
                  const skillName = skillNames[skill.skill_type] || skill.skill_type;
                  
                  return (
                    <div key={skill.id} className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg">{skillName}</span>
                        <span className="text-base text-gray-500">
                          {(skill.current_level != null ? skill.current_level.toFixed(1) : '—')} / {(skill.target_score != null ? (skill.target_score).toFixed(1) : '—')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`bg-blue-500 h-4 rounded-full transition-all duration-300`}
                          style={{ width: `${skill.target_score ? Math.min(((skill.current_level || 0) / skill.target_score) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>{skill.completed_exercises} bài đã hoàn thành</span>
                        <span>{skill.target_score ? `${Math.round(((skill.current_level || 0) / skill.target_score) * 100)}%` : '—'}</span>
                      </div>
                    </div>
                  );
                })
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
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold"
                onClick={() => navigate('/user/lessons')}
              >
                <BookOpen className="w-6 h-6 mr-3" />
                Bài học mới
              </button>
              <button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold"
                onClick={() => navigate('/user/writing')}
              >
                <Award className="w-6 h-6 mr-3" />
                Luyện Writing AI
              </button>
              <button
                className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white py-4 px-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center text-lg font-bold"
                onClick={() => navigate('/user/practice-tests')}
              >
                <Target className="w-6 h-6 mr-3" />
                Làm bài test
              </button>
              {/* Groups feature removed — button intentionally omitted */}
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
              {userSubmissions.map((submission) => {
                const taskTypeMap: Record<string, string> = {
                  'IELTS_Task1': 'IELTS Task 1',
                  'IELTS_Task2': 'IELTS Task 2', 
                  'IELTS_Task1_Academic': 'IELTS Task 1 Academic',
                  'IELTS_Task1_General': 'IELTS Task 1 General',
                  'task1': 'Task 1',
                  'task2': 'Task 2'
                };
                
                const rawTask = submission.taskType || 'writing';
                const taskLabel = taskTypeMap[rawTask] || rawTask.replace(/_/g, ' ');
                const score = submission.aiScore ?? null;
                const created = submission.createdAt;
                const createdDate = created ? new Date(created).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '';

                // Score color coding
                let scoreColor = 'bg-gray-100 text-gray-800';
                if (score !== null) {
                  if (score >= 7.5) scoreColor = 'bg-green-100 text-green-800';
                  else if (score >= 6.5) scoreColor = 'bg-blue-100 text-blue-800';
                  else if (score >= 5.5) scoreColor = 'bg-yellow-100 text-yellow-800';
                  else scoreColor = 'bg-red-100 text-red-800';
                }

                return (
                  <div key={submission.id || Math.random()} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">{taskLabel}</h3>
                      <div className="flex items-center space-x-3">
                        {score != null && (
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${scoreColor}`}>
                            Band {score}/9.0
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{createdDate}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2 leading-relaxed">
                      <span className="font-medium text-gray-600">Đề bài:</span> {submission.prompt}
                    </p>
                    {submission.aiFeedback && (
                      <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border-l-4 border-green-400 mt-3">
                        <div className="font-medium text-green-800 mb-1">💬 Nhận xét AI:</div>
                        <div className="text-green-700">
                          {Array.isArray(submission.aiFeedback) 
                            ? submission.aiFeedback.slice(0, 2).map((feedback, idx) => (
                                <div key={idx} className="mb-1">• {feedback}</div>
                              ))
                            : String(submission.aiFeedback).slice(0, 150) + (String(submission.aiFeedback).length > 150 ? '...' : '')
                          }
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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