import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import MediaGallery from './MediaGallery';

type Choice = { id: string; text: string; isCorrect?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (q: any) => void;
  initial?: any;
};

export default function QuestionForm({ open, onClose, onSave, initial }: Props) {
  const [type, setType] = useState(initial?.type || 'mcq');
  const [prompt, setPrompt] = useState(initial?.prompt || '');
  const [choices, setChoices] = useState<Choice[]>(
    initial?.choices || [{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }]
  );
  const [points, setPoints] = useState(initial?.points || 1);
  const [media, setMedia] = useState(initial?.media || []);

  // When the modal opens, refresh internal state from `initial` prop.
  useEffect(() => {
    if (!open) return;
    setType(initial?.type || 'mcq');
    setPrompt(initial?.prompt || '');
    setPoints(initial?.points ?? 1);
    setMedia(initial?.media || []);
    if (initial?.choices && Array.isArray(initial.choices) && initial.choices.length > 0) {
      setChoices(initial.choices.map((c: any, i: number) => ({ id: c.id || String(Date.now() + i), text: c.text || '', isCorrect: !!c.isCorrect })));
    } else {
      setChoices([{ id: 'a', text: '', isCorrect: false }, { id: 'b', text: '', isCorrect: false }]);
    }
  }, [open, initial]);

  function handleChoiceChange(idx: number, text: string) {
    const c = [...choices];
    c[idx] = { ...c[idx], text };
    setChoices(c);
  }
  function addChoice() {
    setChoices((list) => [...list, { id: String(Date.now()), text: '', isCorrect: false }]);
  }
  function removeChoice(idx: number) {
    setChoices((list) => list.filter((_, i) => i !== idx));
  }
  function handleSave() {
    const payload: any = { type, prompt, choices, points, media };
    if (initial && initial.id) payload.id = initial.id;
    onSave(payload);
    onClose();
  }

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={initial ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}>
      <div className="space-y-6">
        {/* Khối: Loại câu hỏi & điểm */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-800">Thiết lập</h4>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Loại câu hỏi</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-9 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mcq">Trắc nghiệm (chọn 1)</option>
                  <option value="multi">Trắc nghiệm (chọn nhiều)</option>
                  <option value="essay">Tự luận</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                * Giữ nguyên logic: chỉ phần lựa chọn hiển thị khi là <b>mcq</b>.
              </p>
            </div>

            <div className="max-w-[160px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">Điểm</label>
              <input
                type="number"
                value={points}
                min={0}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Khối: Nội dung đề bài */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-800">Nội dung</h4>
          </div>
          <div className="p-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Đề bài / prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-36 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập nội dung câu hỏi..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Bạn có thể dùng Markdown/HTML tuỳ trình soạn thảo ở nơi hiển thị.
            </p>
          </div>
        </div>

        {/* Khối: Lựa chọn (chỉ MCQ) */}
        {type === 'mcq' && (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold text-gray-800">Các lựa chọn</h4>
              <button
                type="button"
                onClick={addChoice}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <svg viewBox="0 0 24 24" className="mr-1 size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15M19.5 12h-15" />
                </svg>
                Thêm lựa chọn
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {choices.map((c, idx) => (
                  <div
                    key={c.id}
                    className="group flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50"
                  >
                    <div className="mt-2 select-none rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {idx + 1}
                    </div>
                    <div className="mt-2">
                      {type === 'mcq' ? (
                        <input
                          type="radio"
                          name="correct"
                          checked={!!c.isCorrect}
                          onChange={() => {
                            // set only this as correct
                            setChoices(choices.map((cc, i) => ({ ...cc, isCorrect: i === idx })));
                          }}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={!!c.isCorrect}
                          onChange={(e) => {
                            const copy = [...choices];
                            copy[idx] = { ...copy[idx], isCorrect: e.target.checked };
                            setChoices(copy);
                          }}
                        />
                      )}
                    </div>
                    <input
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                      value={c.text}
                      onChange={(e) => handleChoiceChange(idx, e.target.value)}
                      placeholder={`Nội dung lựa chọn #${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeChoice(idx)}
                      className="mt-1 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      aria-label="Xóa lựa chọn"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              {choices.length === 0 && (
                <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-center text-sm text-gray-500">
                  Chưa có lựa chọn nào. Nhấn <b>Thêm lựa chọn</b> để bắt đầu.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Khối: Media */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-800">Media đính kèm</h4>
          </div>
          <div className="p-4">
            <MediaGallery media={media} onChange={setMedia} />
            <p className="mt-2 text-xs text-gray-500">
              Hỗ trợ hình ảnh/âm thanh. Media này chỉ gắn với câu hỏi hiện tại.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            onClick={onClose}
            type="button"
          >
            Huỷ
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
            onClick={handleSave}
            type="button"
          >
            <svg viewBox="0 0 24 24" className="mr-2 size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Lưu
          </button>
        </div>
      </div>
    </Modal>
  );
}
