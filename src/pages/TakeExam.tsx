import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import content from '../services/content';
import { useToast } from '../components/ui/Toast';
import type { Attempt, Question } from '../types';

function QuestionRenderer({ q, value, onChange }: { q: Question | null, value: any, onChange: (v: any) => void }) {
  if (!q) return null;
  const type = (q.type as string) || 'mcq';
  if (type === 'mcq') {
    return (
      <div className="mt-3 space-y-2">
        {q.choices?.map((c: any) => (
          <label key={c.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-indigo-300 cursor-pointer">
            <input
              className="mt-1 h-4 w-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
              type="radio"
              name={q.id}
              value={c.id}
              checked={value == c.id}
              onChange={() => onChange(c.id)}
            />
            <span className="text-gray-800">{c.text}</span>
          </label>
        ))}
      </div>
    );
  }
  if (type === 'multi') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (choiceId: any) => {
      if (selected.includes(choiceId)) onChange(selected.filter((s: any) => s !== choiceId));
      else onChange([...selected, choiceId]);
    };
    return (
      <div className="mt-3 space-y-2">
        {q.choices?.map((c: any) => (
          <label key={c.id} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-indigo-300 cursor-pointer">
            <input
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggle(c.id)}
            />
            <span className="text-gray-800">{c.text}</span>
          </label>
        ))}
      </div>
    );
  }
  // fallback: text
  return (
    <div className="mt-3">
      <textarea
        className="w-full rounded-xl border border-gray-300 bg-white/70 p-3 leading-relaxed shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        rows={6}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập câu trả lời của bạn…"
      />
    </div>
  );
}

