/**
 * PocketClass — lib/database.ts  (v2)
 *
 * SQLite database layer using expo-sqlite v14+ (async API).
 *
 * v2 changes:
 *  ★ subjects now carry a `grade` field (grade-scoped subjects).
 *  ★ diagnostic_results is unique per (user_id, subject_id) — one per profile.
 *    - dbSaveDiagnosticResult()  uses INSERT OR IGNORE (no duplicate writes).
 *    - dbGetDiagnosticResult()   returns a single result | null  (not an array).
 *    - DiagnosticResult type no longer has attemptNumber.
 *  ★ dbGetSubjectsByGrade()  replaces dbGetSubjects() as the main query — it
 *    filters subjects to the student's grade level.
 *
 * Exports:
 *   getDb()    – opens / returns the singleton DB connection
 *   initDb()   – runs the full schema; safe to call on every app launch
 *   All CRUD helpers consumed by lib/store.ts
 *
 * Usage:
 *   import { initDb } from '@/lib/database';
 *   await initDb();   // call once in app/_layout.tsx before rendering
 */

import * as SQLite from 'expo-sqlite';
import type {
  Profile,
  Subject,
  SubjectProgress,
  Lesson,
  LessonProgress,
  DiagnosticResult,
  QuarterlyExamResult,
  LessonQuizResult,
  ChatMessage,
} from './types';

