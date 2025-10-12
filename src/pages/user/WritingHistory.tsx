import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user/userService';
import { FileText, Sparkle } from 'lucide-react';

const WritingHistory: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await userService.getUserSubmissions(user.id, 20);
        setSubmissions(data);
      } catch (error) {
        setSubmissions([]);
  setErrorMsg('Không thể tải lịch sử bài viết. Vui lòng thử lại hoặc kiểm tra kết nối.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, [user?.id]);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full shadow-lg">
          <Sparkle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">Lịch sử bài viết AI</h1>
      </div>
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Đang tải bài viết...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-center py-10">
          <p className="text-red-600 text-lg font-bold mb-4">{errorMsg}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
          <p className="text-base text-gray-400 mt-2">Hãy nộp bài để xem lịch sử ở đây</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {submissions.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-800">{item.task_type || 'Task'}</span>
                <span className="text-xs text-gray-500 ml-auto">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="text-base text-gray-700 mb-1 line-clamp-2">{item.prompt}</div>
              <div className="flex items-center gap-2">
                {item.ai_score && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-base font-bold">
                    {item.ai_score}/9.0
                  </span>
                )}
                {item.ai_feedback && (
                  <span className="text-green-600 text-sm italic">"{item.ai_feedback.slice(0, 60)}..."</span>
                )}
              </div>
              <button className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:scale-105 transition-all">Xem chi tiết</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WritingHistory;
