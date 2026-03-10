export type Country = 'indonesia' | 'malaysia' | 'brunei';
export type QuizType = 'multiple_choice' | 'true_false' | 'drag_drop' | 'matching' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string;
  name: string;
  country: Country;
  grade: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  totalLessons: number;
}

export interface SubjectProgress {
  subjectId: string;
  lessonsCompleted: number;
  totalLessons: number;
  masteryScore: number;
  quarterProgress: number[];
  diagnosticCompleted: boolean;
  diagnosticResultId?: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  quarter: number;
  order: number;
  title: string;
  sections: LessonSection[];
  isQuarterlyExam?: boolean;
}

export interface LessonSection {
  id: string;
  content: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  completedAt?: string;
}

export interface BaseQuestion {
  id: string;
  difficulty: Difficulty;
  type: QuizType;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  questionText: string;
  options: string[];
  correctOption: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  questionText: string;
  correctAnswer: boolean;
}

export interface DragDropQuestion extends BaseQuestion {
  type: 'drag_drop';
  instruction: string;
  items: string[];
  correctOrder: number[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  instruction: string;
  leftItems: string[];
  rightItems: string[];
  correctPairs: number[];
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank';
  questionText: string;
  correctAnswer: string;
  hint?: string;
}

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | DragDropQuestion | MatchingQuestion | FillBlankQuestion;

export interface DiagnosticQuestion {
  id: string;
  subjectId: string;
  quarter: number;
  questionOrder: number;
  questionText: string;
  options: string[];
  correctOption: number;
}

export interface DiagnosticResult {
  id: string;
  userId: string;
  subjectId: string;
  q1Score: number;
  q2Score: number;
  q3Score: number;
  q4Score: number;
  overallScore: number;
  completedAt: string;
  attemptNumber: number;
}

export interface QuarterlyExamResult {
  id: string;
  userId: string;
  subjectId: string;
  quarter: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
  attemptNumber: number;
}

export interface LessonQuizResult {
  id: string;
  lessonId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  easyScore: number;
  mediumScore: number;
  hardScore: number;
  completedAt: string;
  attemptNumber: number;
}

export interface ChatMessage {
  id: string;
  lessonId: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: string;
}

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', emoji: '📐', totalLessons: 20 },
  { id: 'science', name: 'Science', emoji: '🔬', totalLessons: 20 },
  { id: 'english', name: 'English', emoji: '📚', totalLessons: 20 },
  { id: 'history', name: 'History', emoji: '🏛️', totalLessons: 20 },
  { id: 'geography', name: 'Geography', emoji: '🌍', totalLessons: 20 },
  { id: 'civics', name: 'Civics', emoji: '⚖️', totalLessons: 20 },
];

export const QUARTER_TOPICS: Record<string, string[]> = {
  math: ['Number Systems & Algebra', 'Geometry & Measurement', 'Statistics & Probability', 'Advanced Applications'],
  science: ['Living Things', 'Matter & Energy', 'Forces & Motion', 'Earth & Space'],
  english: ['Grammar Foundations', 'Reading Comprehension', 'Writing Skills', 'Literature Analysis'],
  history: ['Ancient Civilizations', 'Medieval Period', 'Modern Era', 'Contemporary History'],
  geography: ['Physical Geography', 'Human Geography', 'Regional Studies', 'Environmental Issues'],
  civics: ['Government Structure', 'Rights & Responsibilities', 'Democracy & Citizenship', 'Global Citizenship'],
};

export function getCurriculumName(country: Country): string {
  switch (country) {
    case 'indonesia': return 'Kurikulum Merdeka';
    case 'malaysia': return 'KSSM Curriculum';
    case 'brunei': return 'SPN21 Curriculum';
  }
}

export function getCountryClass(country: Country): string {
  return `country-${country}`;
}