// ─── Singleton connection ────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the open DB connection.
 * Opens on first call with WAL mode + foreign-key enforcement.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('pocketclass.db');
    await _db.execAsync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous  = NORMAL;
    `);
  }
  return _db;
}

// ─── Schema Initialization ───────────────────────────────────────────────────

/**
 * Creates all tables, indexes and views if they don't already exist.
 * Safe to call on every app launch — all statements use IF NOT EXISTS.
 */
export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`

    -- ── 1. PROFILES ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS profiles (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      country    TEXT    NOT NULL
                   CHECK (country IN ('indonesia','malaysia','brunei')),
      grade      INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 12),
      created_at TEXT    NOT NULL
    );

    -- ── 2. SUBJECTS ★ grade-scoped + static curriculum content ───────────────
    --   Seeded once at first-launch, never modified by the app.
    --   q{1-4}_topic / q{1-4}_content are the sole source of truth for all
    --   AI generation: diagnostic quizzes, lesson material, lesson quizzes,
    --   and quarterly exams all read from these fields.
    CREATE TABLE IF NOT EXISTS subjects (
      id            TEXT    PRIMARY KEY,
      grade         INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 12),
      name          TEXT    NOT NULL,
      emoji         TEXT    NOT NULL,
      total_lessons INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
      description   TEXT    NOT NULL DEFAULT '',
      q1_topic      TEXT    NOT NULL DEFAULT '',
      q1_content    TEXT    NOT NULL DEFAULT '',
      q2_topic      TEXT    NOT NULL DEFAULT '',
      q2_content    TEXT    NOT NULL DEFAULT '',
      q3_topic      TEXT    NOT NULL DEFAULT '',
      q3_content    TEXT    NOT NULL DEFAULT '',
      q4_topic      TEXT    NOT NULL DEFAULT '',
      q4_content    TEXT    NOT NULL DEFAULT '',
      UNIQUE (name, grade)
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_grade ON subjects (grade);

    -- ── 3. SUBJECT_PROGRESS ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS subject_progress (
      id                   TEXT    PRIMARY KEY,
      subject_id           TEXT    NOT NULL UNIQUE
                                     REFERENCES subjects(id) ON DELETE CASCADE,
      mastery_score        REAL    NOT NULL DEFAULT 0
                                     CHECK (mastery_score BETWEEN 0 AND 100),
      lessons_completed    INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
      total_lessons        INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
      diagnostic_completed INTEGER NOT NULL DEFAULT 0
                                     CHECK (diagnostic_completed IN (0,1))
    );

    -- ── 4. LESSONS ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS lessons (
      id                TEXT    PRIMARY KEY,
      subject_id        TEXT    NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      title             TEXT    NOT NULL,
      order_num         INTEGER NOT NULL CHECK (order_num >= 1),
      quarter           INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
      is_quarterly_exam INTEGER NOT NULL DEFAULT 0 CHECK (is_quarterly_exam IN (0,1)),
      sections          TEXT    NOT NULL DEFAULT '[]',
      UNIQUE (subject_id, order_num)
    );
    CREATE INDEX IF NOT EXISTS idx_lessons_subject_quarter
      ON lessons (subject_id, quarter);

    -- ── 5. LESSON_PROGRESS ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id           TEXT    PRIMARY KEY,
      lesson_id    TEXT    NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
      completed    INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
      quiz_score   REAL    CHECK (quiz_score IS NULL OR quiz_score BETWEEN 0 AND 100),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson
      ON lesson_progress (lesson_id);

    -- ── 6. DIAGNOSTIC_RESULTS ★ one per (user, subject) ──────────────────────
    CREATE TABLE IF NOT EXISTS diagnostic_results (
      id            TEXT    PRIMARY KEY,
      user_id       TEXT    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      subject_id    TEXT    NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      q1_score      REAL    NOT NULL DEFAULT 0 CHECK (q1_score    BETWEEN 0 AND 100),
      q2_score      REAL    NOT NULL DEFAULT 0 CHECK (q2_score    BETWEEN 0 AND 100),
      q3_score      REAL    NOT NULL DEFAULT 0 CHECK (q3_score    BETWEEN 0 AND 100),
      q4_score      REAL    NOT NULL DEFAULT 0 CHECK (q4_score    BETWEEN 0 AND 100),
      overall_score REAL    NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
      completed_at  TEXT    NOT NULL,
      UNIQUE (user_id, subject_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_user_subject
      ON diagnostic_results (user_id, subject_id);

    -- ── 7. QUARTERLY_EXAM_RESULTS ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS quarterly_exam_results (
      id              TEXT    PRIMARY KEY,
      user_id         TEXT    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      subject_id      TEXT    NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      quarter         INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
      score           INTEGER NOT NULL DEFAULT 0   CHECK (score >= 0),
      total_questions INTEGER NOT NULL             CHECK (total_questions > 0),
      easy_score      INTEGER NOT NULL DEFAULT 0   CHECK (easy_score   >= 0),
      medium_score    INTEGER NOT NULL DEFAULT 0   CHECK (medium_score >= 0),
      hard_score      INTEGER NOT NULL DEFAULT 0   CHECK (hard_score   >= 0),
      completed_at    TEXT    NOT NULL,
      attempt_number  INTEGER NOT NULL DEFAULT 1   CHECK (attempt_number >= 1)
    );
    CREATE INDEX IF NOT EXISTS idx_quarterly_exam_subject_quarter
      ON quarterly_exam_results (subject_id, quarter, completed_at DESC);

    -- ── 8. LESSON_QUIZ_RESULTS ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS lesson_quiz_results (
      id              TEXT    PRIMARY KEY,
      lesson_id       TEXT    NOT NULL REFERENCES lessons(id)  ON DELETE CASCADE,
      user_id         TEXT    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      score           REAL    NOT NULL DEFAULT 0  CHECK (score BETWEEN 0 AND 100),
      total_questions INTEGER NOT NULL            CHECK (total_questions > 0),
      easy_score      INTEGER NOT NULL DEFAULT 0  CHECK (easy_score   >= 0),
      medium_score    INTEGER NOT NULL DEFAULT 0  CHECK (medium_score >= 0),
      hard_score      INTEGER NOT NULL DEFAULT 0  CHECK (hard_score   >= 0),
      completed_at    TEXT    NOT NULL,
      attempt_number  INTEGER NOT NULL DEFAULT 1  CHECK (attempt_number >= 1)
    );
    CREATE INDEX IF NOT EXISTS idx_lesson_quiz_results_lesson
      ON lesson_quiz_results (lesson_id, completed_at DESC);

    -- ── 9. CHAT_MESSAGES ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS chat_messages (
      id        TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      role      TEXT NOT NULL CHECK (role IN ('user','tutor')),
      content   TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_lesson
      ON chat_messages (lesson_id, timestamp ASC);

    -- ── VIEWS ─────────────────────────────────────────────────────────────────
    CREATE VIEW IF NOT EXISTS v_subject_grade_summary AS
      SELECT s.id, s.name, s.emoji, s.grade, s.total_lessons,
             sp.mastery_score, sp.lessons_completed, sp.diagnostic_completed,
             CASE WHEN dr.id IS NOT NULL THEN 1 ELSE 0 END AS has_diagnostic_result
      FROM   subjects s
      LEFT   JOIN subject_progress   sp ON sp.subject_id = s.id
      LEFT   JOIN diagnostic_results dr ON dr.subject_id = s.id;

    CREATE VIEW IF NOT EXISTS v_lesson_grade_summary AS
      SELECT l.id AS lesson_id, l.title, l.quarter, l.order_num,
             l.is_quarterly_exam, s.grade, s.id AS subject_id, s.name AS subject_name,
             lp.completed, lp.quiz_score
      FROM   lessons l
      JOIN   subjects        s  ON s.id  = l.subject_id
      LEFT   JOIN lesson_progress lp ON lp.lesson_id = l.id;

  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the single stored profile, or null before onboarding. */
export async function dbGetProfile(): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string; name: string; country: string; grade: number; created_at: string;
  }>('SELECT * FROM profiles LIMIT 1');
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    country: row.country as any,
    grade: row.grade,
    createdAt: row.created_at,
  };
}

