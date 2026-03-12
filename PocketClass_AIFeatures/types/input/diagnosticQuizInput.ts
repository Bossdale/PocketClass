/**
 * DiagnosticQuizInput
 *
 * The data shape passed into DiagnosticQuizService.generateQuestions().
 *
 * WHERE IT COMES FROM:
 *   DiagnosticTest.tsx (via useDiagnostic hook) builds this from:
 *     - subjectName     → subject.name          (from DB)
 *     - quarter         → the current quarter being tested (1–4)
 *     - quarterTopic    → subject.q{n}Topic      (from DB — e.g. "Algebra Basics")
 *     - quarterContent  → subject.q{n}Content    (from DB — the raw curriculum text)
 *     - grade / country → profile.grade / profile.country (from DB)
 *
 * WHY quarterContent:
 *   The AI generates questions that are GROUNDED IN the actual curriculum text
 *   stored in subjects.q{n}_content.  Without it, the model invents questions
 *   from general knowledge which may not align with what the student will study.
 *   Passing the content ensures every diagnostic question is directly traceable
 *   to a specific piece of the seeded curriculum.
 *
 * HOW TO BUILD IT:
 *   const subject = await dbGetSubjectById(subjectId);
 *   const topicKey    = `q${quarter}Topic`    as keyof Subject;
 *   const contentKey  = `q${quarter}Content`  as keyof Subject;
 *
 *   const input: DiagnosticQuizInput = {
 *     subjectName:    subject.name,
 *     quarter,
 *     quarterTopic:   subject[topicKey]   as string,
 *     quarterContent: subject[contentKey] as string,
 *     grade:          profile.grade,
 *     country:        profile.country,
 *   };
 */
export interface DiagnosticQuizInput {
  subjectName:    string;   // e.g. "Mathematics"
  quarter:        number;   // 1 | 2 | 3 | 4
  quarterTopic:   string;   // e.g. "Algebra Basics"  — subjects.q{n}_topic
  quarterContent: string;   // raw curriculum text    — subjects.q{n}_content
  grade:          number;   // 7–12
  country:        string;   // "indonesia" | "malaysia" | "brunei"
}