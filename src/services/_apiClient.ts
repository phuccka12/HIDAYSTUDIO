const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options && options.headers) as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    return { data: null, error: { message: (data && data.message) || res.statusText } };
  }
  return { data, error: null };
};

export default apiFetch;
