import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Calendar, Clock, Trophy, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { userService } from '../../services/user/userService';

interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  examSections: string[];
  startedAt: string;
  submittedAt: string;
  status: 'in_progress' | 'submitted' | 'graded';
  score?: number;
  rawScore?: number;
  totalQuestions?: number;
  details?: any;
}

const TestHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestHistory();
  }, [user?.id]);

  const fetchTestHistory = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const dashboard = await userService.getDashboard();
      
      // Get test history from dashboard API
      if (dashboard?.testHistory) {
        setAttempts(dashboard.testHistory);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      console.error('Error fetching test history:', err);
      setError('Không thể tải lịch sử thi thử');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'submitted': 'bg-blue-100 text-blue-800 border-blue-300',
      'graded': 'bg-green-100 text-green-800 border-green-300'
    };
    
    const labels = {
      'in_progress': 'Đang làm',
      'submitted': 'Đã nộp',
      'graded': 'Đã chấm'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${badges[status as keyof typeof badges] || badges.submitted}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getScoreBadge = (attempt: ExamAttempt) => {
    if (attempt.score == null) return null;
    
    const score = attempt.score;
    const rawScore = attempt.rawScore;
    const totalQuestions = attempt.totalQuestions;
    
    // Score is out of 10
    let colorClass = 'bg-gray-100 text-gray-800';
    if (score >= 8) colorClass = 'bg-green-100 text-green-800';
    else if (score >= 6) colorClass = 'bg-blue-100 text-blue-800';
    else if (score >= 4) colorClass = 'bg-yellow-100 text-yellow-800';
    else colorClass = 'bg-red-100 text-red-800';
    
    return (
      <div className={`px-4 py-2 rounded-xl ${colorClass} font-bold text-lg`}>
        <Trophy className="w-5 h-5 inline mr-2" />
        {score.toFixed(1)} / 10
        {rawScore != null && totalQuestions != null && (
          <span className="text-sm font-normal ml-2">({rawScore}/{totalQuestions})</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                📊 Lịch sử thi thử
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Xem lại các bài thi bạn đã hoàn thành
              </p>
            </div>
            <button
              onClick={fetchTestHistory}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-200 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Tổng số bài thi</p>
                <p className="text-2xl font-extrabold text-gray-900">{attempts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-200 rounded-full">
                <Trophy className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Đã chấm điểm</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {attempts.filter(a => a.status === 'graded').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-6 border border-purple-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-200 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Điểm trung bình</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {attempts.length > 0 && attempts.some(a => a.score != null)
                    ? (attempts.filter(a => a.score != null).reduce((sum, a) => sum + a.score!, 0) / attempts.filter(a => a.score != null).length).toFixed(1)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-xl p-6 border border-orange-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-200 rounded-full">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Đang làm</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {attempts.filter(a => a.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test History List */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Chi tiết các bài thi</h2>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 text-lg font-bold mb-4">{error}</p>
              <button
                onClick={fetchTestHistory}
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Thử lại
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-xl font-semibold mb-2">Chưa có bài thi nào</p>
              <p className="text-gray-400 text-base mb-6">Bắt đầu làm bài thi thử để xem kết quả ở đây</p>
              <button
                onClick={() => navigate('/user/practice-tests')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-lg"
              >
                <BookOpen className="w-5 h-5" />
                Đến trang thi thử
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {attempt.examTitle || 'Bài thi IELTS'}
                      </h3>
                      {attempt.examSections && attempt.examSections.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {attempt.examSections.map((section, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                            >
                              {section === 'listening' && '🎧 Listening'}
                              {section === 'reading' && '📖 Reading'}
                              {section === 'writing' && '✍️ Writing'}
                              {section === 'speaking' && '🗣️ Speaking'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(attempt.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">
                        <strong>Bắt đầu:</strong> {formatDate(attempt.startedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5 text-green-500" />
                      <span className="text-sm">
                        <strong>Nộp bài:</strong> {formatDate(attempt.submittedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      {getScoreBadge(attempt)}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/exams/${attempt.examId}`)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Xem chi tiết
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestHistory;
