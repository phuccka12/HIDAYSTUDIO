import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import content from "../../services/content";
import { useToast } from "../../components/ui/Toast";

// Skeleton card while loading
function LessonSkeleton() {
  return (
    <div className="rounded-2xl border bg-white/50 p-4 shadow-sm animate-pulse">
      <div className="h-36 w-full rounded-xl bg-slate-200" />
      <div className="mt-4 h-5 w-3/5 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-32 rounded-lg bg-slate-200" />
    </div>
  );
}

// Badge primitive – avoids adding extra deps
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

// Utility: safe accessors
const pick = (obj: any, key: string, fallback = "") => (obj && obj[key] != null ? obj[key] : fallback);

const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "level">("recent");
  const [level, setLevel] = useState<string>("all");
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    content
      .listLessons()
      .then((res: any) => {
        if (res?.error) {
          toast.push({ type: "error", message: res.error.message || "Không tải được danh sách bài học" });
          return;
        }
        const payload = res?.data || res;
        const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        if (mounted) setLessons(items);
      })
      .catch((err: any) => {
        toast.push({ type: "error", message: String(err?.message || "Lỗi tải dữ liệu") });
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Derive filters
  const allLevels = useMemo(() => {
    const lvls = new Set<string>();
    lessons.forEach((l) => {
      const v = String(pick(l, "level", "")).trim();
      if (v) lvls.add(v);
    });
    return Array.from(lvls);
  }, [lessons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = lessons.filter((l) => {
      const title = String(pick(l, "title", "")).toLowerCase();
      const desc = String(pick(l, "description", "")).toLowerCase();
      const lvl = String(pick(l, "level", "")).toLowerCase();
      const okQ = !q || title.includes(q) || desc.includes(q);
      const okLvl = level === "all" || lvl === level.toLowerCase();
      return okQ && okLvl;
    });

    if (sortBy === "title") {
      data = [...data].sort((a, b) => String(pick(a, "title")).localeCompare(String(pick(b, "title"))));
    } else if (sortBy === "level") {
      data = [...data].sort((a, b) => String(pick(a, "level")).localeCompare(String(pick(b, "level"))));
    } else {
      // recent by created_at/updated_at fallback
      const stamp = (o: any) => new Date(pick(o, "updated_at", pick(o, "created_at", 0))).getTime();
      data = [...data].sort((a, b) => stamp(b) - stamp(a));
    }
    return data;
  }, [lessons, level, query, sortBy]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Bài học</h1>
        <p className="mt-2 text-slate-600">Đang tải nội dung, vui lòng đợi một chút…</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LessonSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bài học</h1>
          <p className="mt-1 text-sm text-slate-600">{filtered.length} mục phù hợp • Tổng {lessons.length}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, mô tả…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-80"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">Tất cả cấp độ</option>
            {allLevels.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="recent">Mới cập nhật</option>
            <option value="title">Tiêu đề (A→Z)</option>
            <option value="level">Cấp độ</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => {
            const id = pick(lesson, "_id", pick(lesson, "id"));
            const title = pick(lesson, "title", "(Chưa có tiêu đề)");
            const description = pick(lesson, "description", "Không có mô tả");
            const lvl = pick(lesson, "level", "");
            const duration = pick(lesson, "duration", "");

            // simple color seed
            const seed = (title as string).charCodeAt(0) || 0;
            const hue = 30 + (seed % 200);

            return (
              <div
                key={id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* thumbnail */}
                <div
                  className="h-36 w-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue} 90% 90%), hsl(${(hue + 50) % 360} 90% 85%))`,
                  }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-1 text-lg font-semibold text-slate-900">{title}</h2>
                    {lvl && <Badge>{lvl}</Badge>}
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">⏱️ {duration || "—"}</span>
                    <span className="inline-flex items-center gap-1">📚 Bài học</span>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/lessons/${id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      Xem bài học
                      <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-24 flex flex-col items-center justify-center text-center">
          <div className="mb-4 h-16 w-16 rounded-2xl bg-indigo-50 p-4 text-3xl">📄</div>
          <h3 className="text-lg font-semibold">Chưa có bài học nào</h3>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            Danh sách hiện trống. Hãy thử xoá bộ lọc, tìm kiếm từ khoá khác, hoặc quay lại sau.
          </p>
          <button
            onClick={() => { setQuery(""); setLevel("all"); setSortBy("recent"); }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default Lessons;
