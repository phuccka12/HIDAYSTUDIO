import React from 'react';
import MediaGallery from './MediaGallery';
import DanhSachCauHoi from './DanhSachCauHoi';

export default function ExamSectionsMedia({ sectionsText, setSectionsText, gallery, setGallery, initial }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
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
          <p className="mt-2 text-xs text-gray-500">Ví dụ: <code className="rounded bg-gray-100 px-1 py-0.5">[{`{"title":"Phần 1","questions":[]}`}]</code></p>
        </div>

        {(() => {
          try {
            const parsed = JSON.parse(sectionsText || '[]');
            if (Array.isArray(parsed)) {
              return parsed.map((s: any, idx: number) => (
                <div key={s.id || idx} className="md:col-span-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="text-sm font-semibold">Section: {s.title || `#${idx + 1}`}</h5>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">
                        {Array.isArray(s.questions) ? s.questions.length : 0} câu hỏi
                      </span>
                    </div>

                    <DanhSachCauHoi
                      examId={(initial as any)?._id || ''}
                      sectionId={s.id || String(idx)}
                      questions={s.questions || []}
                      onChange={(qs: any) => {
                        const copy = JSON.parse(sectionsText || '[]');
                        copy[idx].questions = qs;
                        setSectionsText(JSON.stringify(copy, null, 2));
                      }}
                    />
                  </div>
                </div>
              ));
            }
          } catch {
            // ignore parse error cho live preview
          }
          return null;
        })()}

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Tải media (nhiều file)</label>
          <div className="flex items-start gap-3">
            <MediaGallery
              media={gallery}
              onChange={(m: any) => setGallery(m)}
              onInsert={(url: string) => {
                try {
                  const sections = JSON.parse(sectionsText || '[]');
                  if (!Array.isArray(sections)) throw new Error('Not array');
                  if (!sections[0]) sections[0] = { title: 'Media', questions: [], media: [] };
                  sections[0].media = sections[0].media || [];
                  sections[0].media.push({ url, type: 'image' });
                  setSectionsText(JSON.stringify(sections, null, 2));
                } catch {
                  // fallback: append to description
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
