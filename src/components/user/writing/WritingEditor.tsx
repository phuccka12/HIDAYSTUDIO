import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import writingService from '../../../services/user/writingService';

const WritingEditor: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<any | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user?.id) {
      setErrorMsg('Bạn chưa đăng nhập');
      return;
    }
    if (!prompt || !prompt.trim()) {
      setErrorMsg('Vui lòng nhập đề bài.');
      return;
    }
    if (!content || content.trim().length < 20) {
      setErrorMsg('Bài viết quá ngắn (ít nhất 20 ký tự).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        task_type: 'IELTS_Task2',
        prompt,
        content
      };
      const created = await writingService.createSubmission(payload);
      setCurrentSubmission(created);
      setIsSubmitting(false);
      if (created.graded_at) {
        setSuccessMsg('Bài đã được chấm xong.');
      } else {
        setErrorMsg('Chấm bài thất bại. Kiểm tra lại.');
      }
    } catch (err: any) {
      setErrorMsg(String(err?.message ?? err));
      setIsSubmitting(false);
    }
  };

  const handleRandom = async () => {
  setErrorMsg(null);
  setInfoMsg('Đang lấy đề ngẫu nhiên...');
  try {
    const data = await writingService.getRandomPrompt();
    setPrompt(data?.prompt ?? '');
    setInfoMsg(null);
  } catch (err: any) {
    console.error('getRandomPrompt error', err);
    setInfoMsg(null);
    setErrorMsg('Không lấy được đề ngẫu nhiên. Kiểm tra kết nối tới backend.');
  }
};

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-semibold mb-4 text-center">Nộp bài Writing</h3>

      <div className="flex gap-3 mb-4 justify-center">
        <button
          type="button"
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          onClick={handleRandom}
        >
          Tạo đề ngẫu nhiên
        </button>
        <button
          type="button"
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => { setPrompt(''); setContent(''); setErrorMsg(null); setSuccessMsg(null); }}
        >
          Xóa nội dung
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Đề bài</label>
        <textarea
          className="w-full border rounded-lgd-lg px-3 py-2 font- text-red-500"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập đề bài bạn muốn viết về đây"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Bài làm của bạn</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 h-40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bài làm của bạn tại đây (ít nhất 20 ký tự)"
        />
      </div>

      {errorMsg && <div className="text-red-600 mb-2 text-center">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 mb-2 text-center">{successMsg}</div>}
      {infoMsg && <div className="text-blue-600 mb-2 text-center">{infoMsg}</div>}

      <div className="flex items-center gap-3 justify-center">
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-5 h-5 border-4 border-t-4 border-blue-600 border-solid rounded-full animate-spin mr-2"></div>
              Đang nộp & chấm...
            </div>
          ) : (
            'Nộp và chấm AI'
          )}
        </button>
        <button
          className="border px-6 py-3 rounded-lg hover:bg-gray-100 transition"
          onClick={() => { setPrompt(''); setContent(''); setErrorMsg(null); setSuccessMsg(null); }}
        >
          Hủy
        </button>
      </div>

      {currentSubmission && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold mb-2">Kết quả tạm thời</h4>
          <div className="mb-2">ID: {currentSubmission._id}</div>
          <div className="mb-2">Trạng thái: {currentSubmission.graded_at ? 'Đã chấm' : 'Đang chấm...'}</div>
          <div className="mb-2">Điểm AI: {currentSubmission.ai_score ?? '—'}</div>
          {currentSubmission.ai_criteria && (
            <div className="mb-3">
              <strong>Chi tiết tiêu chí:</strong>
              <ul>
                {Object.entries(currentSubmission.ai_criteria).map(([k, v]) => <li key={k}>{k}: {String(v)}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(currentSubmission.ai_feedback) && currentSubmission.ai_feedback.length > 0 && (
            <div>
              <strong>Nhận xét AI:</strong>
              <ul className="list-disc pl-6">
                {currentSubmission.ai_feedback.map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WritingEditor;
