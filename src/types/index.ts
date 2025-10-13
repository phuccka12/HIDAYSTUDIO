export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'reading' | 'writing' | 'listening' | 'speaking';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'writing' | 'listening' | 'speaking' | 'full';
  duration: number; // in minutes
  questions: Question[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'multi' | 'essay' | 'audio' | 'fill' | 'true_false' | string;
  text: string;
  prompt?: string;
  choices?: Choice[];
  points?: number;
}

export interface Choice {
  id: string;
  text: string;
}

export interface Section {
  id: string;
  title?: string;
  instructions?: string;
  passage?: string;
  mediaRefs?: any[];
  questions: Question[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  sections: Section[];
  settings?: any;
}

export interface Answer {
  questionId: string;
  answer: any;
}

export interface Attempt {
  id: string;
  examId: string;
  userId?: string;
  startedAt?: string;
  expiresAt?: string;
  status?: 'in_progress' | 'submitted' | 'graded' | 'expired';
  answers?: Answer[];
  order?: string[];
  score?: number;
  details?: any;
  exam?: Exam;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  score: number;
  maxScore: number;
  answers: Answer[];
  completedAt: string;
}
// NOTE: a different "result" answer shape (isCorrect/points) can be modeled separately if needed

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  lessons: string[]; // lesson IDs
  tests: string[]; // test IDs
  progress: number; // 0-100
  estimatedDuration: number; // in weeks
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  title: string;
  questions: SurveyQuestion[];
  isActive: boolean;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'scale';
  options?: string[];
  required: boolean;
}

export interface SurveyResponse {
  id: string;
  userId: string;
  surveyId: string;
  answers: { [questionId: string]: string | string[] | number };
  completedAt: string;
}