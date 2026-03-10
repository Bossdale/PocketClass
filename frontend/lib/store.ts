import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type Profile, type SubjectProgress, type LessonProgress, type Lesson, type LessonSection,
  type ChatMessage, type DiagnosticResult, type QuarterlyExamResult, type LessonQuizResult,
  SUBJECTS, QUARTER_TOPICS
} from './types';
import { recomputeMastery } from './masteryService';

// AsyncStorage keys
const KEYS = {
  profile: 'pocketclass_profile',
  subjectProgress: 'pocketclass_subject_progress',
  lessonProgress: 'pocketclass_lesson_progress',
  chatHistory: 'pocketclass_chat_history',
  diagnosticResults: 'pocketclass_diagnostic_results',
  lessonQuizResults: 'pocketclass_lesson_quiz_results',
  quarterlyExamResults: 'pocketclass_quarterly_exam_results',
};

// Profile
export async function getProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// Subject Progress
export async function getSubjectProgress(): Promise<SubjectProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.subjectProgress);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
export async function saveSubjectProgress(progress: SubjectProgress[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.subjectProgress, JSON.stringify(progress));
}
export async function initializeSubjectProgress(): Promise<void> {
  const existing = await getSubjectProgress();
  if (existing.length > 0) return;
  const progress: SubjectProgress[] = SUBJECTS.map(s => ({
    subjectId: s.id,
    lessonsCompleted: 0,
    totalLessons: s.totalLessons,
    masteryScore: 0,
    quarterProgress: [0, 0, 0, 0],
    diagnosticCompleted: false,
  }));
  await saveSubjectProgress(progress);
}

// Lesson Progress
export async function getLessonProgress(): Promise<LessonProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.lessonProgress);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
export async function saveLessonProgress(progress: LessonProgress[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.lessonProgress, JSON.stringify(progress));
}
export async function completeLesson(lessonId: string, quizScore?: number): Promise<void> {
  const all = await getLessonProgress();
  const existing = all.find(lp => lp.lessonId === lessonId);
  if (existing) {
    existing.completed = true;
    existing.quizScore = quizScore ?? existing.quizScore;
    existing.completedAt = new Date().toISOString();
  } else {
    all.push({ lessonId, completed: true, quizScore, completedAt: new Date().toISOString() });
  }
  await saveLessonProgress(all);

  // Update subject progress
  const subjectId = lessonId.split('-')[0];
  const lessons = getLessonsBySubject(subjectId).filter(l => !l.isQuarterlyExam);
  const completedCount = all.filter(lp => lp.completed && lessons.some(l => l.id === lp.lessonId)).length;
  const sp = await getSubjectProgress();
  const subjectProg = sp.find(s => s.subjectId === subjectId);
  
  if (subjectProg) {
    subjectProg.lessonsCompleted = completedCount;
    // Update quarter progress
    for (let q = 1; q <= 4; q++) {
      const qLessons = lessons.filter(l => l.quarter === q);
      const qCompleted = all.filter(lp => lp.completed && qLessons.some(l => l.id === lp.lessonId)).length;
      subjectProg.quarterProgress[q - 1] = qLessons.length > 0 ? Math.round((qCompleted / qLessons.length) * 100) : 0;
    }
    // We must await recomputeMastery because masteryService will now be async too!
    subjectProg.masteryScore = await recomputeMastery(subjectId);
    await saveSubjectProgress(sp);
  }
}

// Chat History
export async function getChatHistory(lessonId: string): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.chatHistory);
    const all: ChatMessage[] = raw ? JSON.parse(raw) : [];
    return all.filter(m => m.lessonId === lessonId);
  } catch (e) {
    return [];
  }
}
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.chatHistory);
  const all: ChatMessage[] = raw ? JSON.parse(raw) : [];
  all.push(message);
  await AsyncStorage.setItem(KEYS.chatHistory, JSON.stringify(all));
}

// Diagnostic Results
export async function getDiagnosticResults(subjectId?: string): Promise<DiagnosticResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.diagnosticResults);
    const all: DiagnosticResult[] = raw ? JSON.parse(raw) : [];
    return subjectId ? all.filter(r => r.subjectId === subjectId) : all;
  } catch (e) {
    return [];
  }
}
export async function saveDiagnosticResult(result: DiagnosticResult): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.diagnosticResults);
  const all: DiagnosticResult[] = raw ? JSON.parse(raw) : [];
  all.push(result);
  await AsyncStorage.setItem(KEYS.diagnosticResults, JSON.stringify(all));

  // Mark diagnostic completed
  const sp = await getSubjectProgress();
  const subjectProg = sp.find(s => s.subjectId === result.subjectId);
  if (subjectProg) {
    subjectProg.diagnosticCompleted = true;
    subjectProg.diagnosticResultId = result.id;
    subjectProg.masteryScore = await recomputeMastery(result.subjectId);
    await saveSubjectProgress(sp);
  }
}

