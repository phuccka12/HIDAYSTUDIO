interface GradeResult {
  totalPossible: number;
  totalScore: number;
  percent: number;
  pass: boolean;
  details: any[];
}

export function gradeAttempt(exam: any, answers: any[]): GradeResult {
  const qMap = new Map<string, any>();
  for (const s of (exam.sections || [])) for (const q of (s.questions || [])) qMap.set(q.id, q);

  let totalPossible = 0;
  let totalScore = 0;
  const details: any[] = [];

  const negative = (exam.settings && exam.settings.negativeMarking && Number(exam.settings.negativeMarking.perWrong)) ? Number(exam.settings.negativeMarking.perWrong) : 0;

  for (const ans of answers || []) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;
    const maxPoints = (typeof q.points === 'number') ? Number(q.points) : 1;
    totalPossible += maxPoints;
    let awarded = 0;

    if (q.type === 'mcq' && Array.isArray(q.choices)) {
      const correct = q.choices.find((c: any) => c.isCorrect);
      if (correct && typeof ans.answer === 'string' && ans.answer === correct.id) {
        awarded = maxPoints;
      } else {
        awarded = 0;
        if (negative) awarded -= negative;
      }
    } else if (q.type === 'multi' && Array.isArray(q.choices)) {
      const correctIds = q.choices.filter((c: any) => c.isCorrect).map((c: any) => String(c.id));
      const given = Array.isArray(ans.answer) ? ans.answer.map(String) : [];
      const correctCount = given.filter((g: any) => correctIds.includes(g)).length;
      const wrongCount = given.length - correctCount;
      if (correctIds.length > 0) {
        awarded = Math.max(0, (maxPoints * (correctCount / correctIds.length)) - (negative * wrongCount));
      }
    } else {
      // not auto-graded
      awarded = 0;
    }

    if (awarded < 0) awarded = Math.max(0, awarded);
    totalScore += awarded;
    details.push({ questionId: ans.questionId, awarded, maxPoints });
  }

  const passThreshold = (exam.settings && typeof exam.settings.passThresholdPercent === 'number') ? Number(exam.settings.passThresholdPercent) : 0;
  const percent = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  const pass = percent >= passThreshold;

  return { totalPossible, totalScore, percent, pass, details };
}
