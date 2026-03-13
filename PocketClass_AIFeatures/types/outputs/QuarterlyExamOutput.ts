/**
 * QuarterlyExamOutput
 *
 * Canonical output types for QuarterlyExamService.generateExam().
 *
 * ── WHY A SEPARATE FILE ───────────────────────────────────────────────────────
 *   QuizQuestion.ts defines MultipleChoiceQuestion with correctOption: number
 *   (a 0-based index).  The quarterly exam MCQ prompt uses a seed-rewriting
 *   approach where the model returns correctAnswer: string (the exact option
 *   text) — because the seed already knows the correct option text, and asking
 *   a small model to infer an index reliably is error-prone.
 *
 *   All other field conflicts:
 *     QuizQuestion.ts BaseQuestion is NOT exported (private interface).
 *     QuarterlyExamService was casting constructed drag_drop / matching objects
 *     to BaseQuestion, which only has { type, difficulty } — every domain field
 *     (instruction, items, correctOrder, leftItems, rightItems, correctPairs)
 *     was invisible to the type system.
 *
 * ── WHAT PRODUCES THESE ──────────────────────────────────────────────────────
 *   QuarterlyExamService.generateExam()
 *     Steps 1+4 → QEMultipleChoiceQuestion  (AI rewrites seed to target difficulty)
 *     Step  2   → QETrueFalseQuestion        (AI rewrites seed to target difficulty)
 *     Step  3   → QEFillBlankQuestion        (AI rewrites seed to target difficulty)
 *     Step  5   → QEDragDropQuestion         (constructed directly — no AI call)
 *              OR QEMatchingQuestion         (constructed directly — no AI call)
 *
 * ── FIELD DIFFERENCES FROM QuizQuestion.ts ───────────────────────────────────
 *   MultipleChoiceQuestion  correctOption: number   ← 0-based index (LessonQuiz)
 *   QEMultipleChoiceQuestion correctAnswer: string  ← option text   (Quarterly)
 *
 *   DragDropQuestion  / QEDragDropQuestion   — identical fields
 *   MatchingQuestion  / QEMatchingQuestion   — identical fields
 *   TrueFalseQuestion / QETrueFalseQuestion  — identical fields
 *   FillBlankQuestion / QEFillBlankQuestion  — identical fields
 *
 * ── WHO CONSUMES THESE ───────────────────────────────────────────────────────
 *   QuarterlyExam.tsx  — receives QuarterlyExamQuestion[] from the service,
 *                        passes each item to QuizRenderer based on .type
 */

import type { Difficulty } from './quizQuestion';


// ── Shared base ───────────────────────────────────────────────────────────────

export interface QEBaseQuestion {
  type:       'multiple_choice' | 'true_false' | 'fill_blank' | 'drag_drop' | 'matching';
  difficulty: Difficulty;
}


// ── 1. Multiple Choice ────────────────────────────────────────────────────────
// correctAnswer is the EXACT TEXT of the correct option, not an index.
// This matches what the rewriting prompts return (they know the answer text
// from the seed; computing an index would introduce index-bias errors).

export interface QEMultipleChoiceQuestion extends QEBaseQuestion {
  type:          'multiple_choice';
  questionText:  string;
  options:       string[];  // exactly 4 items
  correctAnswer: string;    // exact text of the correct option — NOT an index
}


// ── 2. True / False ───────────────────────────────────────────────────────────

export interface QETrueFalseQuestion extends QEBaseQuestion {
  type:          'true_false';
  questionText:  string;
  correctAnswer: boolean;
}


// ── 3. Fill in the Blank ──────────────────────────────────────────────────────

export interface QEFillBlankQuestion extends QEBaseQuestion {
  type:          'fill_blank';
  questionText:  string;  // contains "___" where the blank appears
  correctAnswer: string;
  hint?:         string;
}


// ── 4. Drag & Drop ────────────────────────────────────────────────────────────
// Constructed directly from DragDropSeed — no model call.
// correctOrder[position] = index in items[] that belongs at that position.

export interface QEDragDropQuestion extends QEBaseQuestion {
  type:         'drag_drop';
  instruction:  string;
  items:        string[];
  correctOrder: number[];
}


// ── 5. Matching ───────────────────────────────────────────────────────────────
// Constructed directly from MatchingSeed — no model call.
// correctPairs[leftIndex] = index in rightItems[] that matches leftItems[leftIndex].

export interface QEMatchingQuestion extends QEBaseQuestion {
  type:         'matching';
  instruction:  string;
  leftItems:    string[];
  rightItems:   string[];
  correctPairs: number[];
}


// ── Union ─────────────────────────────────────────────────────────────────────

export type QuarterlyExamQuestion =
  | QEMultipleChoiceQuestion
  | QETrueFalseQuestion
  | QEFillBlankQuestion
  | QEDragDropQuestion
  | QEMatchingQuestion;