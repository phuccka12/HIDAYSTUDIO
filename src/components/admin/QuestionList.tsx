import { useState } from 'react';
import QuestionForm from './QuestionForm';

type Props = {
  examId: string;
  sectionId: string;
  questions: any[];
  onChange: (questions: any[]) => void;
};

export default function QuestionList({ examId, sectionId, questions, onChange }: Props) {
  const [editQ, setEditQ] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  function handleAdd() {
    setEditQ(null);
    setOpen(true);
  }

  function handleSave(payload: any) {
    if (payload.id) {
      // update existing (giữ nguyên logic)
      const found = questions.find((q) => q.id === payload.id);
      if (found) {
        const arr = questions.map((q) => (q.id === payload.id ? { ...q, ...payload } : q));
        onChange(arr);
        // persist
        fetch(`/admin/exams/${examId}/sections/${sectionId}/questions/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        return;
      }
    }
    // create new (giữ nguyên logic)
    fetch(`/admin/exams/${examId}/sections/${sectionId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.question) {
          onChange([...questions, data.question]);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }

  const typeBadge = (t: string) => {
    const base =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';
    if (t === 'mcq') return `${base} bg-indigo-50 text-indigo-700 ring-indigo-200`;
    if (t === 'multi') return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    if (t === 'essay') return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    return `${base} bg-gray-50 text-gray-700 ring-gray-200`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-semibold tracking-tight">Danh sách câu hỏi</h4>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">
            {questions.length}
          </span>
        </div>
        <button
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
          onClick={handleAdd}
        >
          <svg
            viewBox="0 0 24 24"
            className="mr-1.5 size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15M19.5 12h-15" />
          </svg>
          Thêm câu hỏi
        </button>
      </div>

      {/* List */}
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-gray-100">
            <svg viewBox="0 0 24 24" className="size-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15M19.5 12h-15" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">Chưa có câu hỏi nào cho phần này.</p>
          <button
            className="mt-3 inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={handleAdd}
          >
            Thêm câu hỏi đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={typeBadge(q.type)}>{q.type}</span>
                  <span className="rounded-lg bg-gray-50 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">
                    Điểm: {q.points ?? 0}
                  </span>
                </div>
                <div className="truncate text-sm font-medium text-gray-900">
                  {q.prompt ? String(q.prompt).slice(0, 160) : '—'}
                </div>
                {Array.isArray(q.choices) && q.choices.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {q.choices.slice(0, 4).map((c: any, i: number) => (
                      <span
                        key={c.id || i}
                        className="truncate rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                        title={c.text}
                      >
                        {c.text || '□'}
                      </span>
                    ))}
                    {q.choices.length > 4 && (
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                        +{q.choices.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setEditQ(q);
                    setOpen(true);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-1 size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z"
                    />
                  </svg>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      <QuestionForm
        open={open}
        onClose={() => setOpen(false)}
        initial={editQ || undefined}
        onSave={handleSave}
      />
    </div>
  );
}
