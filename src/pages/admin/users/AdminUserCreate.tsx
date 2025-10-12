import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboard';

const AdminUserCreate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    try {
      await dashboardService.createUser({ email, password, full_name: fullName, role });
      navigate('/admin/users');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Thêm người dùng</h1>
      <div className="bg-white p-6 rounded shadow max-w-md">
        <label className="block mb-2">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded mb-3" />
        <label className="block mb-2">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full p-2 border rounded mb-3" />
        <label className="block mb-2">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border rounded mb-3" />
        <label className="block mb-2">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded mb-3">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <div className="flex space-x-2">
          <button onClick={submit} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
          <button onClick={() => navigate('/admin/users')} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserCreate;
