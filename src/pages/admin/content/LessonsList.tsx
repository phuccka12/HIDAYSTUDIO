import { useEffect, useState } from 'react';
import {
  adminListLessons,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminPublishLesson,
  adminUnpublishLesson
} from '../../../services/content';
import Modal from '../../../components/ui/Modal';
import LessonForm from '../../../components/admin/LessonForm';

type Lesson = any;
/* ---------------- Page: Lessons List (UI polish, giữ nguyên logic) ---------------- */
export default function LessonsListPage() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, _setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res: any = await adminListLessons({ page, limit: 20 });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function handleCreate(payloadOrLesson: any) {
    // payloadOrLesson may be the created lesson object returned by LessonForm
    // If it's not an object with _id, we reload to fetch from server.
    if (payloadOrLesson && payloadOrLesson._id) {
      setItems((prev) => [payloadOrLesson, ...prev]);
      setShowCreate(false);
      return;
    }
    await adminCreateLesson(payloadOrLesson);
    setShowCreate(false);
    load();
  }

  async function handleUpdate(id: string, payloadOrLesson: any) {
    // If form returns the updated lesson, patch locally
    if (payloadOrLesson && payloadOrLesson._id) {
      setItems((prev) => prev.map((p) => (String(p._id) === String(payloadOrLesson._id) ? payloadOrLesson : p)));
      setEditing(null);
      return;
    }
    await adminUpdateLesson(id, payloadOrLesson);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lesson?')) return;
    await adminDeleteLesson(id);
    load();
  }

  async function togglePublish(id: string, published: boolean) {
    if (published) await adminUnpublishLesson(id);
    else await adminPublishLesson(id);
    load();
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bài học</h2>
          <p className="mt-1 text-sm text-gray-500">Quản lý danh sách bài học, tạo mới, chỉnh sửa và xuất bản.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded-xl bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
            onClick={() => setShowCreate(true)}
          >
            <svg viewBox="0 0 24 24" className="mr-2 size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tạo bài học
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-600">
                <th className="p-3 font-semibold">Tiêu đề</th>
                <th className="p-3 font-semibold">Slug</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-4 w-56 animate-pulse rounded bg-gray-200" /></td>
                    <td className="p-3"><div className="h-4 w-40 animate-pulse rounded bg-gray-200" /></td>
                    <td className="p-3"><div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="p-3 text-right"><div className="ml-auto h-8 w-40 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-gray-600">
                    Chưa có bài học nào. Nhấn <span className="font-medium">Tạo bài học</span> để bắt đầu.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} className="border-t hover:bg-gray-50/60">
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                          {String(it.title || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">{it.title}</div>
                          <div className="truncate text-xs text-gray-500">ID: {it._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{it.slug || '—'}</span>
                    </td>
                    <td className="p-3 align-middle">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                          it.published ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-700 ring-gray-200'
                        ].join(' ')}
                      >
                        {it.published ? 'Đã xuất bản' : 'Nháp'}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          onClick={() => setEditing(it)}
                        >
                          <svg viewBox="0 0 24 24" className="mr-1 size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-amber-600"
                          onClick={() => togglePublish(it._id, it.published)}
                        >
                          {it.published ? 'Hủy xuất bản' : 'Xuất bản'}
                        </button>
                        <button
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-700"
                          onClick={() => handleDelete(it._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="divide-y md:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="mb-3 h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">Chưa có bài học nào.</div>
          ) : (
            items.map((it) => (
              <div key={it._id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                    {String(it.title || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{it.title}</div>
                    <div className="truncate text-xs text-gray-500">{it.slug || '—'}</div>
                  </div>
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                      it.published ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-700 ring-gray-200'
                    ].join(' ')}
                  >
                    {it.published ? 'Đã xuất bản' : 'Nháp'}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    onClick={() => setEditing(it)}
                  >
                    Sửa
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-amber-600"
                    onClick={() => togglePublish(it._id, it.published)}
                  >
                    {it.published ? 'Hủy xuất bản' : 'Xuất bản'}
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-700"
                    onClick={() => handleDelete(it._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Tạo bài học mới" onClose={() => setShowCreate(false)}>
          <LessonForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal title="Chỉnh sửa bài học" onClose={() => setEditing(null)}>
          <LessonForm initial={editing} onSave={(p) => handleUpdate(editing._id, p)} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
