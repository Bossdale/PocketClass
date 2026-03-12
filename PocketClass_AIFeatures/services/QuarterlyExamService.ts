/**
 * QuarterlyExamService
 *
 * Generates a quarterly exam covering all lessons in a quarter.
 * Produces 5 questions per lesson, each from a separate model invocation,
 * so the model can focus on one lesson and one question type at a time.
 * All 5 question types (including drag_drop and matching) are used without
 * the malformed JSON that results from requesting complex nested structures
 * in a bulk array.
 *
 * ── SCHEMA ───────────────────────────────────────────────────────────────────
 *   READ  subjects.name         → QuarterlyExamInput.subjectName
 *   READ  subjects.q{n}_topic   → QuarterlyExamInput.topic
 *   READ  lessons (per quarter) → QuarterlyExamInput.lessons[]
 *           lessons.title       → lessons[i].title
 *           lessons.sections    → lessons[i].content  (joined; populated by
 *                                  LessonMaterialService before exam is unlocked)
 *   READ  profiles.grade        → QuarterlyExamInput.grade
 *   READ  profiles.country      → QuarterlyExamInput.country
 *   WRITE quarterly_exam_results ← attempt row written by QuarterlyExam.tsx
 *
 * ── UI ───────────────────────────────────────────────────────────────────────
 *   Screen : QuarterlyExam.tsx
 *   Trigger: student taps "Start Exam" (startExam); gated by
 *            dbQuarterlyExamUnlocked — all non-exam lessons in the quarter
 *            must be completed, guaranteeing lessons.sections is populated
 *   Renders: QuizRenderer.tsx → all 5 renderers including QuizDragDrop,
 *            QuizMatching
 *   After  : easyScore / mediumScore / hardScore saved to quarterly_exam_results
 *            Stars: 3★ ≥ 80%  |  2★ ≥ 50%  |  1★ otherwise
 *
 * ── GENERATION PLAN (EXAM_QUESTION_PLAN) ─────────────────────────────────────
 *   5 questions per lesson. Each step routes to its own prompt via EXAM_PROMPT_MAP.
 *   The hard question type alternates per lesson (drag_drop / matching)
 *   for variety across the full exam.
 *
 *   #   difficulty  prompt
 *   1   easy        quarterlyExamMCQPrompt
 *   2   easy        quarterlyExamTFPrompt
 *   3   medium      quarterlyExamFBPrompt
 *   4   medium      quarterlyExamMCQPrompt
 *   5   hard        quarterlyExamDragDropPrompt  ← even-indexed lessons
 *            OR     quarterlyExamMatchingPrompt  ← odd-indexed lessons
 *
 *   Example: 4 lessons → 20 questions (8 easy, 8 medium, 4 hard)
 *
 * ── FLOW ─────────────────────────────────────────────────────────────────────
 *   QuarterlyExam.tsx (startExam)
 *     → dbGetSubjectById(subjectId) + dbGetLessonsBySubject(subjectId)
 *     → build QuarterlyExamInput { subjectName, quarter, topic, lessons[], grade, country }
 *     → QuarterlyExamService.generateExam(input)
 *         for each lesson in input.lessons:
 *           alreadyAsked = []
 *           for i in 0..4 (EXAM_QUESTION_PLAN):
 *             → EXAM_PROMPT_MAP[type].pipe(model).invoke({
 *                 subjectName, quarter, topic,
 *                 lessonTitle, lessonContent,
 *                 grade, country,
 *                 questionNumber, difficulty,
 *                 alreadyAsked
 *               })
 *             → jsonParser<QuizQuestion[]>(raw.content)[0]
 *             → push to lessonQuestions[]
 *           allQuestions.push(...lessonQuestions)
 *     → setQuestions(allQuestions) → QuizRenderer renders all questions
 *
 * ── OUTPUT ───────────────────────────────────────────────────────────────────
 *   QuizQuestion[]  (lessons.length × 5 items)
 *   Types: all 5 — multiple_choice, true_false, fill_blank, drag_drop, matching
 *
 * ── TEMPERATURE ──────────────────────────────────────────────────────────────
 *   0.2 — exam answers must be factually unambiguous and consistent
 */

import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';

import type { QuarterlyExamInput } from '../types/input/quarterlyExamInput';
import type { Difficulty, QuestionType, QuizQuestion } from '../types/outputs/quizQuestion';

