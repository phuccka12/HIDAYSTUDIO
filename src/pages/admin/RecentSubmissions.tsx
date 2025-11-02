import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard';
import type { WritingSubmission } from '../../services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AdminSubmissionView: React.FC<{ submission: WritingSubmission | null; onClose: () => void }> = ({ submission, onClose }) => {
  if (!submission) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[min(900px,90%)] max-h-[90vh] overflow-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Bài nộp của {submission.userEmail || submission.userId}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Đóng</button>
        </div>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{submission.prompt}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nội dung học viên</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{submission.content}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI feedback & score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">Điểm AI: <span className="font-semibold">{((submission as any).ai_score ?? (submission as any).aiScore) != null ? ((submission as any).ai_score ?? (submission as any).aiScore) : 'Chưa có'}</span></div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{Array.isArray((submission as any).ai_feedback) ? (submission as any).ai_feedback.join('\n\n') : Array.isArray(submission.aiFeedback) ? submission.aiFeedback.join('\n\n') : String((submission as any).ai_feedback ?? submission.aiFeedback ?? '')}</div>
              {/* Corrected answer (if any) */}
              {((submission as any).ai_corrected || (submission as any).aiCorrected) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Bản sửa (AI)</h4>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-3 rounded mt-1">{(submission as any).aiCorrected || (submission as any).ai_corrected}</pre>
                </div>
              )}

              {/* AI suggested corrections summary */}
              {((submission as any).ai_corrections || (submission as any).aiCorrections) && (
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Gợi ý sửa:</strong>
                  <div className="mt-1 whitespace-pre-wrap">{(submission as any).aiCorrections || (submission as any).ai_corrections}</div>
                </div>
              )}

              {/* Confidence (if provided) */}
              {((submission as any).ai_confidence || (submission as any).aiConfidence) && (
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Độ tin cậy (confidence):</strong>
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 mt-1">{JSON.stringify((submission as any).aiConfidence || (submission as any).ai_confidence, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const RecentSubmissions: React.FC = () => {
  const [items, setItems] = useState<WritingSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WritingSubmission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [total, setTotal] = useState<number>(0);

  const load = async (p: number = page) => {
    setLoading(true);
    try {
      const res = await dashboardService.getRecentSubmissions(p, limit);
      setItems(res.items || []);
      setTotal(typeof res.total === 'number' ? res.total : 0);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page, limit]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bài writing gần đây</h1>
        <div className="text-sm text-gray-600">Tổng: <span className="font-medium">{total}</span></div>
      </div>

  <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div>Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">Chưa có bài nộp nào.</div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="rounded-xl border p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">{new Date(((s as any).created_at ?? s.createdAt) as string).toLocaleString('vi-VN')}</div>
                  <div className="text-base font-medium">{(((s as any).task_type ?? s.taskType) || '').toString().toUpperCase()} — {s.userFullName || s.userEmail || s.userId}</div>
                  <div className="text-sm text-gray-700 mt-2 line-clamp-3">{(s.content || '').slice(0, 300)}{(s.content || '').length > 300 ? '...' : ''}</div>
                </div>

                <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
                  <div className="text-sm text-green-700 font-semibold">{((s as any).ai_score ?? s.aiScore) ?? '—'}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(s)} className="rounded-lg bg-blue-600 px-3 py-1 text-white">Xem</button>
                    <button
                      disabled={processingId === s.id}
                      onClick={async () => {
                        if (!confirm('Re-run AI grading for this submission?')) return;
                        setProcessingId(s.id);
                        try {
                          await dashboardService.regradeSubmission(s.id);
                          // reload list (or we could update item in-place)
                          await load();
                          alert('Regrade completed');
                        } catch (err: any) {
                          console.error(err);
                          alert(err?.message || 'Regrade failed');
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-white disabled:opacity-60"
                    >{processingId === s.id ? 'Đang...' : 'Re-grade'}</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminSubmissionView submission={selected} onClose={() => setSelected(null)} />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Hiển thị: {Math.min(total, limit)} / {total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Prev</button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(7, Math.max(1, Math.ceil(total / limit))) }).map((_, i) => {
              // show a sliding window around current page
              const totalPages = Math.max(1, Math.ceil(total / limit));
              let start = Math.max(1, page - 3);
              let end = Math.min(totalPages, start + 6);
              if (end - start < 6) start = Math.max(1, end - 6);
              const pageNum = start + i;
              if (pageNum > end) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded ${pageNum === page ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >{pageNum}</button>
              );
            })}
          </div>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default RecentSubmissions;
