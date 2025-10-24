// Service frontend gọi các endpoint backend liên quan đến Writing/Submission
import { apiFetch } from '../_apiClient'; // nếu bạn có _apiClient; nếu không, dùng fetch

const API_BASE = (import.meta && (import.meta as any).env?.VITE_API_BASE) || 'http://localhost:4000';

export async function getRandomPrompt(taskType = 'IELTS_Task2') {
  const url = `${API_BASE}/writing/random?task_type=${encodeURIComponent(taskType)}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${url} -> ${res.status} ${txt}`);
  }
  return res.json();
}

export async function createSubmission(payload: {
  user_id: string;
  task_type: string;
  prompt: string;
  content: string;
}) {
  // prefer apiFetch if exists (handles baseUrl/auth); fallback to fetch
  if (typeof apiFetch === 'function') {
    const { data, error } = await apiFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (error) throw error;
    return data;
  }
  const res = await fetch('/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSubmission(id: string) {
  if (typeof apiFetch === 'function') {
    const { data, error } = await apiFetch(`/submissions/${id}`);
    if (error) throw error;
    return data;
  }
  const res = await fetch(`/submissions/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserSubmissions(userId: string, limit = 20) {
  // IMPORTANT: backend expects /submissions?user_id=...
  if (typeof apiFetch === 'function') {
    const { data, error } = await apiFetch(`/submissions?user_id=${encodeURIComponent(userId)}&limit=${limit}`);
    if (error) throw error;
    return data;
  }
  const res = await fetch(`/submissions?user_id=${encodeURIComponent(userId)}&limit=${limit}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default { getRandomPrompt, createSubmission, getSubmission, getUserSubmissions };