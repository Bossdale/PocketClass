/**
 * lib/types.ts
 *
 * Canonical TypeScript types for every entity in the app.
 * These types are the contract between the database layer (lib/database.ts),
 * the store (lib/store.ts), and the UI screens.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────────────
 *   Every field here is derived from the schema column names mapped through
 *   the camelCase conversion in lib/database.ts.  If the schema changes,
 *   update database.ts first, then mirror the change here.
 *
 * ── NAMING CONVENTION ────────────────────────────────────────────────────────
 *   schema column  →  TS field (camelCase)
 *   user_id        →  userId
 *   subject_id     →  subjectId
 *   completed_at   →  completedAt
 *   is_quarterly_exam → isQuarterlyExam
 *   q1_score       →  q1Score    (quarter scores keep their prefix)
 *
 * ── WHO IMPORTS FROM HERE ────────────────────────────────────────────────────
 *   lib/database.ts   — all CRUD helpers use these as parameter / return types
 *   lib/store.ts      — all store functions return these types
 *   app/ screens      — never import from database.ts directly; always via store
 */


// =============================================================================
// 1. PROFILE
//    Single row.  Created during onboarding.
//    profile.grade drives which subjects the student sees throughout the app.
// =============================================================================

export type Country = 'indonesia' | 'malaysia' | 'brunei';

export interface Profile {
  id:        string;
  name:      string;
  country:   Country;
  grade:     number;   // 7–12; used as the filter key for subjects
  createdAt: string;   // ISO-8601
}


// =============================================================================
// 2. SUBJECT
//    Static reference data seeded once at first-launch.
//    Grade-scoped: "Mathematics" Grade 7 and Grade 8 are two separate rows.
//
//    q{1-4}_topic / q{1-4}_content are the sole AI generation source:
//      DiagnosticQuizService  → reads q{n}Topic + q{n}Content
//      LessonMaterialService  → reads q{n}Content as the `lecture` field
//      LessonQuizService      → reads q{n}Content as the `content` field
//      QuarterlyExamService   → reads q{n}Topic + q{n}Content per lesson
// =============================================================================

export interface Subject {
  id:          string;
  grade:       number;   // 7–12; matches profiles.grade — the key filter field
  name:        string;
  emoji:       string;
  totalLessons: number;
  description: string;

  // Static curriculum content — seeded, never written to after first-launch
  q1Topic:   string;  q1Content: string;
  q2Topic:   string;  q2Content: string;
  q3Topic:   string;  q3Content: string;
  q4Topic:   string;  q4Content: string;
}


// =============================================================================
// 3. SUBJECT PROGRESS
//    One row per subject.  Tracks overall mastery and lesson completion.
//    diagnostic_completed flips to true when the one-time diagnostic is saved.
//
//    quarterProgress is a DERIVED field — NOT stored in the DB.
//    Computed by store.ts from lesson_quiz_results per quarter.
//    Used by SubjectView to render the per-quarter progress bars.
// =============================================================================

export interface SubjectProgress {
  id:                  string;
  subjectId:           string;
  masteryScore:        number;           // 0–100
  lessonsCompleted:    number;
  totalLessons:        number;
  diagnosticCompleted: boolean;

  // Derived in store.ts — not persisted to DB
  // quarterProgress[0] = Q1 average quiz score, [1] = Q2, etc.
  quarterProgress?: number[];
}


// =============================================================================
// 4. LESSON
//    Seeded content rows belonging to one subject (and therefore one grade).
//    Grade is NOT stored here — always derived from subjects.grade via JOIN.
//    sections is a JSON array: [{ content: string }, ...]
//      - Populated by LessonMaterialService when the student first opens the lesson.
//      - Read back by LessonView.tsx to render 3-page lesson cards.
// =============================================================================

export interface LessonSection {
  content: string;   // markdown string rendered by renderContent() in LessonView
}

export interface Lesson {
  id:              string;
  subjectId:       string;
  title:           string;
  order:           number;             // order_num — 1-based, unique per subject
  quarter:         number;             // 1–4
  isQuarterlyExam: boolean;            // true for the one exam-row per quarter
  sections:        LessonSection[];    // parsed from JSON; [] until AI populates it
}


// =============================================================================
// 5. LESSON PROGRESS
//    One row per lesson.  Created when the student first attempts the quiz.
//    quiz_score is null until the first quiz attempt completes.
// =============================================================================

export interface LessonProgress {
  id:          string;
  lessonId:    string;
  completed:   boolean;
  quizScore?:  number;   // undefined until first quiz attempt (maps to NULL in DB)
  completedAt?: string;  // undefined until lesson finished (ISO-8601)
}


// =============================================================================
// 6. DIAGNOSTIC RESULT
//    ★ EXACTLY ONE row per (user, subject) — no attempt_number field.
//    UNIQUE (user_id, subject_id) in the DB; INSERT OR IGNORE on write.
//    q1Score–q4Score are the per-quarter scores from the diagnostic test.
//    overallScore is the average; computed by DiagnosticTest.tsx before saving.
//
//    Used by:
//      DiagnosticTest.tsx     → writes result after all 4 quarters complete
//      StudyPlanService       → reads q{1-4}Score to generate the study plan
//      DiagnosticResultCard   → displays scores + study plan
//      store.getDiagnosticResult(subjectId) → returns DiagnosticResult | null
// =============================================================================

export interface DiagnosticResult {
  id:           string;
  userId:       string;
  subjectId:    string;
  q1Score:      number;   // 0–100
  q2Score:      number;
  q3Score:      number;
  q4Score:      number;
  overallScore: number;   // average of q1–q4
  completedAt:  string;   // ISO-8601
}


// =============================================================================
// 7. QUARTERLY EXAM RESULT
//    One row per attempt — students may retake.
//    Scores broken down by difficulty tier for the stars display:
//      3★ ≥ 80%  |  2★ ≥ 50%  |  1★ otherwise
// =============================================================================

export interface QuarterlyExamResult {
  id:             string;
  userId:         string;
  subjectId:      string;
  quarter:        number;   // 1–4
  score:          number;   // total correct answers
  totalQuestions: number;
  easyScore:      number;   // correct answers at easy difficulty
  mediumScore:    number;
  hardScore:      number;
  completedAt:    string;   // ISO-8601
  attemptNumber:  number;   // 1-based; increments per retake
}


// =============================================================================
// 8. LESSON QUIZ RESULT
//    One row per attempt — students may retake.
//    Used by Dashboard AssessTab (all results) and LessonView (per-lesson history).
// =============================================================================

export interface LessonQuizResult {
  id:             string;
  lessonId:       string;
  userId:         string;
  score:          number;   // 0–100 percentage
  totalQuestions: number;
  easyScore:      number;
  mediumScore:    number;
  hardScore:      number;
  completedAt:    string;   // ISO-8601
  attemptNumber:  number;   // 1-based; increments per retake
}


// =============================================================================
// 9. CHAT MESSAGE
//    One row per turn in the AI tutor conversation, scoped to a lesson.
//    role 'user' = student message; 'tutor' = AI reply.
//    Both turns are saved after each exchange in AITutor.tsx.
// =============================================================================

export interface ChatMessage {
  id:        string;
  lessonId:  string;
  role:      'user' | 'tutor';
  content:   string;
  timestamp: string;   // ISO-8601; ordered ASC for conversation display
}