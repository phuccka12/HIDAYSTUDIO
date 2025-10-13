import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import content from '../services/content';
import { useToast } from '../components/ui/Toast';

export default function ExamDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    content.getExam(id).then((res: any) => {
      // apiFetch sometimes returns { data, error } shape — prefer data when present
      if (!res) {
        toast.push({ type: 'error', message: 'Không tải được đề thi' });
        return;
      }
      if (res.error) {
        toast.push({ type: 'error', message: res.error.message || 'Không tải được đề thi' });
        return;
      }
      const data = res.data || res;
      setExam(data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    // backend start endpoint requires the exam ObjectId, not the slug.
    const examIdToStart = exam && exam._id ? exam._id : id;
    const res: any = await content.startExam(examIdToStart);
    if (res && res.error) {
      toast.push({ type: 'error', message: res.error.message || 'Không thể bắt đầu bài thi' });
      return;
    }
    const data = res.data || res;
    const attemptId = data.attemptId || (data && data.attempt_id);
    if (!attemptId) {
      toast.push({ type: 'error', message: 'Server không trả attemptId' });
      return;
    }
    nav(`/exams/${examIdToStart}/take/${attemptId}`);
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!exam) return <div className="p-6">Không tìm thấy đề thi.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{exam.title}</h1>
      <p className="mt-2 text-gray-600">{exam.description}</p>
      <div className="mt-4">
        <p>Thời gian: {exam.settings?.timeLimitMinutes || 0} phút</p>
        <p>Số lần được phép: {exam.settings?.attemptsAllowed === 0 ? 'Không giới hạn' : exam.settings?.attemptsAllowed}</p>
      </div>
      <div className="mt-6">
        <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={handleStart}>Bắt đầu</button>
      </div>
    </div>
  );
}
