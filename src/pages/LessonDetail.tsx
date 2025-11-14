import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import content from "../services/content";

// -------- Small UI primitives --------
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="p-6">
      <div className="mb-3 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

// -------- Helpers --------
const pick = (o: any, k: string, f: any = "") => (o && o[k] != null ? o[k] : f);
const fmtDate = (v: any) => {
  const d = v ? new Date(v) : null;
  return d ? d.toLocaleDateString() : "";
};

// Very light estimate: ~200 wpm
const estimateReadingMinutes = (html: string) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
};

// Parse headings and inject ids to build a local ToC
function useProcessedHtml(rawHtml: string | null) {
  return useMemo(() => {
    if (!rawHtml) return { html: "", toc: [] as { id: string; text: string; level: number }[] };

    // NOTE: For production, sanitize HTML server-side (e.g., DOMPurify). This demo assumes trusted HTML.
    const parser = new DOMParser();

    // If the content appears to be plain text (no tags), convert double-newlines into <p> blocks
    // and single newlines into <br/> so the UI shows paragraph breaks.
    const looksLikeHtml = /<[^>]+>/.test(rawHtml);
    let doc: Document;
    if (!looksLikeHtml) {
      const paragraphs = rawHtml
        .split(/\r?\n\s*\r?\n/) // split on blank lines
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\r?\n/g, "<br/>")}</p>`)
        .join("\n");
      doc = parser.parseFromString(paragraphs, "text/html");
    } else {
      doc = parser.parseFromString(rawHtml, "text/html");
    }

    const headings = Array.from(doc.body.querySelectorAll("h2, h3"));
    const toc: { id: string; text: string; level: number }[] = [];

    headings.forEach((h, idx) => {
      if (!(h instanceof HTMLElement)) return;
      const text = h.textContent?.trim() || `Mục ${idx + 1}`;
      const slug = (text || "").toLowerCase().replace(/[^a-z0-9\u00C0-\u1EF9 ]/gi, "").replace(/\s+/g, "-").slice(0, 80);
      const id = slug || `sec-${idx}`;
      h.id = h.id || id;
      toc.push({ id: h.id, text, level: h.tagName === "H2" ? 2 : 3 });
    });

    return { html: doc.body.innerHTML, toc };
  }, [rawHtml]);
}

const LessonDetail: React.FC = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await content.getLesson(id || "");
        if (res?.error) {
          setError(res.error.message || "Không tải được bài học");
        } else {
          const payload = res?.data || res;
          if (mounted) setLesson(payload);
        }
      } catch (e: any) {
        setError(String(e?.message || "Lỗi khi tải bài học"));
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);

  const rawHtml = pick(lesson, "content", "<p>Không có nội dung</p>");
  const { html } = useProcessedHtml(rawHtml);
  const readingMin = useMemo(() => estimateReadingMinutes(rawHtml), [rawHtml]);

  if (loading) return <Skeleton />;

  if (error)
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">{error}</p>
          <Link to="/user/lessons" className="mt-3 inline-block text-indigo-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );

  if (!lesson)
    return (
      <div className="p-6">
        <p>Bài học không tìm thấy.</p>
        <Link to="/user/lessons" className="mt-3 inline-block text-indigo-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );

  const title = pick(lesson, "title", "(Không có tiêu đề)");
  const description = pick(lesson, "description", "");
  const level = pick(lesson, "level", "");
  const category = pick(lesson, "category", "");
  const updatedAt = pick(lesson, "updated_at", pick(lesson, "updatedAt", pick(lesson, "created_at", pick(lesson, "createdAt", ""))));
  const attachments = Array.isArray(lesson?.attachments) ? lesson.attachments : Array.isArray(lesson?.media) ? lesson.media : [];

  // Find first PDF for inline viewer
  const firstPdf = attachments.find((f: any) => 
    f?.url?.toLowerCase().endsWith('.pdf') || f?.type?.toLowerCase().includes('pdf')
  );

  // Debug log
  console.log('🔍 Lesson data:', { 
    media: lesson?.media, 
    attachments: lesson?.attachments, 
    finalAttachments: attachments,
    firstPdf
  });

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-slate-600">
        <Link to="/user/lessons" className="hover:underline">Bài học</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Chi tiết</span>
      </div>

      {/* Title + meta */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-slate-600">{description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {level && <Badge>{level}</Badge>}
          {category && <Badge>{category}</Badge>}
          <span className="inline-flex items-center gap-1">⏱️ {readingMin} phút đọc</span>
          {updatedAt && <span className="inline-flex items-center gap-1">🗓️ Cập nhật: {fmtDate(updatedAt)}</span>}
        </div>

        {/* Timer */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-900">⏱ Thời gian học:</span>
            <span className="text-2xl font-mono font-bold text-blue-700">
              {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-2">
            {!timerRunning ? (
              <button
                onClick={() => setTimerRunning(true)}
                className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700"
              >
                ▶️ Bắt đầu
              </button>
            ) : (
              <button
                onClick={() => setTimerRunning(false)}
                className="inline-flex items-center rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-yellow-700"
              >
                ⏸️ Tạm dừng
              </button>
            )}
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              🔄 Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Inline PDF Viewer - Always visible when PDF exists */}
      {firstPdf && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">📄 {firstPdf.filename || 'Tài liệu PDF'}</h3>
            <a
              href={firstPdf.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Mở tab mới
            </a>
          </div>
          <iframe
            src={firstPdf.url}
            className="w-full rounded-lg border border-slate-200"
            style={{ height: '800px' }}
            title="PDF Viewer"
          />
        </div>
      )}

      {/* Layout: content + aside */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Content */}
        <article className="prose prose-slate max-w-none md:col-span-2 prose-headings:scroll-mt-24">
          {/* WARNING: content should be sanitized server-side if user-generated */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        {/* Right column: attachments + quick actions (TOC removed) */}
        <aside className="space-y-6">
          {/* Attachments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Tệp đính kèm</h3>
            {attachments.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm">
                {attachments.map((f: any, idx: number) => {
                  const isPdf = f?.url?.toLowerCase().endsWith('.pdf') || f?.type?.toLowerCase().includes('pdf');
                  return (
                    <li key={f?.id || idx} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-slate-700">{f?.name || f?.filename || `Tệp ${idx + 1}`}</p>
                        {f?.size && <p className="text-xs text-slate-500">{Math.round((Number(f.size) || 0) / 1024)} KB</p>}
                      </div>
                      {f?.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          {isPdf ? 'Mở' : 'Tải xuống'}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Chưa có tệp đính kèm nào.</p>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Thao tác nhanh</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/user/practice"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Luyện tập
              </Link>
              <a
                href="#top"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Lên đầu trang
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link to="/user/lessons" className="text-indigo-600 hover:underline">← Quay lại danh sách</Link>
      </div>
    </div>
  );
};

export default LessonDetail;
