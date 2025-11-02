import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import writingService from '../../services/user/writingService';
import { FileText, Sparkle } from 'lucide-react';

const WritingHistory: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await writingService.getUserSubmissions(user.id, 50);
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (error) {
        setSubmissions([]);
        setErrorMsg('Không thể tải lịch sử bài viết. Vui lòng thử lại.');
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
          {submissions.map((item) => {
            const id = item._id ?? item.id;
            const created = item.created_at ?? item.createdAt;
            const firstFeedback = Array.isArray(item.ai_feedback) ? (item.ai_feedback[0] ?? '') : (item.ai_feedback ?? '');
            return (
              <div key={id} className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-800">{item.task_type || 'Task'}</span>
                  <span className="text-xs text-gray-500 ml-auto">{created ? new Date(created).toLocaleDateString('vi-VN') : ''}</span>
                </div>
                <div className="text-base text-gray-700 mb-1 line-clamp-2">{item.prompt ?? ''}</div>
                <div className="flex items-center gap-2">
                  {item.ai_score != null && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-base font-bold">
                      {item.ai_score}/9.0
                    </span>
                  )}
                  {firstFeedback && (
                    <span className="text-green-600 text-sm italic">"{String(firstFeedback).slice(0, 60)}{String(firstFeedback).length > 60 ? '...' : ''}"</span>
                  )}
                </div>
                <button onClick={() => setSelected(item)} className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:scale-105 transition-all">Xem chi tiết</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal for selected submission */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[min(900px,90%)] max-h-[90vh] overflow-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Bài viết - {selected.task_type || selected.taskType}</h3>
              <button onClick={() => setSelected(null)} className="text-sm text-gray-500">Đóng</button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-red-900 ">Prompt</h4>
                <pre className="whitespace-pre-wrap font-semibold text-xl text-red-900 bg-gray-50 p-3 rounded mt-1">{selected.prompt}</pre>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900">Nội dung bạn nộp</h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-3 rounded mt-1">{selected.content}</pre>
              </div>

              <div>
                <h4 className="font-medium">Kết quả AI</h4>
                <div className="mt-2">
                  <div className="text-sm text-gray-700">Điểm AI: <span className="font-semibold">{selected.ai_score ?? selected.aiScore ?? 'Chưa có'}</span></div>
                  <div className="mt-2 text-sm text-gray-700">{Array.isArray(selected.ai_feedback) ? selected.ai_feedback.join('\n\n') : String(selected.ai_feedback || selected.aiFeedback || '')}</div>
                </div>
              </div>

              {((selected as any).ai_corrected || (selected as any).aiCorrected) && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">AI sửa</span>
                    <h4 className="font-medium">Bản sửa của AI</h4>
                  </div>

                  <div className="rounded-lg border border-green-100 bg-gradient-to-br from-green-50/60 to-white p-4 shadow-sm">
                    <div className="text-sm text-gray-700 mb-2">Phiên bản được AI hiệu đính — xem để tham khảo hoặc áp dụng vào bài của bạn.</div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-white/80 p-4 rounded-md border border-green-50 shadow-sm overflow-auto" style={{lineHeight: 1.6}}>{(selected as any).ai_corrected || (selected as any).aiCorrected}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingHistory;