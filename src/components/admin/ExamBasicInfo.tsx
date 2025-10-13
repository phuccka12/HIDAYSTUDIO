import React from 'react';

export default function ExamBasicInfo({
  title,
  setTitle,
  slug,
  setSlug,
  description,
  setDescription,
  slugify
}: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">Thông tin cơ bản</h4>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">Bắt buộc</span>
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
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ielts-practice-test-1"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              title="Tạo slug từ tiêu đề"
              onClick={() => setSlug((s: string) => s?.trim() || slugify(title))}
            >
              Tạo
            </button>
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
  );
}