// Lesson Quiz Results
export async function getLessonQuizResults(lessonId?: string): Promise<LessonQuizResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.lessonQuizResults);
    const all: LessonQuizResult[] = raw ? JSON.parse(raw) : [];
    return lessonId ? all.filter(r => r.lessonId === lessonId) : all;
  } catch (e) {
    return [];
  }
}
export async function saveLessonQuizResult(result: LessonQuizResult): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.lessonQuizResults);
  const all: LessonQuizResult[] = raw ? JSON.parse(raw) : [];
  all.push(result);
  await AsyncStorage.setItem(KEYS.lessonQuizResults, JSON.stringify(all));
}

// Quarterly Exam Results
export async function getQuarterlyExamResults(subjectId?: string, quarter?: number): Promise<QuarterlyExamResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.quarterlyExamResults);
    const all: QuarterlyExamResult[] = raw ? JSON.parse(raw) : [];
    let filtered = all;
    if (subjectId) filtered = filtered.filter(r => r.subjectId === subjectId);
    if (quarter) filtered = filtered.filter(r => r.quarter === quarter);
    return filtered;
  } catch (e) {
    return [];
  }
}
export async function saveQuarterlyExamResult(result: QuarterlyExamResult): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.quarterlyExamResults);
  const all: QuarterlyExamResult[] = raw ? JSON.parse(raw) : [];
  all.push(result);
  await AsyncStorage.setItem(KEYS.quarterlyExamResults, JSON.stringify(all));

  const sp = await getSubjectProgress();
  const subjectProg = sp.find(s => s.subjectId === result.subjectId);
  if (subjectProg) {
    subjectProg.masteryScore = await recomputeMastery(result.subjectId);
    await saveSubjectProgress(sp);
  }
}

// Quarterly Exam Unlocked
export async function quarterlyExamUnlocked(subjectId: string, quarter: number): Promise<boolean> {
  const lessons = getLessonsBySubject(subjectId).filter(l => l.quarter === quarter && !l.isQuarterlyExam);
  const lp = await getLessonProgress();
  return lessons.every(l => lp.some(p => p.lessonId === l.id && p.completed));
}

// Lesson generation (These remain synchronous because they don't hit the database)
const LESSON_SUBTOPICS: Record<string, string[][]> = {
  math: [
    ['Introduction to Integers', 'Operations with Integers', 'Introduction to Algebra', 'Linear Equations', 'Word Problems'],
    ['Basic Shapes & Properties', 'Angles & Triangles', 'Perimeter & Area', 'Volume & Surface Area', 'Coordinate Geometry'],
    ['Data Collection & Organization', 'Mean, Median & Mode', 'Probability Basics', 'Graphing Data', 'Statistical Analysis'],
    ['Quadratic Equations', 'Functions & Graphs', 'Trigonometry Basics', 'Real-World Modeling', 'Review & Integration'],
  ],
  science: [
    ['Cells & Organization', 'Plant Biology', 'Animal Classification', 'Ecosystems', 'Human Body Systems'],
    ['States of Matter', 'Chemical Reactions', 'Energy Forms', 'Heat & Temperature', 'Electricity Basics'],
    ['Newton\'s Laws', 'Gravity & Weight', 'Friction & Resistance', 'Simple Machines', 'Work & Power'],
    ['Solar System', 'Earth\'s Structure', 'Weather & Climate', 'Natural Resources', 'Space Exploration'],
  ],
  english: [
    ['Parts of Speech', 'Sentence Structure', 'Tenses & Conjugation', 'Punctuation Rules', 'Common Errors'],
    ['Main Ideas & Details', 'Inference & Context', 'Non-Fiction Texts', 'Poetry Analysis', 'Critical Reading'],
    ['Paragraph Writing', 'Essay Structure', 'Persuasive Writing', 'Narrative Writing', 'Editing & Revision'],
    ['Short Stories', 'Novel Study', 'Drama & Theatre', 'Poetry Appreciation', 'Comparative Analysis'],
  ],
  history: [
    ['Early Civilizations', 'Ancient Egypt', 'Greek Civilization', 'Roman Empire', 'Ancient Asia'],
    ['Feudal Systems', 'The Crusades', 'Renaissance', 'Exploration Age', 'Trade Routes'],
    ['Industrial Revolution', 'World War I', 'World War II', 'Independence Movements', 'Cold War'],
    ['Globalization', 'Technology Revolution', 'Modern Conflicts', 'Social Movements', 'Future Challenges'],
  ],
  geography: [
    ['Landforms & Terrain', 'Water Systems', 'Climate Zones', 'Natural Disasters', 'Map Skills'],
    ['Population & Migration', 'Urbanization', 'Culture & Society', 'Economic Activities', 'Transportation'],
    ['Southeast Asia', 'East Asia', 'South Asia', 'Middle East', 'Global Connections'],
    ['Climate Change', 'Deforestation', 'Water Pollution', 'Sustainable Development', 'Conservation'],
  ],
  civics: [
    ['Branches of Government', 'Constitution Basics', 'Local Government', 'National Government', 'Law & Justice'],
    ['Human Rights', 'Civic Duties', 'Freedom of Expression', 'Right to Education', 'Social Justice'],
    ['Democratic Principles', 'Elections & Voting', 'Political Parties', 'Media & Democracy', 'Active Citizenship'],
    ['United Nations', 'International Relations', 'Global Issues', 'Peace & Cooperation', 'Your Role in the World'],
  ],
};

