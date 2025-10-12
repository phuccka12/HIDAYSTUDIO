import apiFetch from './_apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Public
export async function listExams(params: Record<string, any> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/exams?${qs}`);
}

export async function getExam(slugOrId: string) {
  return apiFetch(`/exams/${encodeURIComponent(slugOrId)}`);
}

export async function listLessons(params: Record<string, any> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/lessons?${qs}`);
}

export async function getLesson(slugOrId: string) {
  return apiFetch(`/lessons/${encodeURIComponent(slugOrId)}`);
}

// Admin (dashboard)
export async function adminListExams(params: Record<string, any> = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await apiFetch(`/admin/exams?${qs}`);
  return data || { total: 0, items: [] };
}

export async function adminCreateExam(payload: any) {
  return apiFetch('/admin/exams', { method: 'POST', body: JSON.stringify(payload) });
}

export async function adminUpdateExam(id: string, payload: any) {
  return apiFetch(`/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function adminDeleteExam(id: string) {
  return apiFetch(`/admin/exams/${id}`, { method: 'DELETE' });
}

export async function adminPublishExam(id: string) {
  return apiFetch(`/admin/exams/${id}/publish`, { method: 'POST' });
}

export async function adminUnpublishExam(id: string) {
  return apiFetch(`/admin/exams/${id}/unpublish`, { method: 'POST' });
}

// Admin: Lessons
export async function adminListLessons(params: Record<string, any> = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await apiFetch(`/admin/lessons?${qs}`);
  return data || { total: 0, items: [] };
}

export async function adminCreateLesson(payload: any) {
  return apiFetch('/admin/lessons', { method: 'POST', body: JSON.stringify(payload) });
}

export async function adminUpdateLesson(id: string, payload: any) {
  return apiFetch(`/admin/lessons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function adminDeleteLesson(id: string) {
  return apiFetch(`/admin/lessons/${id}`, { method: 'DELETE' });
}

export async function adminPublishLesson(id: string) {
  return apiFetch(`/admin/lessons/${id}/publish`, { method: 'POST' });
}

export async function adminUnpublishLesson(id: string) {
  return apiFetch(`/admin/lessons/${id}/unpublish`, { method: 'POST' });
}

// Upload helper (uses FormData so we don't set JSON content-type)
export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/admin/uploads`, { method: 'POST', body: fd, credentials: 'include' });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) return { data: null, error: { message: (data && data.message) || res.statusText } };
  return { data, error: null };
}

export default {
  listExams, getExam, listLessons, getLesson,
  adminListExams, adminCreateExam, adminUpdateExam, adminDeleteExam, adminPublishExam, adminUnpublishExam,
  adminListLessons, adminCreateLesson, adminUpdateLesson, adminDeleteLesson, adminPublishLesson, adminUnpublishLesson,
};
