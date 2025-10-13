import { useState } from 'react';
import ExamBasicInfo from './ExamBasicInfo';
import ExamSettings from './ExamSettings';
import ExamSectionsMedia from './ExamSectionsMedia';
import { adminCreateExam, adminUpdateExam } from '../../services/content';
import { useToast } from '../ui/Toast';

type Exam = any;

export default function ExamForm({
  initial = {},
  onSave,
  onCancel
}: {
  initial?: Partial<Exam>;
  onSave: (p: any) => void;
  onCancel: () => void;
}) {
  // ---------- state (giữ nguyên dữ liệu & cấu trúc) ----------
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [description, setDescription] = useState(initial.description || '');
  const [sectionsText, setSectionsText] = useState(() =>
    JSON.stringify(initial.sections || [], null, 2)
  );
  const [gallery, setGallery] = useState<Array<{ url: string; filename?: string }>>(
    (initial as any).gallery || []
  );
  // error state removed; use toast for user-visible errors
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [settings, setSettings] = useState<any>(() => ({
    timeLimitMinutes: (initial as any)?.settings?.timeLimitMinutes ?? 0,
    attemptsAllowed: (initial as any)?.settings?.attemptsAllowed ?? 0,
    randomizeQuestions: (initial as any)?.settings?.randomizeQuestions ?? false,
    randomizePerSection: (initial as any)?.settings?.randomizePerSection ?? false,
    // normalize showAnswersAfterSubmit to enum string: 'immediately' | 'after_grading' | 'never'
    showAnswersAfterSubmit: (() => {
      const raw = (initial as any)?.settings?.showAnswersAfterSubmit;
      if (typeof raw === 'string') {
        const s = raw.toLowerCase().trim();
        if (['immediately', 'after_grading', 'never'].includes(s)) return s;
        if (s === 'true') return 'immediately';
        if (s === 'false') return 'after_grading';
      }
      if (typeof raw === 'boolean') return raw ? 'immediately' : 'after_grading';
      return (initial as any)?.settings?.showAnswersAfterSubmit ?? 'after_grading';
    })(),
    passThresholdPercent: (initial as any)?.settings?.passThresholdPercent ?? 60,
    negativeMarking:
      (initial as any)?.settings?.negativeMarking ?? { enabled: false, penalty: 0 }
  }));

  // ---------- helpers ----------
  const slugify = (s: string) =>
    String(s)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

  // ---------- save (giữ nguyên logic, thêm UI error) ----------
  const handleSave = async () => {
    let sections: any[] = [];
    try {
      sections = JSON.parse(sectionsText || '[]');
    } catch (e) {
      toast.push({ type: 'error', message: 'JSON không hợp lệ ở phần "Các phần (JSON)".' });
      return;
    }

    // validate giữ nguyên ý nghĩa
    if (settings.passThresholdPercent < 0 || settings.passThresholdPercent > 100) {
      toast.push({ type: 'error', message: 'Pass threshold must be between 0 and 100%.' });
      return;
    }
    if (settings.timeLimitMinutes < 0) {
      toast.push({ type: 'error', message: 'Time limit must be 0 or positive.' });
      return;
    }
    if (settings.attemptsAllowed < 0) {
      toast.push({ type: 'error', message: 'Attempts allowed must be 0 (unlimited) or a positive integer.' });
      return;
    }
    // quick frontend mapping to server-expected shapes
    const mappedSettings = { ...(settings || {}) };
    if (typeof mappedSettings.showAnswersAfterSubmit === 'boolean') {
      mappedSettings.showAnswersAfterSubmit = mappedSettings.showAnswersAfterSubmit ? 'immediately' : 'after_grading';
    }
    // support frontend negativeMarking.penalty -> server negativeMarking.perWrong
    if (mappedSettings.negativeMarking && typeof mappedSettings.negativeMarking === 'object') {
      const nm = { ...(mappedSettings.negativeMarking) };
      if (typeof nm.penalty !== 'undefined' && typeof nm.perWrong === 'undefined') nm.perWrong = Number(nm.penalty);
      mappedSettings.negativeMarking = nm;
    }

    const payload = { title, slug, description, sections, gallery, settings: mappedSettings };

    setSaving(true);
    try {
      let res: any;
      if (initial && (initial as any)._id) {
        res = await adminUpdateExam((initial as any)._id, payload);
      } else {
        res = await adminCreateExam(payload);
      }
      // apiFetch returns { data, error }
      if (res && res.error) {
        const msg = res.error.message || 'Lỗi khi lưu đề thi';
        // parse field errors if provided by API
        if (res.error.fields && typeof res.error.fields === 'object') {
          const fe: Record<string, string> = {};
          for (const k of Object.keys(res.error.fields)) {
            fe[k] = String((res.error.fields as any)[k]);
          }
          setFieldErrors(fe);
        }
        toast.push({ type: 'error', message: String(msg) });
        setSaving(false);
        return;
      }
  const data = res.data || res;
  // clear field errors on success
  setFieldErrors({});
  onSave(data?.exam || data || payload);
      toast.push({ type: 'success', message: initial && (initial as any)._id ? 'Cập nhật đề thi thành công' : 'Tạo đề thi thành công' });
    } catch (e) {
      console.error('save exam error', e);
      const msg = (e && (e as any).message) || 'Lỗi khi lưu đề thi';
      toast.push({ type: 'error', message: String(msg) });
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <ExamBasicInfo
        title={title}
        setTitle={setTitle}
        slug={slug}
        setSlug={setSlug}
        description={description}
        setDescription={setDescription}
        slugify={slugify}
      />

      <ExamSettings settings={settings} setSettings={setSettings} />
      {fieldErrors.settings && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fieldErrors.settings}
        </div>
      )}

      <ExamSectionsMedia
        sectionsText={sectionsText}
        setSectionsText={setSectionsText}
        gallery={gallery}
        setGallery={setGallery}
        initial={initial}
      />

      {/* `ExamSectionsMedia` component above already renders the sections + media UI. Removed duplicate block. */}

      {/* ================== Actions ================== */}
      <div className="flex items-center justify-end gap-2">
        <button
          className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          className={`inline-flex items-center rounded-lg px-4 py-2 font-medium text-white shadow ${saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <svg className="mr-2 h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="mr-2 size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  );
}
