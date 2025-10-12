import React, { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../services/dashboard";
import AdminUserCreateModal from "../../components/admin/dashboard/AdminUserCreateModal";
import AdminUserEditModal from "../../components/admin/dashboard/AdminUserEditModal";

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEditId, setOpenEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await dashboardService.listUsers();
      setUsers(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const kw = q.toLowerCase();
    return users.filter((u) => [u?.email, u?.full_name, u?.role].some((v: string) => String(v || "").toLowerCase().includes(kw)));
  }, [users, q]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground/80 mt-1">Xem, tìm kiếm và chỉnh sửa thông tin người dùng.</p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 mr-2">
            <path d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" />
          </svg>
          Thêm người dùng
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo email, tên, role…" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.318 11.93l4.251 4.251a.75.75 0 101.06-1.06l-4.25-4.252A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd"/></svg>
        </div>
        <div className="text-sm text-muted-foreground/70">Tổng: <span className="font-medium">{users.length}</span> · Hiển thị: {filtered.length}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/60 overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-600">
                <th className="p-3 font-semibold">Người dùng</th>
                <th className="p-3 font-semibold">Tên</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-4 w-48 animate-pulse rounded bg-gray-200" /></td>
                    <td className="p-3"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                    <td className="p-3"><div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="p-3 text-right"><div className="ml-auto h-8 w-24 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-gray-600">{q ? "Không tìm thấy kết quả phù hợp." : "Không có người dùng."}</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50/60">
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                          {String(u?.full_name || u?.email || "?").trim().slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">{u.email}</div>
                          <div className="truncate text-xs text-gray-500">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-middle"><span className="text-sm text-gray-800">{u.full_name || "—"}</span></td>
                    <td className="p-3 align-middle">
                      <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", u.role === "admin" ? "bg-red-50 text-red-700 ring-red-200" : (u.role === "moderator" || u.role === "editor") ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"].join(" ")}>{u.role}</span>
                    </td>
                    <td className="p-3 align-middle text-right">
                      <button onClick={() => setOpenEditId(String(u.id))} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" /></svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="mb-3 h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">{q ? "Không tìm thấy kết quả phù hợp." : "Không có người dùng."}</div>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                    {String(u?.full_name || u?.email || "?").trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{u.email}</div>
                    <div className="truncate text-xs text-gray-500">{u.full_name || "—"}</div>
                  </div>
                  <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", u.role === "admin" ? "bg-red-50 text-red-700 ring-red-200" : (u.role === "moderator" || u.role === "editor") ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"].join(" ")}>{u.role}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={() => setOpenEditId(String(u.id))} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AdminUserCreateModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={load} />
      <AdminUserEditModal open={!!openEditId} userId={openEditId} onClose={() => setOpenEditId(null)} onChanged={load} />
    </div>
  );
};

export default UsersList;
