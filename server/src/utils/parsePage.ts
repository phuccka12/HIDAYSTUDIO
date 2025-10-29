export function parsePage(q: any) {
  const page = Math.max(1, parseInt(q.page as string || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(q.limit as string || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
