type SpeakingMeta = {
  allowRecording?: boolean;
  maxDurationSeconds?: number;
  audioExampleUrl?: string;
  imageUrl?: string;
  rubric?: string;
  autoGrade?: boolean;
};

import { useRef, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

type Props = {
  value: SpeakingMeta | undefined;
  onChange: (v: SpeakingMeta) => void;
};

export default function SpeakingQuestionForm({ value, onChange }: Props) {
  const meta = value || {};
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  function update(partial: Partial<SpeakingMeta>) {
    onChange({ ...(meta || {}), ...partial });
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
        if (obj.ok && typeof obj.url === 'string') {
          update({ audioExampleUrl: obj.url });
        }
      } else {
        console.error('upload failed', res.status, json);
      }
    } catch (err) {
      // ignore upload errors for now; admin will paste URL as fallback
      console.error('upload error', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleImageSelect(file?: File) {
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/admin/uploads`, { method: 'POST', body: fd, credentials: 'include' });
      let json: unknown = null;
      try { json = await res.json(); } catch { json = null; }
      if (res.ok && json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        if (obj.ok && typeof obj.url === 'string') {
          update({ audioExampleUrl: meta.audioExampleUrl, imageUrl: obj.url });
        }
      } else {
        console.error('image upload failed', res.status, json);
      }
    } catch (err) {
      console.error('image upload error', err);
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-800">Cấu hình Speaking</h4>
      </div>
      <div className="p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!meta.allowRecording}
            onChange={(e) => update({ allowRecording: e.target.checked })}
          />
          Cho phép thí sinh ghi âm trực tiếp
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Thời lượng tối đa (giây)</label>
          <input
            type="number"
            min={1}
            value={meta.maxDurationSeconds ?? ''}
            onChange={(e) => update({ maxDurationSeconds: e.target.value ? Number(e.target.value) : undefined })}
            className="w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Audio mẫu (URL hoặc tải lên)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={meta.audioExampleUrl || ''}
              onChange={(e) => update({ audioExampleUrl: e.target.value })}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="https://.../example.mp3"
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
          {meta.audioExampleUrl && (
            <audio className="mt-2" controls src={meta.audioExampleUrl} />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hình ảnh (URL hoặc tải lên)</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={meta.imageUrl || ''}
              onChange={(e) => update({ ...(meta || {}), imageUrl: e.target.value })}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="https://.../image.jpg"
            />
            <input id="speaking-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files ? e.target.files[0] : undefined)} />
            <button
              type="button"
              onClick={() => document.getElementById('speaking-image-input')?.click()}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              {imageUploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
          {meta.imageUrl && (
            <div className="mt-2">
              <img src={meta.imageUrl} alt="Preview" className="max-h-40 object-contain rounded-md border" />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Rubric / Hướng dẫn chấm</label>
          <textarea
            value={meta.rubric || ''}
            onChange={(e) => update({ rubric: e.target.value })}
            className="h-24 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="Mô tả cách chấm (ví dụ: pronunciation 2pt, fluency 2pt)"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!meta.autoGrade}
            onChange={(e) => update({ autoGrade: e.target.checked })}
          />
          Đánh giá tự động (dấu hiệu; không kích hoạt STT/LLM ở lần này)
        </label>
      </div>
    </div>
  );
}
