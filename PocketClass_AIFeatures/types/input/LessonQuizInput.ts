/**
 * LessonQuizInput
 *
 * The data shape passed into LessonQuizService.generateQuiz().
 *
 * WHERE IT COMES FROM:
 *   LessonView.tsx builds this object inside startQuiz():
 *     - lessonTitle → lesson.title
 *     - content     → subject.q{n}Content
 *                     (the raw curriculum text for this lesson's quarter,
 *                      read from subjects — NOT from lesson.sections)
 *     - grade       → profile.grade
 *     - country     → profile.country
 *
 * WHY content COMES FROM subjects, NOT lesson.sections:
 *   subjects.q{n}_content is the seeded, immutable curriculum source.
 *   Quiz questions must be anchored to what the student actually studied —
 *   the curriculum text in subjects is that anchor.  lesson.sections may
 *   hold AI-generated summaries which are derivative; basing a quiz on a
 *   summary risks losing detail and introducing drift from the source.
 *
 * HOW TO BUILD IT:
 *   const subject = await dbGetSubjectById(lesson.subjectId);
 *   const contentKey = `q${lesson.quarter}Content` as keyof Subject;
 *
 *   const input: LessonQuizInput = {
 *     lessonTitle: lesson.title,
 *     content:     subject[contentKey] as string,
 *     grade:       profile.grade,
 *     country:     profile.country,
 *   };
 */
export interface Question {
  question: string;
  answer: string;
}

// Define the interface for the quiz
export interface LessonQuizInput {
  grade: number;
  country: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_number: number;
  questions: Question[];
}
