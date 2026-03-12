import { getLessonQuizResults, getQuarterlyExamResults } from './store';
import { SUBJECTS } from './types';

export async function recomputeMastery(subjectId: string): Promise<number> {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return 0;
  
  const allQuizResults = await getLessonQuizResults();
  const subjectQuizResults = allQuizResults.filter(r => r.lessonId.startsWith(subjectId));
  
  const latestPerLesson = new Map<string, number>();
  for (const r of subjectQuizResults) {
    const existing = latestPerLesson.get(r.lessonId);
    if (existing === undefined || r.attemptNumber > existing) {
      latestPerLesson.set(r.lessonId, r.score);
    }
  }
  const quizScores = Array.from(latestPerLesson.values());
  const avgQuizScore = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0;

  const allExamResults = await getQuarterlyExamResults(subjectId);
  const latestPerQuarter = new Map<number, number>();
  for (const r of allExamResults) {
    const existing = latestPerQuarter.get(r.quarter);
    if (existing === undefined || r.attemptNumber > (latestPerQuarter.get(r.quarter) || 0)) {
      latestPerQuarter.set(r.quarter, Math.round((r.score / r.totalQuestions) * 100));
    }
  }
  const examScores = Array.from(latestPerQuarter.values());
  const avgExamScore = examScores.length > 0 ? examScores.reduce((a, b) => a + b, 0) / examScores.length : 0;

  const hasAnyData = quizScores.length > 0 || examScores.length > 0;
  if (!hasAnyData) return 0;

  let totalWeight = 0;
  let weightedSum = 0;
  // Adjusted weights: Quizzes 40% and Exams 60%
  if (quizScores.length > 0) { totalWeight += 40; weightedSum += avgQuizScore * 40; }
  if (examScores.length > 0) { totalWeight += 60; weightedSum += avgExamScore * 60; }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}