/**
 * QuarterlyExamLesson
 *
 * One lesson's data passed to QuarterlyExamService.generateExam().
 * The service generates 5 questions per lesson using this content.
 *
 * SCHEMA SOURCES
 *   lessons.title    → title
 *   lessons.sections → content  (sections joined as plain text after
 *                                LessonMaterialService has populated them;
 *                                the quarterly exam is gated behind lesson
 *                                completion so sections are always present)
 *
 * HOW TO BUILD content
 *   lesson.sections.map((s: { content: string }) => s.content).join('\n')
 */
export interface QuarterlyExamLesson {
  title:   string;  // lessons.title
  content: string;  // lessons.sections joined as plain text
}

/**
 * QuarterlyExamInput
 *
 * The data shape passed into QuarterlyExamService.generateExam().
 * The service loops over `lessons` and for each lesson calls the exam prompt
 * 5 times (one question per invoke), accumulating all questions into a single
 * QuizQuestion[] returned to the screen.
 *
 * SCHEMA SOURCES
 *   subjects.name        → subjectName
 *   subjects.q{n}_topic  → topic     (quarter-level topic for context)
 *   lessons (filtered)   → lessons   (only non-exam lessons in this quarter)
 *   profiles.grade       → grade
 *   profiles.country     → country
 *
 * UI
 *   Screen : QuarterlyExam.tsx
 *   Trigger: student taps "Start Exam"; gated by dbQuarterlyExamUnlocked
 *            (all non-exam lessons in the quarter must be completed first,
 *             which guarantees lessons.sections is populated for each lesson)
 *
 * HOW TO BUILD IT
 *   const subject      = await dbGetSubjectById(subjectId);
 *   const allLessons   = await dbGetLessonsBySubject(subjectId);
 *   const qLessons     = allLessons.filter(l => l.quarter === quarter && !l.isQuarterlyExam);
 *   const topicKey     = `q${quarter}Topic` as keyof Subject;
 *
 *   const input: QuarterlyExamInput = {
 *     subjectName: subject.name,
 *     quarter,
 *     topic:   subject[topicKey] as string,
 *     lessons: qLessons.map(l => ({
 *       title:   l.title,
 *       content: l.sections.map((s: { content: string }) => s.content).join('\n'),
 *     })),
 *     grade:   profile.grade,
 *     country: profile.country,
 *   };
 *
 * TOTAL QUESTIONS
 *   lessons.length × 5  (e.g. 4 lessons → 20 questions)
 *   QuarterlyExam.tsx should show a loading indicator while the service
 *   streams questions in, or show all at once after generation completes.
 */
export interface QuarterlyExamInput {
  subjectName: string;                // subjects.name
  quarter:     number;                // 1 | 2 | 3 | 4
  topic:       string;                // subjects.q{n}_topic — overall context
  lessons:     QuarterlyExamLesson[]; // per-lesson title + sections content
  grade:       number;                // 7–12  — from profiles.grade
  country:     string;                // "indonesia" | "malaysia" | "brunei"
}