import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';
import type { LessonQuizInput } from '../types/input';
import type { QuizQuestion }    from '../types/output';

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
  async generateQuiz(input: LessonQuizInput): Promise<QuizQuestion[]> {
    ModelClass.setTemperature(0.3);
    const model = ModelClass.getInstance();

    const chain = PromptTemplates.lessonQuizPrompt.pipe(model);

    const response = await chain.invoke({
      lessonTitle: input.lessonTitle,
      content:     input.content,
      grade:       String(input.grade),
      country:     input.country,
    });

    ModelClass.setTemperature(0.5);

    return jsonParser<QuizQuestion[]>(response.content);
  }
}
