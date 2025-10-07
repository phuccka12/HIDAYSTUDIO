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
  type: 'multiple-choice' | 'essay' | 'audio-response' | 'fill-blank';
  content: string;
  options?: string[]; // for multiple choice
  correctAnswer?: string;
  points: number;
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

export interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
}

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