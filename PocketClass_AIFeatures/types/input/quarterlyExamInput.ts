/**
 * QuarterlyExamInput
 *
 * Input shape for QuarterlyExamService.generateExam().
 *
 * ── APPROACH: SEED-BASED REWRITING ───────────────────────────────────────────
 *   The service does NOT pass curriculum text to the model.
 *   Instead it passes pre-written seed questions and asks the model to
 *   REWRITE THE WORDING to the target difficulty.
 *   The model never generates new facts — it only adjusts language.
 *
 *   This directly mirrors LessonQuizService, which receives Question[] seeds
 *   and paraphrases them.  Passing curriculum text caused hallucinations:
 *   wrong facts, letter-prefixed options, correctOption always 0.
 *
 *   MCQ / TF / FB  →  AI rewrites the seed text to the target difficulty
 *   drag_drop      →  constructed DIRECTLY from DragDropSeed (no AI call)
 *   matching       →  constructed DIRECTLY from MatchingSeed  (no AI call)
 *
 * ── ONE CALL PER LESSON ──────────────────────────────────────────────────────
 *   generateExam(input) is called once per lesson and returns exactly 5
 *   BaseQuestions.  QuarterlyExam.tsx loops over lessons and accumulates them.
 *
 * ── SEED REQUIREMENTS PER LESSON ─────────────────────────────────────────────
 *   mcqSeeds:     >= 2  (consumed by steps 1 and 4)
 *   tfSeeds:      >= 1  (consumed by step 2)
 *   fbSeeds:      >= 1  (consumed by step 3)
 *   dragDropSeed:  1    (step 5 when lessonIndex is EVEN: 0, 2, 4 …)
 *   matchingSeed:  1    (step 5 when lessonIndex is ODD:  1, 3, 5 …)
 *
 * ── HOW TO BUILD (QuarterlyExam.tsx) ─────────────────────────────────────────
 *   import { EXAM_SEEDS } from '@/constants/examSeeds';
 *
 *   for (const [lessonIdx, lesson] of qLessons.entries()) {
 *     const seeds = EXAM_SEEDS[subject.id]?.[quarter]?.[lessonIdx];
 *     if (!seeds) throw new Error(`No seeds for ${subject.id} Q${quarter} lesson ${lessonIdx}`);
 *
 *     const input: QuarterlyExamInput = {
 *       subjectName:  subject.name,
 *       quarter,
 *       lessonTitle:  lesson.title,
 *       lessonIndex:  lessonIdx,
 *       grade:        profile.grade,
 *       country:      profile.country,
 *       mcqSeeds:     seeds.mcq,
 *       tfSeeds:      seeds.tf,
 *       fbSeeds:      seeds.fb,
 *       dragDropSeed: seeds.dragDrop,   // present when lessonIdx is even
 *       matchingSeed: seeds.matching,   // present when lessonIdx is odd
 *     };
 *     const five = await quarterlyExamService.generateExam(input);
 *     allQuestions.push(...five);
 *   }
 */


// ── Seed types ────────────────────────────────────────────────────────────────

/**
 * A pre-written question+answer pair used as the source text the model rewrites.
 *
 * MCQ : question = question sentence
 *       answer   = exact text of the correct option
 *       options  = all 4 options (must include the answer)
 *
 * TF  : question = the statement
 *       answer   = "true" | "false"
 *
 * FB  : question = sentence containing "___" where the blank goes
 *       answer   = the word / phrase that fills the blank
 *       options  = omitted
 */
export interface SeedQuestion {
  question: string;
  answer:   string;
  options?: string[];   // MCQ only — include all 4 options + the correct one
}

/**
 * Pre-computed drag-and-drop sequencing seed.
 * Constructed directly into a BaseQuestion — NO model call.
 *
 * items[] is already SHUFFLED (not in correct order).
 *
 * correctOrder[position] = index in items[] that belongs at that position.
 * Example:
 *   items        = ['Step C', 'Step A', 'Step D', 'Step B']
 *   correctOrder = [1, 3, 0, 2]
 *   → correct sequence: items[1] → items[3] → items[0] → items[2]  (A→B→C→D)
 */
export interface DragDropSeed {
  instruction:  string;
  items:        string[];   // SHUFFLED
  correctOrder: number[];   // pre-computed index mapping
}

/**
 * Pre-computed matching seed.
 * Constructed directly into a BaseQuestion — NO model call.
 *
 * rightItems[] is already SHUFFLED (not aligned with leftItems[]).
 *
 * correctPairs[i] = index in rightItems[] that matches leftItems[i].
 * Example:
 *   leftItems    = ['Oxidation',         'Galvanization',     'Rusting']
 *   rightItems   = ['Coating with zinc', 'Iron + oxygen',     'Visible rust']  ← shuffled
 *   correctPairs = [1, 0, 2]
 *   → Oxidation→rightItems[1], Galvanization→rightItems[0], Rusting→rightItems[2]
 */
export interface MatchingSeed {
  instruction:  string;
  leftItems:    string[];
  rightItems:   string[];   // SHUFFLED — not aligned with leftItems
  correctPairs: number[];   // pre-computed index mapping
}


// ── Primary input type ────────────────────────────────────────────────────────

export interface QuarterlyExamInput {
  subjectName: string;   // subjects.name — light context for the rewrite prompt
  quarter:     number;   // 1 | 2 | 3 | 4
  lessonTitle: string;   // lessons.title — anchors the rewrite to the right lesson
  lessonIndex: number;   // 0-based position in this quarter's lesson list
                         // even (0,2,4…) → step-5 hard question is drag_drop
                         // odd  (1,3,5…) → step-5 hard question is matching
  grade:   number;       // 7–12  from profiles.grade
  country: string;       // 'indonesia' | 'malaysia' | 'brunei'

  // Seed banks — consumed in order by EXAM_QUESTION_PLAN
  mcqSeeds:     SeedQuestion[];   // need >= 2 (steps 1 and 4)
  tfSeeds:      SeedQuestion[];   // need >= 1 (step 2)
  fbSeeds:      SeedQuestion[];   // need >= 1 (step 3)
  dragDropSeed?: DragDropSeed;    // required when lessonIndex is even
  matchingSeed?: MatchingSeed;    // required when lessonIndex is odd
}