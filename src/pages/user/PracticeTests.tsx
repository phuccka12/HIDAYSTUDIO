import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import content from "../../services/content";
import { useToast } from "../../components/ui/Toast";

// --------- Small primitives ---------
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm">
      <div className="h-36 w-full rounded-xl bg-slate-200" />
      <div className="mt-4 h-5 w-3/5 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-24 rounded-lg bg-slate-200" />
    </div>
  );
}

const pick = (obj: any, key: string, fallback: any = "") => (obj && obj[key] != null ? obj[key] : fallback);

export default function PracticeTests() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "time">("recent");
  const [typeFilter, setTypeFilter] = useState<string>("all"); // IELTS/TOEFL/Other
  const [levelFilter, setLevelFilter] = useState<string>("all"); // Beginner/...
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    content
      .listExams()
      .then((res: any) => {
        if (res?.error) {
          toast.push({ type: "error", message: res.error.message || "Không tải được danh sách thi thử" });
          return;
        }
        const payload = res?.data || res;
        const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        if (mounted) setExams(items);
      })
      .catch((err: any) => {
        toast.push({ type: "error", message: String(err?.message || "Lỗi tải dữ liệu") });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // Derived facets
  const allTypes = useMemo(() => {
    const s = new Set<string>();
    exams.forEach((e) => {
      const t = String(pick(e, "type", "")).trim();
      if (t) s.add(t);
    });
    return Array.from(s);
  }, [exams]);

  const allLevels = useMemo(() => {
    const s = new Set<string>();
    exams.forEach((e) => {
      const t = String(pick(e, "level", "")).trim();
      if (t) s.add(t);
    });
    return Array.from(s);
  }, [exams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = exams.filter((e) => {
      const title = String(pick(e, "title", "")).toLowerCase();
      const desc = String(pick(e, "description", "")).toLowerCase();
      const typ = String(pick(e, "type", "")).toLowerCase();
      const lvl = String(pick(e, "level", "")).toLowerCase();
      const okQ = !q || title.includes(q) || desc.includes(q);
      const okType = typeFilter === "all" || typ === typeFilter.toLowerCase();
      const okLevel = levelFilter === "all" || lvl === levelFilter.toLowerCase();
      return okQ && okType && okLevel;
    });

    if (sortBy === "title") {
      data = [...data].sort((a, b) => String(pick(a, "title")).localeCompare(String(pick(b, "title"))));
    } else if (sortBy === "time") {
      const minutes = (o: any) => Number(pick(o?.settings || {}, "timeLimitMinutes", 0));
      data = [...data].sort((a, b) => minutes(a) - minutes(b));
    } else {
      // recent by updated_at/created_at
      const stamp = (o: any) => new Date(pick(o, "updated_at", pick(o, "created_at", 0))).getTime();
      data = [...data].sort((a, b) => stamp(b) - stamp(a));
    }

    return data;
  }, [exams, query, sortBy, typeFilter, levelFilter]);

  // UI helpers
  const Card = ({ exam }: { exam: any }) => {
    const id = pick(exam, "_id", pick(exam, "id"));
    const title = pick(exam, "title", "(Không tiêu đề)");
    const description = pick(exam, "description", "Không có mô tả");
    const type = pick(exam, "type", "");
    const level = pick(exam, "level", "");
    const timeLimit = pick(exam?.settings || {}, "timeLimitMinutes", 0);
    const attempts = pick(exam?.settings || {}, "attemptLimit", null);
    const questions = pick(exam?.stats || {}, "questionCount", null);

    // tiny color seed for gradient
    const seed = String(title).charCodeAt(0) || 0;
    const hue = 20 + (seed % 200);

    return (
      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <div
          className="h-36 w-full"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 90% 90%), hsl(${(hue + 60) % 360} 90% 85%))` }}
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-1 text-lg font-semibold text-slate-900">{title}</h2>
            <div className="flex gap-2">
              {type && <Badge>{type}</Badge>}
              {level && <Badge>{level}</Badge>}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{description}</p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div className="inline-flex items-center gap-1">⏱️ {timeLimit || "—"} phút</div>
            <div className="inline-flex items-center gap-1">❓ {questions ?? "—"} câu</div>
            <div className="inline-flex items-center gap-1">🔁 {attempts ?? "∞"} lần</div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link
              to={`/exams/${id}`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Bắt đầu
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <span className="text-xs text-slate-500">{new Date(pick(exam, "updated_at", pick(exam, "created_at", Date.now()))).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // --------- Render ---------
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Thi thử</h1>
        <p className="mt-1 text-slate-600">Đang tải, vui lòng đợi một chút…</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header + Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thi thử</h1>
          <p className="mt-1 text-sm text-slate-600">{filtered.length} bài phù hợp • Tổng {exams.length}</p>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">Tất cả loại</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">Tất cả cấp độ</option>
            {allLevels.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="recent">Mới cập nhật</option>
            <option value="title">Tiêu đề (A→Z)</option>
            <option value="time">Thời gian (tăng dần)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exam) => (
            <Card key={pick(exam, "_id", pick(exam, "id"))} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="mt-24 flex flex-col items-center justify-center text-center">
          <div className="mb-4 h-16 w-16 rounded-2xl bg-indigo-50 p-4 text-3xl">🧪</div>
          <h3 className="text-lg font-semibold">Chưa có bài thi thử nào</h3>
          <p className="mt-1 max-w-md text-sm text-slate-600">Danh sách trống. Hãy thử xoá bộ lọc hoặc tìm từ khoá khác.</p>
          <button
            onClick={() => { setQuery(""); setTypeFilter("all"); setLevelFilter("all"); setSortBy("recent"); }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
