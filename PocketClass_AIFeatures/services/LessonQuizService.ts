import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';
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

// export class LessonQuizService {
//   static questionTypes : number = 3;
//   async generateQuiz(input: LessonQuizInput): Promise<BaseQuestion> {
//     ModelClass.setTemperature(0.1);
//     const model = ModelClass.getInstance();

//     let chain: any;
//       if (input.difficulty === 'hard') {
//         chain = PromptTemplates.lessonQuizFBPrompt.pipe(model); 
//       } else {
//         // randomly pick MCQ or TF for non-hard
//         const randomNumber = Math.floor(Math.random() * 2) + 1; // 1 or 2
//         switch (randomNumber) {
//           case 1:
//             chain = PromptTemplates.lessonQuizMCQPrompt.pipe(model);
//             break;
//           case 2:
//             chain = PromptTemplates.lessonQuizMCQPrompt.pipe(model);
//             break;
//         }
//       }

//     // Safety check
//     if (!chain) throw new Error("Chain is undefined! Check prompts or model instance.");

//     if(input.difficulty == 'hard'){chain = PromptTemplates.lessonQuizFBPrompt.pipe(model);}
//     const response = await chain.invoke({
//       grade: input.grade,
//       country: input.country,
//       difficulty: input.country,
//       question_number: input.question_number,
//       questions: input.questions
//     });

//     ModelClass.setTemperature(0.5);

//     return jsonParser<BaseQuestion>(response.content);
//   }
// }


export class LessonQuizService {
  static questionTypes : number = 3;

  async generateQuiz(input: LessonQuizInput): Promise<BaseQuestion> {
    // 1. Setup Model
    ModelClass.setTemperature(0.1);
    const model = ModelClass.getInstance();

    let chain: any;
    let expectedType: string = "";

    // 2. Determine Question Type by Difficulty
    switch (input.difficulty) {
      case 'hard':
        chain = PromptTemplates.lessonQuizFBPrompt.pipe(model); 
        expectedType = "fill_blank";
        break;

      case 'medium':
      case 'easy':
      default:
        // Randomly pick MCQ or TF for easy/medium
        const randomNumber = Math.floor(Math.random() * 2) + 1; // 1 or 2
        
        switch (randomNumber) {
          case 1:
            chain = PromptTemplates.lessonQuizMCQPrompt.pipe(model);
            expectedType = "multiple_choice";
            break;
          case 2:
            // Note: Change to lessonQuizTFPrompt and "true_false" once you create it!
            chain = PromptTemplates.lessonQuizMCQPrompt.pipe(model);
            expectedType = "multiple_choice";
            break;
        }
        break;
    }

    if (!chain) throw new Error("Chain is undefined! Check prompts or model instance.");

    // 3. Define the Safe Fallback
    const safeFallback = {
        type: "multiple_choice",
        difficulty: input.difficulty,
        questionText: "An error occurred while generating this question. Please select 'Skip'.",
        options: ["Skip", "Skip", "Skip", "Skip"],
        correctOption: 0,
        explanation: "The system was temporarily unable to generate this question."
    } as MultipleChoiceQuestion;

    // 4. Wrap the execution in the Retry Handler
    // Note: We use <any> because the AI might temporarily return an array
    const rawResult = await aiRetryHandler<any>(
        
        // Function 1: The AI Call
        async () => {
            const response = await chain.invoke({
                grade: input.grade,
                country: input.country,
                difficulty: input.difficulty, 
                question_number: input.question_number,
                content: JSON.stringify(input.questions) // Passes the lesson content securely
            });
            return response.content as string;
        },

        // Function 2: The Dynamic Validator
        (parsed) => {
            // ✨ ARRAY-PROOF LOGIC: If it's an array, validate the first item
            const data = Array.isArray(parsed) ? parsed[0] : parsed;

            if (!data || typeof data !== 'object') return false;
            if (!data.type || !data.explanation) return false;

            if (expectedType === 'multiple_choice' && !Array.isArray(data.options)) return false;
            if (expectedType === 'fill_blank' && typeof data.correctAnswer !== 'string') return false;
            // Add a check for 'true_false' here later!

            return true;
        },

        // The Fallback and Retries
        safeFallback,
        3
    );

    // 5. Cleanup and Return
    ModelClass.setTemperature(0.5);

    // ✨ FINAL ARRAY-PROOF UNWRAP: Guarantee the UI gets the Object, not the Array
    const finalQuestion = Array.isArray(rawResult) ? rawResult[0] : rawResult;
    
    return finalQuestion as BaseQuestion;
  }
}
