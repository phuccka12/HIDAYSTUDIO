import { useRef, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

type Choice = { id: string; text: string; isCorrect?: boolean };

type Comprehension = {
  type?: 'mcq' | 'short' | 'fill';
  choices?: Choice[];
  shuffleChoices?: boolean;
  correctAnswer?: string | string[];
};

type ListeningMeta = {
  audioUrl?: string;
  transcript?: string;
  comprehension?: Comprehension;
};

type Props = {
  value?: ListeningMeta;
  onChange: (v: ListeningMeta) => void;
};

function makeChoice(id?: string) {
  return { id: id || String(Date.now()), text: '', isCorrect: false } as Choice;
}

export default function ListeningQuestionForm({ value, onChange }: Props) {
  const meta = value || {};
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  function update(partial: Partial<ListeningMeta>) {
    onChange({ ...(meta || {}), ...partial });
  }

  function updateComprehension(partial: Partial<Comprehension>) {
    onChange({ ...(meta || {}), comprehension: { ...(meta.comprehension || {}), ...partial } });
  }

  function addChoice() {
    const list = (meta.comprehension?.choices || []).concat([makeChoice()]);
    updateComprehension({ choices: list });
  }

  function setChoiceText(idx: number, text: string) {
    const list = (meta.comprehension?.choices || []).map((c, i) => (i === idx ? { ...c, text } : c));
    updateComprehension({ choices: list });
  }

  function toggleChoiceCorrect(idx: number) {
    const comp = meta.comprehension || { choices: [] };
    const list = (comp.choices || []).map((c, i) => ({ ...c, isCorrect: i === idx ? !c.isCorrect : c.isCorrect }));
    updateComprehension({ choices: list });
  }

  function removeChoice(idx: number) {
    const list = (meta.comprehension?.choices || []).filter((_, i) => i !== idx);
    updateComprehension({ choices: list });
  }

  async function handleFileSelect(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/admin/uploads`, { method: 'POST', body: fd, credentials: 'include' });
      let json: unknown = null;
      try { json = await res.json(); } catch { json = null; }
      if (res.ok && json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        if (obj.ok && typeof obj.url === 'string') update({ audioUrl: obj.url });
        else console.error('upload failed', res.status, obj);
      } else {
        console.error('upload failed', res.status, json);
      }
    } catch (err) {
      console.error('upload error', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">Cấu hình Listening</h4>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Audio (URL hoặc tải lên)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={meta.audioUrl || ''}
              onChange={(e) => update({ audioUrl: e.target.value })}
              placeholder="https://.../audio.mp3"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : undefined)} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
          {meta.audioUrl && (
            <audio className="mt-2" controls src={meta.audioUrl} />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Transcript (tuỳ chọn)</label>
          <textarea
            value={meta.transcript || ''}
            onChange={(e) => update({ transcript: e.target.value })}
            className="h-24 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="Bản transcript giúp người thi đọc theo hoặc phục vụ accessibility"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Loại bài tập (comprehension)</label>
          <div className="flex items-center gap-2">
            <select
              value={meta.comprehension?.type || 'mcq'}
              onChange={(e) => updateComprehension({ type: e.target.value as 'mcq' | 'short' | 'fill' })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="mcq">MCQ (trắc nghiệm)</option>
              <option value="short">Short answer</option>
              <option value="fill">Fill in the blank</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!meta.comprehension?.shuffleChoices}
                onChange={(e) => updateComprehension({ shuffleChoices: e.target.checked })}
              />
              Xáo trộn lựa chọn
            </label>
          </div>
        </div>

        {meta.comprehension?.type === 'mcq' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium">Các lựa chọn (MCQ)</h5>
              <button
                type="button"
                onClick={addChoice}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Thêm lựa chọn
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {(meta.comprehension?.choices || []).map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="listening-correct"
                    checked={!!c.isCorrect}
                    onChange={() => toggleChoiceCorrect(i)}
                  />
                  <input
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                    value={c.text}
                    onChange={(e) => setChoiceText(i, e.target.value)}
                    placeholder={`Lựa chọn #${i + 1}`}
                  />
                  <button type="button" onClick={() => removeChoice(i)} className="text-red-600">Xóa</button>
                </div>
              ))}
              {(meta.comprehension?.choices || []).length === 0 && (
                <div className="text-sm text-gray-500">Chưa có lựa chọn nào</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