/** Inserts or replaces the student's profile (onboarding). */
export async function dbSaveProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO profiles (id, name, country, grade, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [profile.id, profile.name, profile.country, profile.grade, profile.createdAt],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS  ★ grade-scoped
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ★ Returns only the subjects that match the student's grade level.
 * This is the primary query used throughout the app.
 */
export async function dbGetSubjectsByGrade(grade: number): Promise<Subject[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SubjectRow>(
    'SELECT * FROM subjects WHERE grade = ? ORDER BY name',
    [grade],
  );
  return rows.map(toSubject);
}

/** Returns all subjects regardless of grade (seeding / admin use). */
export async function dbGetAllSubjects(): Promise<Subject[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SubjectRow>(
    'SELECT * FROM subjects ORDER BY grade, name',
  );
  return rows.map(toSubject);
}

/**
 * Returns a single subject by ID.
 * Used by screens that need to read q{n}_topic / q{n}_content before
 * calling an AI service.
 */
export async function dbGetSubjectById(subjectId: string): Promise<Subject | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SubjectRow>(
    'SELECT * FROM subjects WHERE id = ?',
    [subjectId],
  );
  return row ? toSubject(row) : null;
}

/** Inserts a subject row if it does not already exist (seeding). */
export async function dbUpsertSubject(subject: Subject): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO subjects
       (id, grade, name, emoji, total_lessons,
        description,
        q1_topic, q1_content,
        q2_topic, q2_content,
        q3_topic, q3_content,
        q4_topic, q4_content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subject.id, subject.grade, subject.name, subject.emoji, subject.totalLessons,
      subject.description,
      subject.q1Topic, subject.q1Content,
      subject.q2Topic, subject.q2Content,
      subject.q3Topic, subject.q3Content,
      subject.q4Topic, subject.q4Content,
    ],
  );
}

// ── Internal row type & mapper ─────────────────────────────────────────────

type SubjectRow = {
  id: string; grade: number; name: string; emoji: string; total_lessons: number;
  description: string;
  q1_topic: string; q1_content: string;
  q2_topic: string; q2_content: string;
  q3_topic: string; q3_content: string;
  q4_topic: string; q4_content: string;
};

function toSubject(r: SubjectRow): Subject {
  return {
    id:          r.id,
    grade:       r.grade,
    name:        r.name,
    emoji:       r.emoji,
    totalLessons: r.total_lessons,
    description: r.description,
    q1Topic:     r.q1_topic,   q1Content: r.q1_content,
    q2Topic:     r.q2_topic,   q2Content: r.q2_content,
    q3Topic:     r.q3_topic,   q3Content: r.q3_content,
    q4Topic:     r.q4_topic,   q4Content: r.q4_content,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns progress rows for all subjects. */
export async function dbGetAllSubjectProgress(): Promise<SubjectProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; subject_id: string; mastery_score: number;
    lessons_completed: number; total_lessons: number; diagnostic_completed: number;
  }>('SELECT * FROM subject_progress');
  return rows.map(toSubjectProgress);
}

