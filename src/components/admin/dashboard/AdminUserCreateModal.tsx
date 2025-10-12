import React, { useState } from "react";
import { Backdrop } from "../../ui/Backdrop";
import { dashboardService } from "../../../services/dashboard";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const AdminUserCreateModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const full_name = [lastName, firstName].filter(Boolean).join(" ");
      await dashboardService.createUser({ email, password, full_name, role });
      onCreated?.();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    onClose();
    setEmail(""); setPassword(""); setFirstName(""); setLastName(""); setRole("user");
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="p-6">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-semibold">Thêm người dùng</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Điền thông tin cơ bản. Bạn có thể chỉnh sửa sau.</p>

        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">Họ (Last name)</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Tên (First name)</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">Gmail / Email</label>
            <div className="relative">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-10 shadow-sm focus:ring-2 focus:ring-indigo-500" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"><path d="M1.5 8.67l9 5.4 9-5.4v6.33a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 15V8.67zm.66-2.9A2.25 2.25 0 013.75 4.5h16.5a2.25 2.25 0 011.59.66L10.5 11.25 2.16 5.77z"/></svg>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">Mật khẩu</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2">Hủy</button>
          <button onClick={submit} disabled={loading} className="rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700">Tạo mới</button>
        </div>
      </div>
    </Backdrop>
  );
};

export default AdminUserCreateModal;
