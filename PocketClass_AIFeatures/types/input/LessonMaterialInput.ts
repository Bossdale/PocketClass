/**
 * LessonMaterialInput
 *
 * The data shape passed into LessonMaterialService.generateMaterial().
 *
 * WHERE IT COMES FROM:
 *   LessonView.tsx builds this object before calling the service:
 *     - topic    → lesson.title
 *                  (the specific lesson title within the quarter)
 *     - lecture  → subject.q{n}Content
 *                  (the raw curriculum text for this lesson's quarter,
 *                   read from subjects — NOT from lesson.sections)
 *
 * WHY lecture COMES FROM subjects, NOT lesson.sections:
 *   subjects.q{n}_content is the seeded, immutable curriculum source.
 *   lesson.sections stores AI-generated output — it starts empty and is
 *   only populated AFTER LessonMaterialService runs.  Using subjects as
 *   the source ensures the AI always works from the authoritative content
 *   rather than reformatting its own previous output.
 *
 * HOW TO BUILD IT:
 *   const subject = await dbGetSubjectById(lesson.subjectId);
 *   const contentKey = `q${lesson.quarter}Content` as keyof Subject;
 *
 *   const input: LessonMaterialInput = {
 *     topic:   lesson.title,
 *     lecture: subject[contentKey] as string,
 *   };
 */
export interface LessonMaterialInput {
  topic:   string;  // e.g. "The Human Digestive System"  — lesson.title
  lecture: string;  // raw quarter curriculum text        — subjects.q{n}_content
}