/** Returns progress for a single subject. */
export async function dbGetSubjectProgress(subjectId: string): Promise<SubjectProgress | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string; subject_id: string; mastery_score: number;
    lessons_completed: number; total_lessons: number; diagnostic_completed: number;
  }>('SELECT * FROM subject_progress WHERE subject_id = ?', [subjectId]);
  return row ? toSubjectProgress(row) : null;
}

/** Inserts or replaces a subject progress row. */
export async function dbSaveSubjectProgress(sp: SubjectProgress): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO subject_progress
       (id, subject_id, mastery_score, lessons_completed, total_lessons, diagnostic_completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      sp.id, sp.subjectId, sp.masteryScore,
      sp.lessonsCompleted, sp.totalLessons,
      sp.diagnosticCompleted ? 1 : 0,
    ],
  );
}

function toSubjectProgress(r: {
  id: string; subject_id: string; mastery_score: number;
  lessons_completed: number; total_lessons: number; diagnostic_completed: number;
}): SubjectProgress {
  return {
    id: r.id,
    subjectId: r.subject_id,
    masteryScore: r.mastery_score,
    lessonsCompleted: r.lessons_completed,
    totalLessons: r.total_lessons,
    diagnosticCompleted: r.diagnostic_completed === 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────────────────────────────────────

/** Inserts a lesson row if it does not already exist (seeding). */
export async function dbUpsertLesson(lesson: Lesson): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO lessons
       (id, subject_id, title, order_num, quarter, is_quarterly_exam, sections)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      lesson.id, lesson.subjectId, lesson.title, lesson.order,
      lesson.quarter, lesson.isQuarterlyExam ? 1 : 0,
      JSON.stringify(lesson.sections ?? []),
    ],
  );
}

/** Returns a single lesson by ID with sections parsed. */
export async function dbGetLessonById(lessonId: string): Promise<Lesson | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string; subject_id: string; title: string; order_num: number;
    quarter: number; is_quarterly_exam: number; sections: string;
  }>('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  return row ? toLesson(row) : null;
}

/**
 * Returns all lessons for a subject ordered by quarter then order_num.
 * Since subjects are grade-scoped, all returned lessons share the same grade.
 */
export async function dbGetLessonsBySubject(subjectId: string): Promise<Lesson[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; subject_id: string; title: string; order_num: number;
    quarter: number; is_quarterly_exam: number; sections: string;
  }>(
    'SELECT * FROM lessons WHERE subject_id = ? ORDER BY quarter, order_num',
    [subjectId],
  );
  return rows.map(toLesson);
}

/**
 * ★ Returns all lessons for a given grade level (joins through subjects).
 * Useful for bulk progress checks.
 */
export async function dbGetLessonsByGrade(grade: number): Promise<Lesson[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; subject_id: string; title: string; order_num: number;
    quarter: number; is_quarterly_exam: number; sections: string;
  }>(
    `SELECT l.*
     FROM   lessons  l
     JOIN   subjects s ON s.id = l.subject_id
     WHERE  s.grade = ?
     ORDER  BY l.subject_id, l.quarter, l.order_num`,
    [grade],
  );
  return rows.map(toLesson);
}

