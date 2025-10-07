import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours} giờ ${remainingMinutes} phút`
    : `${hours} giờ`;
}

export function calculateScore(answers: any[], totalQuestions: number) {
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

export function getIELTSBand(score: number) {
  if (score >= 90) return '9.0';
  if (score >= 85) return '8.5';
  if (score >= 80) return '8.0';
  if (score >= 75) return '7.5';
  if (score >= 70) return '7.0';
  if (score >= 65) return '6.5';
  if (score >= 60) return '6.0';
  if (score >= 55) return '5.5';
  if (score >= 50) return '5.0';
  if (score >= 45) return '4.5';
  if (score >= 40) return '4.0';
  return '3.5';
}

export function generateLearningPath(surveyAnswers: any) {
  // Logic để tạo lộ trình học dựa trên kết quả khảo sát
  // Đây là placeholder, sẽ được implement chi tiết sau
  const targetBand = surveyAnswers.targetBand || '6.5';
  const timeAvailable = surveyAnswers.timeAvailable || 'moderate';
  const weakAreas = surveyAnswers.weakAreas || [];
  
  return {
    title: `Lộ trình đạt IELTS ${targetBand}`,
    estimatedDuration: timeAvailable === 'intensive' ? 8 : timeAvailable === 'moderate' ? 12 : 16,
    focusAreas: weakAreas,
    recommendedLessons: [],
    recommendedTests: []
  };
}