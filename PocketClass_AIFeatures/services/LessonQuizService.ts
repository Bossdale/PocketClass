import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import type { LessonQuizInput } from '../types/input/LessonQuizInput';
import type{ BaseQuestion} from '../types/outputs/quizQuestion';
import type{ MultipleChoiceQuestion} from '../types/outputs/quizQuestion';
import { aiRetryHandler } from '../utils/aiRetryHandler';

/**
 * LessonQuizService
 *
 * Generates the adaptive end-of-lesson quiz that the student takes after
 * reading all sections of a lesson.  The quiz is grounded in the full
 * lesson content, so questions reference exactly what the student read.
 *
 * The 5-question mix (2 MCQ, 1 T/F, 1 fill-blank, 1 matching) maps to
 * the 5 QuizRenderer sub-components already in the frontend:
 *   MCRenderer, TFRenderer, FBRenderer, QuizDragDrop, QuizMatching
 *
 * Flow:
 *   LessonViewScreen.startQuiz()
 *     → LessonQuizService.generateQuiz({ lessonTitle, content, grade, country })
 *         content = lesson.sections.map(s => s.content).join('\n')
 *       → ModelClass.getInstance()
 *       → PromptTemplates.lessonQuizPrompt.pipe(model)
 *       → jsonParser<QuizQuestion[]>(response)
 *     ← QuizQuestion[]  → stored in questions state
 *     → QuizRenderer renders each question via currentQ index
 *     → handleAnswer() accumulates score, calls saveLessonQuizResult()
 */


export class LessonQuizService {
  static questionTypes: number = 3;

  async generateQuiz(input: LessonQuizInput): Promise<BaseQuestion> {
    ModelClass.setTemperature(0.3);
    const model = ModelClass.getInstance();

    let chain: any;
    let expectedType: string = "";

    switch (input.difficulty) {
      case 'hard':
        chain = PromptTemplates.lessonQuizFBPrompt.pipe(model);
        expectedType = "fill_blank";
        break;

      case 'medium':
      case 'easy':
      default:
        const randomNumber = Math.floor(Math.random() * 2) + 1;

        if (randomNumber === 1) {
          chain = PromptTemplates.lessonQuizMCQPrompt.pipe(model);
          expectedType = "multiple_choice";
        } else {
          chain = PromptTemplates.lessonQuizTFPrompt.pipe(model);
          expectedType = "true_false";
        }
    }

    if (!chain) throw new Error("Chain is undefined!");

    const safeFallback: MultipleChoiceQuestion = {
      type: "multiple_choice",
      difficulty: input.difficulty,
      questionText: "An error occurred while generating this question. Please select 'Skip'.",
      options: ["Skip", "Skip", "Skip", "Skip"],
      correctOption: 0,
      explanation: "The system was temporarily unable to generate this question."
    };

    const rawResult = await aiRetryHandler<any>(
      async () => {
        const response = await chain.invoke({
          grade: input.grade,
          country: input.country,
          difficulty: input.difficulty,
          question_number: input.question_number,
          questions: JSON.stringify(input.questions)
        });

        // 🔧 FIX: return raw AI text
        return typeof response === "string" ? response : response.content;
      },

      (parsed) => {
        const data = Array.isArray(parsed) ? parsed[0] : parsed;

        if (!data || typeof data !== 'object') return false;
        if (!data.type) return false;
        if (!data.questionText) return false;
        if (!data.explanation) return false;

        if (expectedType === "multiple_choice") {
          if (!Array.isArray(data.options)) return false;
          if (typeof data.correctOption !== "number") return false;
        }

        if (expectedType === "true_false") {
          if (typeof data.correctAnswer !== "boolean") return false;
        }

        if (expectedType === "fill_blank") {
          if (typeof data.correctAnswer !== "string") return false;
        }

        return true;
      },

      safeFallback,
      3
    );

    ModelClass.setTemperature(0.5);

    const finalQuestion = Array.isArray(rawResult) ? rawResult[0] : rawResult;
    return finalQuestion as BaseQuestion;
  }
}
