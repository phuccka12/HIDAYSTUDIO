import { useState } from 'react';
import MediaGallery from './MediaGallery';
import { adminCreateLesson, adminUpdateLesson } from '../../services/content';

type Props = {
  initial?: any;
  onSave: (lesson: any) => void;
  onCancel: () => void;
};

export default function LessonForm({ initial = {}, onSave, onCancel }: Props) {
  const [title, setTitle] = useState<string>(initial.title || '');
  const [slug, setSlug] = useState<string>(initial.slug || '');
  const [description, setDescription] = useState<string>(initial.description || '');
  const [content, setContent] = useState<string>(initial.content || '');
  const [media, setMedia] = useState<Array<{ url: string; filename?: string }>>(initial.media || []);
  const [published, setPublished] = useState<boolean>(Boolean(initial.published));
  // uploading handled inside MediaGallery

  function slugify(input: string) {
    return String(input).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }

  // media upload is handled by MediaGallery component

  async function handleSave() {
    const payload = { title: title?.trim(), slug: slug?.trim(), description: description?.trim(), content, media, published };
    try {
      if (initial && initial._id) {
        const { data } = await adminUpdateLesson(initial._id, payload) as any;
        onSave(data?.lesson || data || payload);
      } else {
        const { data } = await adminCreateLesson(payload) as any;
        onSave(data?.lesson || data || payload);
      }
    } catch (e) {
      console.error('save error', e);
      onSave(payload);
    }
  }

  return (
    <div className="space-y-6">
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
                placeholder="VD: Ngữ pháp thì hiện tại hoàn thành"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug (tùy chọn)</label>
            <div className="flex gap-2">
              <input className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ngu-phap-hien-tai-hoan-thanh" />
              <button type="button" className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setSlug((s) => s?.trim() || slugify(title))} title="Tạo slug từ tiêu đề">Tạo</button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Nếu để trống, hệ thống có thể tự sinh từ tiêu đề.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả ngắn</label>
            <input className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tóm tắt nội dung bài học…" />
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              <span className="ml-2">Xuất bản ngay</span>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-800">Nội dung & Media</h4>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Nội dung (Markdown hoặc HTML)</label>
            <textarea className="h-48 w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-sm shadow-sm focus:ring-2 focus:ring-indigo-500" value={content} onChange={(e) => setContent(e.target.value)} placeholder="## Tiêu đề chính\nNội dung..." />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Tải media (nhiều file)</label>
            <div className="flex items-center gap-3">
              <MediaGallery media={media} onChange={(m) => setMedia(m)} onInsert={(url) => setContent((c: string) => `${c}\n![](${url})`)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" onClick={onCancel}>Hủy</button>
        <button className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-700" onClick={handleSave}>Lưu</button>
      </div>
    </div>
  );
}