export default function TakeExam() {
  const { id: examId, attemptId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  // passage viewer state (must be declared with other hooks to preserve hook order)
  const [passageQuery, setPassageQuery] = useState('');
  const passageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!examId || !attemptId) return;
    // fetch attempt
    (async () => {
      const res: any = await content.getAttempt(attemptId).catch(() => null);
      if (!res) {
        toast.push({ type: 'error', message: 'Không tải được attempt' });
        return;
      }
      // apiFetch returns { data, error } shape; prefer data when present
      const data = res.data || res;
      setAttempt(data as Attempt);
      // init answers
      const map: Record<string, any> = {};
      (data.answers || []).forEach((a: any) => { map[a.questionId] = a.answer; });
      setAnswers(map);
      if (data.expiresAt) {
        const msLeft = new Date(data.expiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(msLeft / 1000)));
      }
    })();
  }, [examId, attemptId]);

  // countdown
  useEffect(() => {
    if (timeLeft == null) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t == null) return null;
        if (t <= 1) {
          window.clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000) as unknown as number;
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [timeLeft]);

  // autosave every 20s
  useEffect(() => {
    const iv = setInterval(() => {
      doSave();
    }, 20000);
    return () => clearInterval(iv);
  }, [answers]);

  const doSave = async () => {
    if (!examId || !attemptId) return;
    setSaving(true);
    try {
      const payload = Object.keys(answers).map((k) => ({ questionId: k, answer: answers[k] }));
      const res: any = await content.saveAttempt(examId, attemptId, payload);
      if (res && res.error) {
        toast.push({ type: 'error', message: res.error.message || 'Lưu tạm thất bại' });
      } else {
        // success -> set lastSaved
        setLastSaved(Date.now());
      }
    } catch (e) {
      toast.push({ type: 'error', message: 'Lỗi khi lưu tạm' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  const goNext = () => setCurrentIndex((i) => Math.min(order.length - 1, i + 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const jumpTo = (i: number) => setCurrentIndex(Math.max(0, Math.min(order.length - 1, i)));

  // keyboard navigation: single effect placed after goNext/goPrev definitions
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSubmit = async (confirmed = false) => {
    if (!examId || !attemptId) return;
    if (!confirmed) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    try {
      const payload = Object.keys(answers).map((k) => ({ questionId: k, answer: answers[k] }));
      const res: any = await content.submitAttempt(examId, attemptId, payload);
      if (res && res.error) {
        toast.push({ type: 'error', message: res.error.message || 'Nộp bài thất bại' });
        return;
      }
      const data = res.data || res;
      setSubmitResult(data);
      toast.push({ type: 'success', message: `Nộp bài xong. Điểm: ${data.score}/${data.total}` });
      // do not navigate away — show result overlay
    } catch (e) {
      toast.push({ type: 'error', message: 'Lỗi khi nộp bài' });
    }
  };

  if (!attempt) return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="mt-6 h-3 w-full rounded bg-gray-200" />
        <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
        <div className="mt-10 h-40 w-full rounded-xl bg-gray-100" />
      </div>
    </div>
  );

  const questionMap: Record<string, any> = {};
  // If attempt.order is present and has items use it, otherwise derive order from exam sections
  const order = (Array.isArray(attempt.order) && attempt.order.length > 0)
    ? attempt.order
    : (attempt.exam && attempt.exam.sections ? attempt.exam.sections.flatMap((s: any) => s.questions.map((q: any) => q.id)) : []);
  (attempt.exam?.sections || []).forEach((s: any) => {
    (s.questions || []).forEach((q: any) => {
      // normalize question text: some exams use `text`, others `prompt`
      questionMap[q.id] = Object.assign({}, q, { displayText: q.text || q.prompt || '' });
    });
  });

  // helper: find the section for the current question (useful to show passage/instructions)
  const currentQuestionId = order[currentIndex];
  const currentSection = (attempt.exam?.sections || []).find((s: any) => (s.questions || []).some((q: any) => q.id === currentQuestionId));
  const passageParagraphs: string[] = currentSection && (currentSection.passage || currentSection.instructions)
    ? String(currentSection.passage || currentSection.instructions).split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    : [];

  const goToParagraph = (idx: number) => {
    const el = passageRef.current?.querySelector(`[data-paragraph-index=\"${idx}\"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const totalQuestions = order.length;
  const answeredCount = Object.keys(answers || {}).filter((k) => answers[k] !== undefined && answers[k] !== null && !(Array.isArray(answers[k]) && answers[k].length === 0) && String(answers[k]) !== '').length;

  const mm = timeLeft != null ? Math.floor(timeLeft/60) : null;
  const ss = timeLeft != null ? String(timeLeft%60).padStart(2,'0') : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50/30">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">{attempt.exam?.title || 'Bài thi'}</h1>
            <p className="mt-0.5 text-xs text-gray-500">Dùng phím ← / → để chuyển câu</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 md:inline-block" title={new Date(lastSaved).toLocaleString()}>
                Đã lưu lúc {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <div className="flex items-center gap-2 rounded-full bg-indigo-600/10 px-3 py-1 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
              <span>Thời gian: {timeLeft != null ? `${mm}:${ss}` : '---'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        {/* progress */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-indigo-700">{answeredCount}</span> / {totalQuestions} đã trả lời
            </div>
            <div className="text-xs text-gray-500">{saving ? 'Đang lưu…' : lastSaved ? `Đã lưu • ${new Date(lastSaved).toLocaleTimeString()}` : 'Chưa lưu'}</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-[width] duration-500"
              style={{ width: `${totalQuestions ? (answeredCount/totalQuestions)*100 : 0}%` }}
            />
          </div>
        </div>

        {/* question navigator */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Danh sách câu hỏi</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-600"/> Hiện tại</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Đã trả lời</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300"/> Chưa trả lời</span>
            </div>
          </div>
          <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
            {order.map((qid: string, idx: number) => {
              const isAnswered = answers[qid] !== undefined && answers[qid] !== null && !(Array.isArray(answers[qid]) && answers[qid].length === 0) && String(answers[qid]) !== '';
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={qid}
                  onClick={() => jumpTo(idx)}
                  className={`relative aspect-square w-full rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : isAnswered
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={`Câu ${idx+1}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {idx+1}
                  {isCurrent && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Debug panel when no questions found */}
        {totalQuestions === 0 && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-semibold">Debug: không tìm thấy câu hỏi</div>
            <div className="mt-2">attempt.order: <code className="bg-white px-2 py-0.5 rounded">{JSON.stringify(attempt.order || [])}</code></div>
            <div className="mt-1">exam question ids: <code className="bg-white px-2 py-0.5 rounded">{JSON.stringify((attempt.exam?.sections || []).flatMap((s: any) => (s.questions || []).map((q: any) => q.id)))}</code></div>
            <div className="mt-2 text-xs text-gray-600">Nếu `exam question ids` rỗng thì backend không trả snapshot exam; kiểm tra response của GET /attempts/:id</div>
          </div>
        )}

        {/* current question */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {order[currentIndex] ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {/* show section title/instructions (passage) when present */}
                  {currentSection && (
                    <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                      {currentSection.title && <div className="text-sm font-semibold text-gray-700">{currentSection.title}</div>}
                      {/* Passage viewer */}
                      {(currentSection.passage || currentSection.instructions) && (
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="col-span-2">
                            <div className="mb-2 flex items-center gap-2">
                              <input value={passageQuery} onChange={(e) => setPassageQuery(e.target.value)} placeholder="Tìm trong đoạn văn…" className="w-full rounded border px-3 py-1 text-sm" />
                            </div>
                            <div ref={passageRef} className="max-h-40 overflow-auto rounded bg-white p-3 text-sm leading-relaxed text-gray-800">
                              {passageParagraphs.map((p, i) => {
                                const q = passageQuery.trim();
                                const safe = q ? p.replace(new RegExp(q, 'gi'), (m) => `<<<HIGHLIGHT>>>${m}<<<END>>>`) : p;
                                const parts = safe.split(/<<<HIGHLIGHT>>>|<<<END>>>/);
                                return (
                                  <p key={i} data-paragraph-index={i} className="mb-3">
                                    {parts.map((part, idx) => part.toLowerCase() === q.toLowerCase() ? <mark key={idx} className="bg-yellow-200">{part}</mark> : <span key={idx}>{part}</span>)}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="text-xs text-gray-600">Đoạn</div>
                            <div className="mt-2 space-y-2">
                              {passageParagraphs.map((_, i) => (
                                <button key={i} onClick={() => goToParagraph(i)} className="block w-full rounded bg-white px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-50">Đoạn {i+1}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-sm font-semibold text-indigo-700">Câu {currentIndex+1}</div>
                  <div className="mt-2 text-base leading-relaxed text-gray-900">{questionMap[currentQuestionId]?.displayText}</div>
                </div>
                <div className="hidden shrink-0 sm:flex sm:items-center sm:gap-2">
                  <button
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                  >Prev</button>
                  <button
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={goNext}
                    disabled={currentIndex >= totalQuestions - 1}
                  >Next</button>
                </div>
              </div>
              <div className="mt-3">
                <QuestionRenderer
                  q={questionMap[order[currentIndex]]}
                  value={answers[order[currentIndex]]}
                  onChange={(v: any) => handleChange(order[currentIndex], v)}
                />
              </div>
            </div>
          ) : <div className="text-gray-500">Không có câu hỏi.</div>}
        </div>

        {/* Bottom action bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 sm:hidden">
                <button className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={goPrev} disabled={currentIndex === 0}>Prev</button>
                <button className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={goNext} disabled={currentIndex >= totalQuestions - 1}>Next</button>
              </div>
              <div className="flex-1" />
              <button
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                onClick={() => handleSubmit()}
              >Nộp bài</button>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={doSave}
                disabled={saving}
              >{saving ? 'Đang lưu…' : 'Lưu tạm'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md scale-100 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận nộp bài</h3>
            <p className="mt-2 text-sm text-gray-700">Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể thay đổi.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setShowConfirm(false)}>Huỷ</button>
              <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => handleSubmit(true)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {submitResult && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Kết quả bài thi</h3>
            <p className="mt-2 text-gray-800">Điểm: <strong>{submitResult.score}</strong> / {submitResult.total} ({submitResult.percent}%)</p>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900">Chi tiết</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {(submitResult.details?.details || []).map((d: any, i: number) => (
                  <li key={i}><span className="font-medium">{d.questionId}</span>: {d.score}/{d.max}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 text-right">
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" onClick={() => { setSubmitResult(null); nav(`/exams/${examId}`); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
