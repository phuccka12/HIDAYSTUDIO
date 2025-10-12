import { useState } from 'react';
import MediaGallery from './MediaGallery';
import DanhSachCauHoi from './DanhSachCauHoi';
import { adminCreateExam, adminUpdateExam } from '../../services/content';

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
  const [title, setTitle] = useState(initial.title || '');
  const [slug, setSlug] = useState(initial.slug || '');
  const [description, setDescription] = useState(initial.description || '');
  const [sectionsText, setSectionsText] = useState(() => JSON.stringify(initial.sections || [], null, 2));
  const [gallery, setGallery] = useState<Array<{ url: string; filename?: string }>>(initial.gallery || []);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    let sections: any[] = [];
    try {
      sections = JSON.parse(sectionsText || '[]');
    } catch (e) {
      setError('JSON không hợp lệ ở phần "Các phần (JSON)".');
      return;
    }
    setError(null);
    const payload = { title, slug, description, sections, gallery };
    try {
      if (initial && (initial as any)._id) {
        const { data } = await adminUpdateExam((initial as any)._id, payload) as any;
        // expect server { ok: true, exam }
        onSave(data?.exam || data || payload);
      } else {
        const { data } = await adminCreateExam(payload) as any;
        onSave(data?.exam || data || payload);
      }
    } catch (e) {
      console.error('save exam error', e);
      onSave(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-800">Thông tin cơ bản</h4>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Tiêu đề</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: IELTS Practice Test 1"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug (tùy chọn)</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ielts-practice-test-1"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Nếu để trống, hệ thống có thể tự sinh từ tiêu đề.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả ngắn</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt ngắn cho đề thi…"
            />
          </div>
        </div>
      </div>

      {/* Sections JSON + Media uploader */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-800">Cấu trúc & Media</h4>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Các phần (JSON)</label>
            <textarea
              className="h-48 w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
              value={sectionsText}
              onChange={(e) => setSectionsText(e.target.value)}
              placeholder='[{"title":"Phần 1","questions":[]}]'
            />
            <p className="mt-2 text-xs text-gray-500">Ví dụ: <code className="rounded bg-gray-100 px-1 py-0.5">{`[{"title":"Phần 1","questions":[]}]`}</code></p>
            {error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Render QuestionList per section (live editing) */}
          {(() => {
            try {
              const parsed = JSON.parse(sectionsText || '[]');
              if (Array.isArray(parsed)) {
                return parsed.map((s: any, idx: number) => (
                  <div key={s.id || idx} className="md:col-span-2">
                    <div className="rounded border p-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold">Section: {s.title || `#${idx+1}`}</h5>
                      </div>
                      <DanhSachCauHoi
                        examId={(initial as any)._id || ''}
                        sectionId={s.id || String(idx)}
                        questions={s.questions || []}
                        onChange={(qs) => {
                          const copy = JSON.parse(sectionsText || '[]');
                          copy[idx].questions = qs;
                          setSectionsText(JSON.stringify(copy, null, 2));
                        }}
                      />
                    </div>
                  </div>
                ));
              }
            } catch (e) {
              // ignore parse errors here
            }
            return null;
          })()}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Tải media (nhiều file)</label>
            <div className="flex items-center gap-3">
              <MediaGallery
                media={gallery}
                onChange={(m) => setGallery(m)}
                onInsert={(url) => {
                  try {
                    const sections = JSON.parse(sectionsText || '[]');
                    if (!Array.isArray(sections)) throw new Error('Not array');
                    if (!sections[0]) sections[0] = { title: 'Media', questions: [], media: [] };
                    sections[0].media = sections[0].media || [];
                    sections[0].media.push({ url, type: 'image' });
                    setSectionsText(JSON.stringify(sections, null, 2));
                  } catch (err) {
                    setDescription((d: string) => `${d}\n![](${url})`);
                  }
                }}
              />
              {/* upload status shown inside MediaGallery */}
            </div>

            {/* MediaGallery renders thumbnails and insert/copy actions */}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" onClick={onCancel}>
          Hủy
        </button>
        <button
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700"
          onClick={handleSave}
        >
          <svg viewBox="0 0 24 24" className="mr-2 size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Lưu
        </button>
      </div>
    </div>
  );
}
