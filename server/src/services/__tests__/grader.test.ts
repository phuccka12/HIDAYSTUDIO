import { gradeAttempt } from '../grader';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('ASSERTION FAILED:', msg);
    process.exit(1);
  }
}

// Build a fake exam with MCQ and MULTI
const exam: any = {
  sections: [
    { questions: [
      { id: 'q1', type: 'mcq', points: 1, choices: [ { id: 'c1', text: 'A', isCorrect: true }, { id: 'c2', text: 'B', isCorrect: false } ] },
      { id: 'q2', type: 'multi', points: 2, choices: [ { id: 'c3', isCorrect: true }, { id: 'c4', isCorrect: true }, { id: 'c5', isCorrect: false } ] }
    ] }
  ],
  settings: { negativeMarking: { perWrong: 0.5 }, passThresholdPercent: 50 }
};

// Case 1: all correct
let answers = [ { questionId: 'q1', answer: 'c1' }, { questionId: 'q2', answer: ['c3','c4'] } ];
let r = gradeAttempt(exam, answers);
console.log('Case 1 result:', r);
assert(r.totalPossible === 3, 'totalPossible should be 3');
assert(Math.abs(r.totalScore - 3) < 1e-6, 'totalScore should be 3');
assert(r.pass === true, 'should pass');

// Case 2: one wrong in multi
answers = [ { questionId: 'q1', answer: 'c2' }, { questionId: 'q2', answer: ['c3','c5'] } ];
r = gradeAttempt(exam, answers);
console.log('Case 2 result:', r);
// q1 wrong -> 0 minus negative -> 0 (clamped), q2 correctCount=1/2 -> 1 point, wrongCount=1 -> minus 0.5 -> 0.5
assert(r.totalPossible === 3, 'totalPossible should be 3');
assert(Math.abs(r.totalScore - 0.5) < 1e-6, `totalScore should be 0.5 but is ${r.totalScore}`);
assert(r.pass === false, 'should not pass');

console.log('All grader tests passed');
process.exit(0);
