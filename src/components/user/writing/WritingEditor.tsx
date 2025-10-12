import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { writingService } from '../../../services/user/writingService';

const WritingEditor: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user?.id) return setErrorMsg('Bạn chưa đăng nhập');
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        user_id: user.id,
        task_type: 'Task 2',
        prompt,
        content
      };

      const result = await writingService.createSubmission(payload);
      setSuccessMsg('Gửi bài thành công');
      setPrompt('');
      setContent('');
      console.log('Submission created:', result);
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMsg('Không thể gửi bài. Kiểm tra quyền DB hoặc thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h3 className="text-lg font-semibold mb-3">Nộp bài Writing</h3>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Prompt (tùy chọn)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <textarea
        className="w-full border rounded px-3 py-2 mb-3 h-40"
        placeholder="Viết bài ở đây..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
      <div className="flex space-x-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : 'Nộp bài'}
        </button>
        <button
          className="border px-4 py-2 rounded"
          onClick={() => { setPrompt(''); setContent(''); setErrorMsg(null); setSuccessMsg(null); }}
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

export default WritingEditor;