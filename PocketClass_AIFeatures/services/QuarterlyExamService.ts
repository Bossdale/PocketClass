import { ModelClass } from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { safeInvoke } from '../utils/safeInvoke';
import type { SeedQuestion } from '../types/input/quarterlyExamInput';
import type {
  QuarterlyExamQuestion,
  QEMultipleChoiceQuestion,
  QEFillBlankQuestion,
  QETrueFalseQuestion
} from '../types/outputs/QuarterlyExamOutput';
import { randNumber } from '../utils/randNumber';

interface MCQPayload {
  type: 'multiple_choice';
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface FBPayload {
  type: 'fill_blank';
  questionText: string;
  correctAnswer: string;
  hint?: string;
}

interface TFPayload {
  type: 'true_false';
  questionText: string;
  correctAnswer: boolean;
}

export interface SimpleExamInput {
  subjectName: string;
  quarter: number;
  lessonTitle: string;
  grade: number;
  country: string;
  difficulty: string;
  questions: SeedQuestion[];
}

export class QuarterlyExamService {
  async generateExam(input: SimpleExamInput): Promise<QuarterlyExamQuestion[]> {
    ModelClass.setTemperature(0.1);
    const model = ModelClass.getInstance();
    const results: QuarterlyExamQuestion[] = [];

    // Split questions into difficulty groups
    const total = input.questions.length;
    const easyCount = Math.ceil(total / 3);
    const mediumCount = Math.ceil(total / 3);
    const hardCount = total - easyCount - mediumCount;

    const easySeeds = input.questions.slice(0, easyCount);
    const mediumSeeds = input.questions.slice(easyCount, easyCount + mediumCount);
    const hardSeeds = input.questions.slice(easyCount + mediumCount);

    const processSeeds = async (
      seeds: SeedQuestion[],
      difficulty: 'easy' | 'medium' | 'hard'
    ) => {
      if (seeds.length === 0) return;

      let num = randNumber(3); // random 1-3
      let easymid: 'mcq' | 'tf' = num === 1 ? 'mcq' : 'tf';
      const type: 'mcq' | 'fb' | 'tf' = difficulty === 'hard' ? 'fb' : easymid;
      const chain = EXAM_PROMPT_MAP[type].pipe(model);

      const formattedQuestions = seeds
        .map((s, i) => `${i + 1}. ${s.question} (Answer: ${s.answer})`)
        .join('\n');

      const aiResult = await safeInvoke<any[]>(
        () =>
          chain.invoke({
            grade: String(input.grade),
            difficulty,
            questions: formattedQuestions,
            questionCount: seeds.length
          }),
        (data) =>
          Array.isArray(data) &&
          data.length === seeds.length &&
          typeof data[0]?.questionText === 'string',
        3
      );

      for (let i = 0; i < aiResult.length; i++) {
        const payload = aiResult[i];
        const seed = seeds[i];

        if (type === 'mcq') {
          const mcq = payload as MCQPayload;
          results.push({
            type: 'multiple_choice',
            difficulty,
            questionText: mcq.questionText,
            options: mcq.options,
            correctAnswer: mcq.correctAnswer
          } as QEMultipleChoiceQuestion);
        } else if (type === 'tf') {
          const tf = payload as TFPayload;
          results.push({
            type: 'true_false',
            difficulty,
            questionText: tf.questionText,
            correctAnswer: tf.correctAnswer
          } as QETrueFalseQuestion);
        } else {
          const fb = payload as FBPayload;
          results.push({
            type: 'fill_blank',
            difficulty,
            questionText: fb.questionText,
            correctAnswer: seed.answer,
            hint: fb.hint || 'Think carefully about the lesson.'
          } as QEFillBlankQuestion);
        }
      }
    };

    await processSeeds(easySeeds, 'easy');
    await processSeeds(mediumSeeds, 'medium');
    await processSeeds(hardSeeds, 'hard');

    ModelClass.setTemperature(0.5);
    return results;
  }
}

// Prompt map including TF
const EXAM_PROMPT_MAP = {
  mcq: PromptTemplates.quarterlyExamMCQPrompt,
  fb: PromptTemplates.quarterlyExamFBPrompt,
  tf: PromptTemplates.quarterlyExamTFPrompt
} as const;