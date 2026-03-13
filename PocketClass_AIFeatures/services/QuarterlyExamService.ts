import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { safeInvoke }      from '../utils/safeInvoke';
import type { QuarterlyExamInput, SeedQuestion } from '../types/input/quarterlyExamInput';
import type {
  QuarterlyExamQuestion,
  QEMultipleChoiceQuestion,
  QETrueFalseQuestion,
  QEFillBlankQuestion,
  QEDragDropQuestion,
  QEMatchingQuestion,
} from '../types/outputs/QuarterlyExamOutput';

// ── Question plan ─────────────────────────────────────────────────────────────

type StepType = 'mcq' | 'tf' | 'fb' | 'drag_drop' | 'matching';

interface PlanStep {
  difficulty: 'easy' | 'medium' | 'hard';
  type:       StepType;
}

const EXAM_QUESTION_PLAN: ReadonlyArray<PlanStep> = [
  { difficulty: 'easy',   type: 'mcq'       },
  { difficulty: 'easy',   type: 'tf'        },
  { difficulty: 'medium', type: 'fb'        },
  { difficulty: 'medium', type: 'mcq'       },
  { difficulty: 'hard',   type: 'drag_drop' },
];

const EXAM_PROMPT_MAP = {
  mcq: PromptTemplates.quarterlyExamMCQPrompt,
  tf:  PromptTemplates.quarterlyExamTFPrompt,
  fb:  PromptTemplates.quarterlyExamFBPrompt,
} as const;

// Internal type for parsing the decoupled LLM payload
interface DecoupledTextPayload {
  questionText: string;
  hint?: string;
}

export class QuarterlyExamService {

  async generateExam(input: QuarterlyExamInput): Promise<QuarterlyExamQuestion[]> {
    ModelClass.setTemperature(0.1);
    const model = ModelClass.getInstance();

    const questions: QuarterlyExamQuestion[] = [];

    const mcqQueue: SeedQuestion[] = [...input.mcqSeeds];
    const tfQueue:  SeedQuestion[] = [...input.tfSeeds];
    const fbQueue:  SeedQuestion[] = [...input.fbSeeds];

    for (const step of EXAM_QUESTION_PLAN) {
      let type: StepType = step.type;
      
      // Resolve the actual type for the hard step
      if (step.difficulty === 'hard') {
        type = input.lessonIndex % 2 === 0 ? 'drag_drop' : 'matching';
      }

      // ── 1. drag_drop: construct directly ───────────────────────────────────────
      if (type === 'drag_drop') {
        if (!input.dragDropSeed) throw new Error(`dragDropSeed missing for even lessonIndex`);
        questions.push({
          type:         'drag_drop',
          difficulty:   'hard',
          instruction:  input.dragDropSeed.instruction,
          items:        input.dragDropSeed.items,
          correctOrder: input.dragDropSeed.correctOrder,
        } as QEDragDropQuestion);
        continue;
      }

      // ── 2. matching: construct directly ────────────────────────────────────────
      if (type === 'matching') {
        if (!input.matchingSeed) throw new Error(`matchingSeed missing for odd lessonIndex`);
        questions.push({
          type:         'matching',
          difficulty:   'hard',
          instruction:  input.matchingSeed.instruction,
          leftItems:    input.matchingSeed.leftItems,
          rightItems:   input.matchingSeed.rightItems,
          correctPairs: input.matchingSeed.correctPairs,
        } as QEMatchingQuestion);
        continue;
      }

      // ── 3. TF: Construct directly, zero model call (Guarantees 100% logic accuracy) ──
      if (type === 'tf') {
        if (tfQueue.length === 0) throw new Error(`tfSeeds exhausted`);
        const seed = tfQueue.shift()!;
        
        questions.push({
          type:          'true_false',
          difficulty:    step.difficulty,
          questionText:  seed.question, // ← Maps your seed directly! No LLM!
          correctAnswer: seed.answer.toLowerCase() === 'true' 
        } as QETrueFalseQuestion);
        
        continue; // ← Skips the LLM call entirely!
      }

      // ── 4. MCQ / FB: Call LLM for TEXT ONLY, build JSON securely ────────
      let seed: SeedQuestion;
      if (type === 'mcq') {
        if (mcqQueue.length === 0) throw new Error(`mcqSeeds exhausted`);
        seed = mcqQueue.shift()!;
      } else if (type === 'fb') {
        if (fbQueue.length === 0) throw new Error(`fbSeeds exhausted`);
        seed = fbQueue.shift()!;
      } else {
        throw new Error(`Unexpected question type reaching LLM: ${type}`);
      }

      const chain = EXAM_PROMPT_MAP[type as keyof typeof EXAM_PROMPT_MAP].pipe(model);

      // We only ask the LLM for the text payload (question wording and optional hint)
      const textPayload = await safeInvoke<DecoupledTextPayload>(
        () => chain.invoke({
          grade:      String(input.grade),
          country:    input.country,
          difficulty: step.difficulty,
          questions:  QuarterlyExamService.formatSeed(seed),
        }),
        (data) => typeof data?.questionText === 'string' && data.questionText.length > 5,
        3
      );

      // Deterministically build the final object mapping seed data perfectly
      if (type === 'mcq') {
        questions.push({
          type:          'multiple_choice',
          difficulty:    step.difficulty,
          questionText:  textPayload.questionText,
          options:       seed.options!, // Safely injected from the hardcoded seed!
          correctAnswer: seed.answer    // 100% accurate!
        } as QEMultipleChoiceQuestion);
      } 
      else if (type === 'fb') {
        questions.push({
          type:          'fill_blank',
          difficulty:    step.difficulty,
          questionText:  textPayload.questionText,
          correctAnswer: seed.answer, // 100% accurate!
          hint:          textPayload.hint || 'Think carefully about the lesson concepts.'
        } as QEFillBlankQuestion);
      }
    }

    ModelClass.setTemperature(0.5);
    return questions;
  }

  private static formatSeed(seed: SeedQuestion): string {
    const lines: string[] = [`Original Question: ${seed.question}`];
    if (seed.options && seed.options.length > 0) {
      lines.push(`Options Context: ${JSON.stringify(seed.options)}`);
    }
    lines.push(`Target Answer: ${seed.answer}`);
    return lines.join('\n');
  }
}