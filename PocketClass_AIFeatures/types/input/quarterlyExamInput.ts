// ── Seed types ────────────────────────────────────────────────────────────────

/**
 * A basic question+answer pair used as the source text the AI rewrites.
 *
 * MCQ: question = the question sentence
 *      answer   = the correct option text
 *      AI will generate 3 wrong options and include the correct one in the final options array
 *
 * TF: question = the statement
 *     answer   = "true" | "false"
 *
 * FB: question = sentence with a blank indicated by "___"
 *     answer   = the correct word/phrase to fill the blank
 */
export interface SeedQuestion {
  question: string;
  answer: string;
}

/**
 * Pre-computed drag-and-drop sequencing seed.
 * Constructed directly into a BaseQuestion — NO AI call.
 */
export interface DragDropSeed {
  instruction: string;
  items: string[];          // SHUFFLED
  correctOrder: number[];   // pre-computed index mapping
}

/**
 * Pre-computed matching seed.
 * Constructed directly into a BaseQuestion — NO AI call.
 */
export interface MatchingSeed {
  instruction: string;
  leftItems: string[];
  rightItems: string[];     // SHUFFLED — not aligned with leftItems
  correctPairs: number[];   // pre-computed index mapping
}

// ── Primary input type ────────────────────────────────────────────────────────

export interface QuarterlyExamInput {
  subjectName: string;   // e.g., 'Biology'
  quarter: number;       // 1 | 2 | 3 | 4
  lessonTitle: string;   // e.g., 'Digestive System'
  lessonIndex: number;   // 0-based index in this quarter's lesson list
  grade: number;         // 7–12
  country: string;       // 'indonesia' | 'malaysia' | 'brunei'

  // User-provided questions — only question + answer
  mcqSeeds: SeedQuestion[];   // AI will rewrite and generate 3 wrong options
  tfSeeds: SeedQuestion[];    // AI rewrites statement, preserves boolean answer
  fbSeeds: SeedQuestion[];    // AI rewrites sentence with ___, preserves answer

  // Optional direct construction for hard questions
  dragDropSeed?: DragDropSeed;  // used directly when lessonIndex is even
  matchingSeed?: MatchingSeed;  // used directly when lessonIndex is odd
}