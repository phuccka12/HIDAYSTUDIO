import React from 'react';

export default function ExamSettings({ settings, setSettings }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">Cài đặt đề thi</h4>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200">Tùy chỉnh</span>
      </div>

      <div className="grid gap-5 p-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Thời gian (phút)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={settings.timeLimitMinutes}
              onChange={(e) => setSettings((s: any) => ({ ...s, timeLimitMinutes: Number(e.target.value) }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-12 shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="60"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">phút</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Đặt <b>0</b> để không giới hạn thời gian.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Số lần làm (0 = không giới hạn)</label>
          <input
            type="number"
            min={0}
            value={settings.attemptsAllowed}
            onChange={(e) => setSettings((s: any) => ({ ...s, attemptsAllowed: Number(e.target.value) }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="1"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">Ngẫu nhiên câu hỏi</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm cursor-pointer">
              <div>
                <div className="text-sm font-medium text-gray-800">Shuffle toàn bộ</div>
                <div className="text-xs text-gray-500">Xáo trộn toàn bộ câu hỏi trong đề.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.randomizeQuestions}
                onChange={(e) => setSettings((s: any) => ({ ...s, randomizeQuestions: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="ml-3 inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition peer-checked:bg-indigo-600">
                <span className="ml-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <div>
                <div className="text-sm font-medium text-gray-800">Shuffle theo phần</div>
                <div className="text-xs text-gray-500">Chỉ xáo trộn trong phạm vi từng section.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.randomizePerSection}
                onChange={(e) => setSettings((s: any) => ({ ...s, randomizePerSection: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="ml-3 inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition peer-checked:bg-indigo-600">
                <span className="ml-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5 pointer-events-none" />
              </span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">Hiển thị đáp án</label>
          <div className="grid gap-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm cursor-pointer">
              <input type="radio" name="showAnswers" value="immediately" checked={settings.showAnswersAfterSubmit === 'immediately'}
                onChange={() => setSettings((s: any) => ({ ...s, showAnswersAfterSubmit: 'immediately' }))} />
              <div>
                <div className="text-sm font-medium text-gray-800">Hiện ngay</div>
                <div className="text-xs text-gray-500">Học viên thấy đáp án ngay sau khi hoàn thành.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm cursor-pointer">
              <input type="radio" name="showAnswers" value="after_grading" checked={settings.showAnswersAfterSubmit === 'after_grading'}
                onChange={() => setSettings((s: any) => ({ ...s, showAnswersAfterSubmit: 'after_grading' }))} />
              <div>
                <div className="text-sm font-medium text-gray-800">Hiện sau chấm</div>
                <div className="text-xs text-gray-500">Chỉ hiển thị đáp án sau khi bài được chấm.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm cursor-pointer">
              <input type="radio" name="showAnswers" value="never" checked={settings.showAnswersAfterSubmit === 'never'}
                onChange={() => setSettings((s: any) => ({ ...s, showAnswersAfterSubmit: 'never' }))} />
              <div>
                <div className="text-sm font-medium text-gray-800">Không bao giờ</div>
                <div className="text-xs text-gray-500">Không hiển thị đáp án cho học viên.</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tỷ lệ pass (%)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={settings.passThresholdPercent}
              onChange={(e) => setSettings((s: any) => ({ ...s, passThresholdPercent: Number(e.target.value) }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="60"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Giữa 0–100%. Mặc định 60%.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Negative marking</label>
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-800">Bật phạt mỗi câu sai</span>
              <input
                type="checkbox"
                checked={settings.negativeMarking?.enabled}
                onChange={(e) => setSettings((s: any) => ({ ...s, negativeMarking: { ...(s.negativeMarking || {}), enabled: e.target.checked } }))}
                className="peer sr-only"
              />
              <span className="ml-3 inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition peer-checked:bg-indigo-600 pointer-events-none">
                <span className="ml-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5 pointer-events-none" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Mức phạt</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={settings.negativeMarking?.penalty}
                onChange={(e) => setSettings((s: any) => ({ ...s, negativeMarking: { ...(s.negativeMarking || {}), penalty: Number(e.target.value) } }))}
                className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                disabled={!settings.negativeMarking?.enabled}
                placeholder="0.25"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Ví dụ 0.25 điểm trừ cho mỗi câu sai.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
