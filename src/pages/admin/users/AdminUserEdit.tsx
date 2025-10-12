import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboard';

const AdminUserEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await dashboardService.listUsers();
        const u = list.find((x: any) => x.id === id);
        setUser(u || null);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">User not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Sửa người dùng</h1>
      <div className="bg-white p-6 rounded shadow max-w-md">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Full name:</strong> {user.full_name || '—'}</p>
        <p><strong>Role:</strong> {user.role}</p>

        <div className="mt-4">
          <label className="block mb-2">Đổi mật khẩu</label>
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="w-full p-2 border rounded mb-3" />
          <div className="flex space-x-2">
            <button onClick={async () => {
              try {
                await dashboardService.changeUserPassword(id as string, newPassword);
                alert('Password updated');
                setNewPassword('');
              } catch (e) { console.error(e); }
            }} className="bg-blue-600 text-white px-4 py-2 rounded">Save password</button>
            <button onClick={() => navigate('/admin/users')} className="bg-gray-200 px-4 py-2 rounded">Back</button>
            <button onClick={async () => {
              if (!confirm('Xác nhận xóa người dùng này?')) return;
              try {
                await dashboardService.deleteUser(id as string);
                navigate('/admin/users');
              } catch (e) { console.error(e); }
            }} className="bg-red-600 text-white px-4 py-2 rounded">Delete user</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserEdit;
