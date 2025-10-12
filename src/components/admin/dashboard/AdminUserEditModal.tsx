import React, { useEffect, useState } from "react";
import { Backdrop } from "../../ui/Backdrop";
import { dashboardService } from "../../../services/dashboard";

type EditProps = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onChanged?: () => void;
};

const AdminUserEditModal: React.FC<EditProps> = ({ open, userId, onClose, onChanged }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("user");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const list = await dashboardService.listUsers();
        const u = list.find((x: any) => String(x.id) === String(userId));
        setUser(u || null);
        const [ln, ...rest] = String(u?.full_name || "").split(" ");
        setLastName(ln || "");
        setFirstName(rest.join(" ") || "");
        setEmail(u?.email || "");
        setRole(u?.role || "user");
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [open, userId]);

  if (!open) return null;

  const saveProfile = async () => {
    const full_name = [lastName, firstName].filter(Boolean).join(" ");
    try {
      setSavingProfile(true);
      if (typeof (dashboardService as any).updateUser === "function") {
        await (dashboardService as any).updateUser(String(userId), { email, full_name, role });
        onChanged?.();
      } else {
        alert("Chưa có API updateUser trong dashboardService. Vui lòng thêm updateUser(id, { email, full_name, role }).");
      }
    } catch (e) { console.error(e); }
    setSavingProfile(false);
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="p-6">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-semibold">Sửa người dùng</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {loading ? (
          <div className="p-2 text-sm text-gray-600">Loading...</div>
        ) : !user ? (
          <div className="p-2 text-sm">User not found</div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">Họ (Last name)</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Tên (First name)</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm">Gmail / Email</label>
                  <div className="relative">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"><path d="M1.5 8.67l9 5.4 9-5.4v6.33a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V8.67zm.66-2.9A2.25 2.25 0 013.75 4.5h16.5a2.25 2.25 0 011.59.66L10.5 11.25 2.16 5.77z"/></svg>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={saveProfile} disabled={savingProfile} className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Lưu thay đổi</button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Bảo mật & Hành động</h3>
              <label className="mb-2 block text-sm">Đổi mật khẩu</label>
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    try {
                      await dashboardService.changeUserPassword(String(userId), newPassword);
                      alert("Password updated");
                      setNewPassword("");
                      onChanged?.();
                    } catch (e) { console.error(e); }
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Lưu mật khẩu
                </button>
                <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2">Đóng</button>
                <button
                  onClick={async () => {
                    if (!confirm("Xác nhận xóa người dùng này?")) return;
                    try {
                      await dashboardService.deleteUser(String(userId));
                      onChanged?.();
                      onClose();
                    } catch (e) { console.error(e); }
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Xóa người dùng
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Backdrop>
  );
};

export default AdminUserEditModal;
