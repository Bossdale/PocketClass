import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';
import type { LessonQuizInput } from '../types/input/LessonQuizInput';
import type{ BaseQuestion} from '../types/outputs/quizQuestion';

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
  static questionTypes : number = 3;
  async generateQuiz(input: LessonQuizInput): Promise<BaseQuestion> {
    ModelClass.setTemperature(0.3);
    const model = ModelClass.getInstance();

    let chain: any;
      if (input.difficulty === 'hard') {
        chain = PromptTemplates.lessonQuizFBPrompt.pipe(model); 
      } else {
        // randomly pick MCQ or TF for non-hard
        const randomNumber = Math.floor(Math.random() * 2) + 1; // 1 or 2
        switch (randomNumber) {
          case 1:
            chain = PromptTemplates.lessonQuizTFPrompt.pipe(model);
            break;
          case 2:
            chain = PromptTemplates.lessonQuizTFPrompt.pipe(model);
            break;
        }
      }

      // Safety check
      if (!chain) throw new Error("Chain is undefined! Check prompts or model instance.");


    if(input.difficulty == 'hard'){chain = PromptTemplates.lessonQuizFBPrompt.pipe(model);}
    const response = await chain.invoke({
      grade: input.grade,
      country: input.country,
      difficulty: input.country,
      question_number: input.question_number,
      questions: input.questions
    });

    ModelClass.setTemperature(0.5);

    return jsonParser<BaseQuestion>(response.content);
  }
}
