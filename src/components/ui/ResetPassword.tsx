import React, { useState } from 'react';
import authService from '../../services/api';

export const RequestReset: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { data, error } = await authService.resetPassword(email);
    setLoading(false);
    if (error) setMsg(error.message || 'Error');
    else {
      setMsg(data?.message || 'Reset request submitted.');
      if (data?.resetLink) setResetLink(data.resetLink as string);
    }
    onDone?.();
  };

  return (
    <div>
      <h3>Yêu cầu đặt lại mật khẩu</h3>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <button onClick={submit} disabled={loading || !email}>Gửi</button>
      {msg && <div>{msg}</div>}
      {resetLink && (
        <div className="mt-2">
          <p className="text-sm text-gray-700">Reset link (dev):</p>
          <a href={resetLink} className="text-blue-600 underline break-all">{resetLink}</a>
        </div>
      )}
    </div>
  );
};

export const ConfirmReset: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { data, error } = await authService.confirmResetPassword(email, token, newPassword);
    setLoading(false);
    if (error) setMsg(error.message || 'Error');
    else setMsg(data?.message || 'Password reset successful');
  };

  return (
    <div>
      <h3>Đặt lại mật khẩu</h3>
      <p>Email: {email}</p>
      <p>Token: {token ? 'OK' : 'Không có'}</p>
      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
      <button onClick={submit} disabled={loading || !newPassword}>Xác nhận</button>
      {msg && <div>{msg}</div>}
    </div>
  );
};

export default RequestReset;