function toLesson(r: {
  id: string; subject_id: string; title: string; order_num: number;
  quarter: number; is_quarterly_exam: number; sections: string;
}): Lesson {
  return {
    id: r.id,
    subjectId: r.subject_id,
    title: r.title,
    order: r.order_num,
    quarter: r.quarter,
    isQuarterlyExam: r.is_quarterly_exam === 1,
    sections: JSON.parse(r.sections ?? '[]'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all lesson-progress rows (used in SubjectView). */
export async function dbGetAllLessonProgress(): Promise<LessonProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; lesson_id: string; completed: number;
    quiz_score: number | null; completed_at: string | null;
  }>('SELECT * FROM lesson_progress');
  return rows.map(toLessonProgress);
}

/**
 * Marks a lesson as complete with a quiz score.
 * Uses UPSERT so it is safe to call whether the row exists or not.
 */
export async function dbCompleteLesson(
  lessonId: string,
  quizScore: number,
  progressRowId: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO lesson_progress (id, lesson_id, completed, quiz_score, completed_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET
       completed    = 1,
       quiz_score   = excluded.quiz_score,
       completed_at = excluded.completed_at`,
    [progressRowId, lessonId, quizScore, new Date().toISOString()],
  );
}

function toLessonProgress(r: {
  id: string; lesson_id: string; completed: number;
  quiz_score: number | null; completed_at: string | null;
}): LessonProgress {
  return {
    id: r.id,
    lessonId: r.lesson_id,
    completed: r.completed === 1,
    quizScore: r.quiz_score ?? undefined,
    completedAt: r.completed_at ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC RESULTS  ★ one per (user, subject)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ★ Saves the student's one-time diagnostic result.
 *    INSERT OR IGNORE — silently does nothing if a result already exists,
 *    preventing any accidental second write from overwriting the first.
 */
export async function dbSaveDiagnosticResult(result: DiagnosticResult): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO diagnostic_results
       (id, user_id, subject_id,
        q1_score, q2_score, q3_score, q4_score, overall_score, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id, result.userId, result.subjectId,
      result.q1Score, result.q2Score, result.q3Score, result.q4Score,
      result.overallScore, result.completedAt,
    ],
  );
}

/**
 * ★ Returns the single diagnostic result for a subject, or null if not yet taken.
 *    (Replaces the old getDiagnosticResults() array version.)
 */
export async function dbGetDiagnosticResult(
  userId: string,
  subjectId: string,
): Promise<DiagnosticResult | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string; user_id: string; subject_id: string;
    q1_score: number; q2_score: number; q3_score: number; q4_score: number;
    overall_score: number; completed_at: string;
  }>(
    'SELECT * FROM diagnostic_results WHERE user_id = ? AND subject_id = ?',
    [userId, subjectId],
  );
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    q1Score: row.q1_score,
    q2Score: row.q2_score,
    q3Score: row.q3_score,
    q4Score: row.q4_score,
    overallScore: row.overall_score,
    completedAt: row.completed_at,
  };
}

/**
 * ★ Convenience check: has the student already taken the diagnostic for this subject?
 */
export async function dbDiagnosticTaken(
  userId: string,
  subjectId: string,
): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM diagnostic_results WHERE user_id = ? AND subject_id = ?',
    [userId, subjectId],
  );
  return (row?.n ?? 0) > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUARTERLY EXAM RESULTS
// ─────────────────────────────────────────────────────────────────────────────

/** Saves a quarterly exam attempt. */
export async function dbSaveQuarterlyExamResult(result: QuarterlyExamResult): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO quarterly_exam_results
       (id, user_id, subject_id, quarter, score, total_questions,
        easy_score, medium_score, hard_score, completed_at, attempt_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id, result.userId, result.subjectId, result.quarter,
      result.score, result.totalQuestions,
      result.easyScore ?? 0, result.mediumScore ?? 0, result.hardScore ?? 0,
      result.completedAt, result.attemptNumber,
    ],
  );
}

/** Returns all quarterly exam attempts for a subject+quarter, oldest first. */
export async function dbGetQuarterlyExamResults(
  subjectId: string,
  quarter: number,
): Promise<QuarterlyExamResult[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; user_id: string; subject_id: string; quarter: number;
    score: number; total_questions: number; easy_score: number;
    medium_score: number; hard_score: number;
    completed_at: string; attempt_number: number;
  }>(
    `SELECT * FROM quarterly_exam_results
      WHERE subject_id = ? AND quarter = ?
      ORDER BY attempt_number ASC`,
    [subjectId, quarter],
  );
  return rows.map((r: { id: any; user_id: any; subject_id: any; quarter: any; score: any; total_questions: any; easy_score: any; medium_score: any; hard_score: any; completed_at: any; attempt_number: any; }) => ({
    id: r.id, userId: r.user_id, subjectId: r.subject_id,
    quarter: r.quarter, score: r.score, totalQuestions: r.total_questions,
    easyScore: r.easy_score, mediumScore: r.medium_score, hardScore: r.hard_score,
    completedAt: r.completed_at, attemptNumber: r.attempt_number,
  }));
}

/**
 * Returns true when all non-exam lessons in a quarter are completed.
 * Used to gate the Quarterly Exam button in SubjectView.
 */
export async function dbQuarterlyExamUnlocked(
  subjectId: string,
  quarter: number,
): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number; done: number }>(
    `SELECT
       COUNT(l.id)                                   AS total,
       COUNT(CASE WHEN lp.completed = 1 THEN 1 END)  AS done
     FROM   lessons l
     LEFT   JOIN lesson_progress lp ON lp.lesson_id = l.id
     WHERE  l.subject_id        = ?
       AND  l.quarter           = ?
       AND  l.is_quarterly_exam = 0`,
    [subjectId, quarter],
  );
  if (!row || row.total === 0) return false;
  return row.done >= row.total;
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON QUIZ RESULTS
// ─────────────────────────────────────────────────────────────────────────────

/** Saves a lesson quiz attempt. */
export async function dbSaveLessonQuizResult(result: LessonQuizResult): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO lesson_quiz_results
       (id, lesson_id, user_id, score, total_questions,
        easy_score, medium_score, hard_score, completed_at, attempt_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id, result.lessonId, result.userId,
      result.score, result.totalQuestions,
      result.easyScore ?? 0, result.mediumScore ?? 0, result.hardScore ?? 0,
      result.completedAt, result.attemptNumber,
    ],
  );
}

/** Returns ALL lesson quiz results across every lesson (used by Dashboard AssessTab). */
export async function dbGetAllLessonQuizResults(): Promise<LessonQuizResult[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; lesson_id: string; user_id: string; score: number;
    total_questions: number; easy_score: number; medium_score: number;
    hard_score: number; completed_at: string; attempt_number: number;
  }>('SELECT * FROM lesson_quiz_results ORDER BY completed_at DESC');
  return rows.map((r: { id: any; lesson_id: any; user_id: any; score: any; total_questions: any; easy_score: any; medium_score: any; hard_score: any; completed_at: any; attempt_number: any; }) => ({
    id: r.id, lessonId: r.lesson_id, userId: r.user_id,
    score: r.score, totalQuestions: r.total_questions,
    easyScore: r.easy_score, mediumScore: r.medium_score, hardScore: r.hard_score,
    completedAt: r.completed_at, attemptNumber: r.attempt_number,
  }));
}

/** Returns all quiz attempts for a lesson, oldest first. */
export async function dbGetLessonQuizResults(lessonId: string): Promise<LessonQuizResult[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; lesson_id: string; user_id: string; score: number;
    total_questions: number; easy_score: number; medium_score: number;
    hard_score: number; completed_at: string; attempt_number: number;
  }>(
    'SELECT * FROM lesson_quiz_results WHERE lesson_id = ? ORDER BY attempt_number ASC',
    [lessonId],
  );
  return rows.map((r: { id: any; lesson_id: any; user_id: any; score: any; total_questions: any; easy_score: any; medium_score: any; hard_score: any; completed_at: any; attempt_number: any; }) => ({
    id: r.id, lessonId: r.lesson_id, userId: r.user_id,
    score: r.score, totalQuestions: r.total_questions,
    easyScore: r.easy_score, mediumScore: r.medium_score, hardScore: r.hard_score,
    completedAt: r.completed_at, attemptNumber: r.attempt_number,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

/** Saves a single chat message (called after each user send / tutor reply). */
export async function dbSaveChatMessage(msg: ChatMessage): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO chat_messages (id, lesson_id, role, content, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [msg.id, msg.lessonId, msg.role, msg.content, msg.timestamp],
  );
}

/** Returns the full conversation history for a lesson, oldest message first. */
export async function dbGetChatHistory(lessonId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; lesson_id: string; role: string; content: string; timestamp: string;
  }>(
    'SELECT * FROM chat_messages WHERE lesson_id = ? ORDER BY timestamp ASC',
    [lessonId],
  );
  return rows.map((r: { id: any; lesson_id: any; role: string; content: any; timestamp: any; }) => ({
    id: r.id,
    lessonId: r.lesson_id,
    role: r.role as 'user' | 'tutor',
    content: r.content,
    timestamp: r.timestamp,
  }));
}

/** Clears all chat messages for a lesson. */
export async function dbClearChatHistory(lessonId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM chat_messages WHERE lesson_id = ?', [lessonId]);
}