function generateLessonContent(subjectId: string, quarter: number, order: number, subtopic: string): LessonSection[] {
  const topic = QUARTER_TOPICS[subjectId]?.[quarter - 1] || 'General Topic';
  return [
    {
      id: `${subjectId}-q${quarter}-l${order}-s1`,
      content: `# Introduction to ${subtopic}\n\nWelcome to this lesson on ${subtopic}! This is part of our ${topic} unit. Today we'll explore the fundamental concepts and build a strong understanding.\n\n## Learning Objectives\n\n- Understand the key principles of ${subtopic}\n- Apply concepts to real-world scenarios\n- Build problem-solving skills related to ${subtopic}\n\n> 💡 Tip: Take notes as you read — it helps reinforce learning!`,
    },
    {
      id: `${subjectId}-q${quarter}-l${order}-s2`,
      content: `# Key Concepts\n\n## Understanding ${subtopic}\n\n**Core Principle**: ${subtopic} is a foundational concept that connects to many areas of ${SUBJECTS.find(s => s.id === subjectId)?.name || 'study'}.\n\n**Key Terms**:\n- **Concept A**: The first important idea to grasp\n- **Concept B**: How it relates to everyday applications\n- **Concept C**: Advanced connections to other topics\n\n> 📝 Important: These concepts will appear in your quiz, so make sure you understand each one!`,
    },
    {
      id: `${subjectId}-q${quarter}-l${order}-s3`,
      content: `# Practical Applications\n\n## Real-World Examples\n\n1. **Daily Life**: ${subtopic} appears in everyday situations around us\n2. **Career Connections**: Many professions use these principles\n3. **Problem Solving**: Apply what you've learned to solve challenges\n\n## Summary\n\n${subtopic} is an essential part of ${topic}. By understanding these concepts, you're building a strong foundation for future learning.\n\n> 🎯 You're ready for the quiz — you've got this!`,
    },
  ];
}

export function getLessonsBySubject(subjectId: string): Lesson[] {
  const subtopics = LESSON_SUBTOPICS[subjectId];
  if (!subtopics) return [];

  const lessons: Lesson[] = [];
  for (let q = 1; q <= 4; q++) {
    const quarterSubtopics = subtopics[q - 1];
    for (let o = 1; o <= 5; o++) {
      const subtopic = quarterSubtopics[o - 1];
      const title = `${QUARTER_TOPICS[subjectId][q - 1]} — ${subtopic}`;
      lessons.push({
        id: `${subjectId}-q${q}-l${o}`,
        subjectId,
        quarter: q,
        order: o,
        title,
        sections: generateLessonContent(subjectId, q, o, subtopic),
      });
    }
    lessons.push({
      id: `${subjectId}-q${q}-exam`,
      subjectId,
      quarter: q,
      order: 6,
      title: `Quarter ${q} Exam`,
      sections: [],
      isQuarterlyExam: true,
    });
  }
  return lessons;
}

export function getLessonById(lessonId: string): Lesson | undefined {
  const parts = lessonId.split('-');
  const subjectId = parts[0];
  const lessons = getLessonsBySubject(subjectId);
  return lessons.find(l => l.id === lessonId);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}