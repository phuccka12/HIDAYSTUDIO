import React from 'react';
// Media support disabled in this build
import DanhSachCauHoi from './DanhSachCauHoi';

export default function ExamSectionsMedia({ sectionsText, setSectionsText, initial }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">Cấu trúc & Media</h4>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex items-start justify-between">
            <label className="mb-1 block text-sm font-medium">Các phần (JSON)</label>
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
              onClick={() => {
                try {
                  const parsed = JSON.parse(sectionsText || '[]');
                  const next = Array.isArray(parsed) ? parsed : [];
                  const idx = next.length + 1;
                  const id = `s_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                  next.push({ id, type: 'reading', title: `Phần ${idx}`, questions: [] });
                  setSectionsText(JSON.stringify(next, null, 2));
                } catch {
                  const id = `s_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                  setSectionsText(JSON.stringify([{ id, type: 'reading', title: 'Phần 1', questions: [] }], null, 2));
                }
              }}
            >
              Thêm phần
            </button>
          </div>
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
                        <div className="flex items-center gap-3">
                          <h5 className="text-sm font-semibold">Section: {s.title || `#${idx + 1}`}</h5>
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">
                            {Array.isArray(s.questions) ? s.questions.length : 0} câu hỏi
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Đổi tên phần"
                            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              try {
                                const newTitle = window.prompt('Nhập tên phần mới:', s.title || `Phần ${idx + 1}`);
                                if (newTitle === null) return;
                                const copy = JSON.parse(sectionsText || '[]');
                                if (!Array.isArray(copy)) return;
                                copy[idx].title = String(newTitle).trim();
                                setSectionsText(JSON.stringify(copy, null, 2));
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            Đổi tên
                          </button>
                          <button
                            type="button"
                            title="Xoá phần"
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                            onClick={() => {
                              try {
                                if (!confirm('Bạn có chắc muốn xoá phần này?')) return;
                                const copy = JSON.parse(sectionsText || '[]');
                                if (!Array.isArray(copy)) return;
                                copy.splice(idx, 1);
                                setSectionsText(JSON.stringify(copy, null, 2));
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            Xoá
                          </button>
                        </div>
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

        {/* Media upload disabled */}
      </div>
    </div>
  );
}