// ── Question generation plan ──────────────────────────────────────────────────
// 5 questions per lesson. The last entry's type is overridden per lesson index
// to alternate between drag_drop (even lessons) and matching (odd lessons).
const EXAM_QUESTION_PLAN: ReadonlyArray<{ difficulty: Difficulty; type: QuestionType }> = [
  { difficulty: 'easy',   type: 'multiple_choice' },
  { difficulty: 'easy',   type: 'true_false'      },
  { difficulty: 'medium', type: 'fill_blank'      },
  { difficulty: 'medium', type: 'multiple_choice' },
  { difficulty: 'hard',   type: 'drag_drop'       }, // overridden per lesson below
];

// Hard question types alternated per lesson for variety across the full exam
const HARD_TYPES: ReadonlyArray<QuestionType> = ['drag_drop', 'matching'];

// ── Prompt map ────────────────────────────────────────────────────────────────
// Each type routes to its own prompt so the model sees only the schema it needs.
// questionType is no longer passed as an invoke variable.
const EXAM_PROMPT_MAP = {
  multiple_choice: PromptTemplates.quarterlyExamMCQPrompt,
  true_false:      PromptTemplates.quarterlyExamTFPrompt,
  fill_blank:      PromptTemplates.quarterlyExamFBPrompt,
  drag_drop:       PromptTemplates.quarterlyExamDragDropPrompt,
  matching:        PromptTemplates.quarterlyExamMatchingPrompt,
} as const;

export class QuarterlyExamService {

  /**
   * Generates 5 questions per lesson across all lessons in the quarter.
   * Each question is its own model invocation. alreadyAsked resets per lesson
   * so the model only avoids duplicates within the same lesson's questions.
   *
   * @param input  subjectName, quarter, topic, per-lesson content, grade, country
   * @returns      QuizQuestion[] of length lessons.length × 5
   */
  static async generateExam(input: QuarterlyExamInput): Promise<QuizQuestion[]> {
    ModelClass.setTemperature(0.2);
    const model        = ModelClass.getInstance();
    const allQuestions: QuizQuestion[] = [];

    for (let lessonIdx = 0; lessonIdx < input.lessons.length; lessonIdx++) {
      const lesson          = input.lessons[lessonIdx];
      const lessonQuestions: QuizQuestion[] = [];

      for (let i = 0; i < EXAM_QUESTION_PLAN.length; i++) {
        let { difficulty, type } = EXAM_QUESTION_PLAN[i];

        // Alternate the hard question type per lesson so the full exam
        // contains both drag_drop and matching across different lessons.
        if (difficulty === 'hard') {
          type = HARD_TYPES[lessonIdx % HARD_TYPES.length];
        }

        // Select the prompt for this type — no schema noise from other types.
        const chain = EXAM_PROMPT_MAP[type].pipe(model);

        // alreadyAsked resets per lesson — cross-lesson content differs enough
        // that global deduplication adds complexity without meaningful benefit.
        const alreadyAsked = lessonQuestions.length > 0
          ? lessonQuestions
              .map((q, idx) => `${idx + 1}. ${QuarterlyExamService.getQuestionLabel(q)}`)
              .join('\n')
          : 'None';

        const raw = await chain.invoke({
          subjectName:    input.subjectName,
          quarter:        String(input.quarter),
          topic:          input.topic,
          lessonTitle:    lesson.title,
          lessonContent:  lesson.content,
          grade:          String(input.grade),
          country:        input.country,
          questionNumber: String(i + 1),
          difficulty,
          alreadyAsked,
          // questionType is NOT passed — it is baked into the selected prompt
        });

        const [question] = jsonParser<QuizQuestion[]>(raw.content);
        lessonQuestions.push(question);
      }

      allQuestions.push(...lessonQuestions);
    }

    ModelClass.setTemperature(0.5);
    return allQuestions;
  }

  /**
   * Extracts a short display label from a question for use in alreadyAsked.
   * MCQ / TF / FB expose questionText; drag_drop / matching expose instruction.
   */
  private static getQuestionLabel(q: QuizQuestion): string {
    if ('questionText' in q) return q.questionText;
    if ('instruction'  in q) return q.instruction;
    return '(unknown)';
  }
}