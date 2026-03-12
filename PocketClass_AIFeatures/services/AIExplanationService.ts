import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import type { AIExplanationInput } from '../types/input';

/**
 * AIExplanationService
 *
 * Generates a simplified, grade-calibrated spoken explanation for a lesson
 * section after the initial TTS playback finishes.
 *
 * This is LessonViewScreen's "listen mode" enhancement:
 *   1. Student taps the Volume icon → expo-speech reads the raw section text
 *   2. When that TTS finishes, AIExplanationService.getExplanation() fires
 *   3. The AI rewrites the text as natural spoken language for the student's grade
 *   4. expo-speech reads the AI explanation aloud as a follow-up
 *
 * Output is plain text (not JSON) — returned directly to Speech.speak().
 *
 * Flow:
 *   LessonViewScreen.handleTTS()
 *     → Speech.speak(rawText, { onDone: fetchExplanation })
 *       → AIExplanationService.getExplanation({ text, grade })
 *         → ModelClass.getInstance()
 *         → PromptTemplates.aiExplanationPrompt.pipe(model)
 *         → chain.invoke({ text, grade })
 *       ← string  (simplified explanation)
 *       → Speech.speak(explanation, ...)
 *
 * Temperature 0.5: balanced — readable and natural without being inaccurate.
 */
export class AIExplanationService {
  async getExplanation(input: AIExplanationInput): Promise<string> {
    const model = ModelClass.getInstance();

    const chain = PromptTemplates.aiExplanationPrompt.pipe(model);

    const response = await chain.invoke({
      text:  input.text,
      grade: String(input.grade),
    });

    return String(response.content).trim();
  }
}
