import React, { useState } from 'react';
import { uploadFile } from '../../services/content';

type Media = { url: string; filename?: string };

export default function MediaGallery({
  media,
  onChange,
  onInsert
}: {
  media: Media[];
  onChange: (m: Media[]) => void;
  onInsert?: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const f of files) {
        // eslint-disable-next-line no-await-in-loop
        const res: any = await uploadFile(f as unknown as File);
        if (res?.error) {
          console.error('upload error', res.error);
          continue;
        }
        if (res?.data) onChange([...media, { url: res.data.url, filename: res.data.filename }]);
      }
    } finally {
      setUploading(false);
      try { e.currentTarget.value = ''; } catch { /* ignore */ }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Chọn tệp
          <input type="file" multiple className="hidden" onChange={handleFiles} />
        </label>
        {uploading && <span className="text-sm text-gray-500">Đang tải lên…</span>}
        <small className="text-gray-500">Tải media và chèn vào nội dung bên trên.</small>
      </div>

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((it, idx) => (
            <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <div className="bg-gray-50">
                {/(jpg|jpeg|png|gif|webp|svg)$/i.test(it.url) ? (
                  <img src={it.url} alt={it.filename || 'media'} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center text-xs text-gray-600">{it.filename || 'file'}</div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-2">
                <div className="flex gap-2">
                  <button className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700" onClick={() => onInsert?.(it.url)}>Chèn</button>
                  <button className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200" onClick={() => navigator.clipboard?.writeText(it.url)}>Sao chép</button>
                </div>
                <button 
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50" 
                  onClick={() => {
                    if (window.confirm(`Xóa tệp "${it.filename || 'file'}"?\nTệp sẽ bị xóa khỏi danh sách (file vẫn còn trên server).`)) {
                      onChange(media.filter((_, i) => i !== idx));
                    }
                  }}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
