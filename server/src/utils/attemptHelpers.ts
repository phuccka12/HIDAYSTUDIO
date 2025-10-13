export function mergeAnswers(existing: any[] = [], incoming: any[] = []) {
  const map = new Map<string, any>();
  for (const a of existing || []) {
    if (a && a.questionId) map.set(a.questionId, a);
  }
  for (const ia of incoming || []) {
    if (!ia || !ia.questionId) continue;
    map.set(ia.questionId, { questionId: ia.questionId, answer: ia.answer, updatedAt: new Date() });
  }
  return Array.from(map.values()) as any;
}

export function isAttemptExpired(attempt: any) {
  return attempt && attempt.expiresAt && attempt.expiresAt.getTime() < Date.now();
}
