import React, { useEffect, useMemo, useState } from "react";
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
  const attachments = Array.isArray(lesson?.attachments) ? lesson.attachments : [];

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
      </div>

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
          {attachments.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Tệp đính kèm</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {attachments.map((f: any, idx: number) => (
                  <li key={f?.id || idx} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-slate-700">{f?.name || f?.filename || `Tệp ${idx + 1}`}</p>
                      {f?.size && <p className="text-xs text-slate-500">{Math.round((Number(f.size) || 0) / 1024)} KB</p>}
                    </div>
                    {f?.url && (
                      <a
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tải xuống
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
