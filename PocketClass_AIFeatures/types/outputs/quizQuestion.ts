/**
 * QuizQuestion variants
 *
 * Union type returned by all quiz-generating services.
 * QuizRenderer.tsx switches on `question.type` to pick the right renderer.
 *
 * ── WHO PRODUCES THESE ───────────────────────────────────────────────────────
 *   DiagnosticQuizService  → MultipleChoiceQuestion[]  (5 per quarter, MCQ only)
 *   LessonQuizService      → QuizQuestion[]            (10 total, mixed)
 *   QuarterlyExamService   → QuizQuestion[]            (5 per lesson, all types)
 *
 * ── GENERATION STRATEGY ──────────────────────────────────────────────────────
 *   Diagnostic  : 5 questions in one model call (MCQ only; simple enough for bulk)
 *   Lesson Quiz : 1 question per model call × 10 (see LessonQuizService.LESSON_QUIZ_PLAN)
 *   Quarterly   : 1 question per model call × 5 per lesson (see QuarterlyExamService.EXAM_QUESTION_PLAN)
 *
 *   Single-question generation pins `type` and `difficulty` per call, passes
 *   `alreadyAsked` question texts to prevent repeats, and lets the model give
 *   its full attention to one focused task — eliminating type drift, duplicate
 *   answers, and mid-array truncation that occur in bulk generation.
 *
 * ── DIFFICULTY DISTRIBUTION ──────────────────────────────────────────────────
 *   Diagnostic   : all "easy"   (baseline assessment — not scored by tier)
 *   Lesson Quiz  : 4 easy + 4 medium + 2 hard  (10 total)
 *   Quarterly    : per lesson: 2 easy + 2 medium + 1 hard  (5 per lesson)
 *
 * ── TYPE GUARDS ──────────────────────────────────────────────────────────────
 *   QuizRenderer.tsx uses question.type:
 *     'multiple_choice' → MCRenderer
 *     'true_false'      → TFRenderer
 *     'fill_blank'      → FBRenderer
 *     'drag_drop'       → QuizDragDrop component
 *     'matching'        → QuizMatching component
 *
 * ── LABEL EXTRACTION (for alreadyAsked in services) ──────────────────────────
 *   MCQ / TF / FB  → question.questionText
 *   drag_drop / matching → question.instruction
 */

export type Difficulty   = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

// ── Base (never used directly — always one of the five subtypes below) ────────
export interface BaseQuestion {
  type:       QuestionType;
}

// ── 1. Multiple Choice ────────────────────────────────────────────────────────
// Used in: all three quiz services
export interface MultipleChoiceQuestion extends BaseQuestion {
  type:          'multiple_choice';
  questionText:  string;
  options:       string[];  // exactly 4 items
  correctOption: number;    // 0-based index into options[]
}

// ── 2. True / False ───────────────────────────────────────────────────────────
// Used in: LessonQuizService, QuarterlyExamService
export interface TrueFalseQuestion extends BaseQuestion {
  type:          'true_false';
  questionText:  string;
  correctAnswer: boolean;
}

// ── 3. Fill in the Blank ──────────────────────────────────────────────────────
// Used in: LessonQuizService, QuarterlyExamService
export interface FillBlankQuestion extends BaseQuestion {
  type:          'fill_blank';
  questionText:  string;  // contains "___" where the blank appears
  correctAnswer: string;
  hint?:         string;  // optional — shown via "💡 Show hint" in FBRenderer
}