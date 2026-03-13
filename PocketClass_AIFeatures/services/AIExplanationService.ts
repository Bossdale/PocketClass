import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import type { AIExplanationInput } from '../types/input/AIExplanationInput';

/**
 * AIExplanationService
 *
 * Generates a simplified, grade-calibrated spoken explanation for a lesson
 * section after the initial TTS playback finishes.
 *
 * This is LessonViewScreen's "listen mode" enhancement:
 * 1. Student taps the Volume icon → expo-speech reads the raw section text
 * 2. When that TTS finishes, AIExplanationService.getExplanation() fires
 * 3. The AI rewrites the text as natural spoken language for the student's grade
 * 4. expo-speech reads the AI explanation aloud as a follow-up
 *
 * Output is plain text (not JSON) — returned directly to Speech.speak().
 *
 * Flow:
 * LessonViewScreen.handleTTS()
 * → Speech.speak(rawText, { onDone: fetchExplanation })
 * → AIExplanationService.getExplanation({ text, grade })
 * → ModelClass.getInstance()
 * → PromptTemplates.aiExplanationPrompt.pipe(model)
 * → chain.invoke({ text, grade })
 * ← string  (simplified explanation)
 * → Speech.speak(explanation, ...)
 *
 * Temperature 0.5: balanced — readable and natural without being inaccurate.
 */
export class AIExplanationService {
  async getExplanation(input: AIExplanationInput): Promise<string> {
    console.log("🧠 [STEP 1] AIExplanationService called! Text length:", input.text?.length);

    try {
      const model = ModelClass.getInstance();
      const chain = PromptTemplates.aiExplanationPrompt.pipe(model);

      console.log("🚀 [STEP 2] Model instance fetched. Attempting to send request to Ollama...");

      const response = await chain.invoke({
        text:  input.text,
        grade: String(input.grade),
      });

      console.log("✅ [STEP 3] Success! Received response from Ollama.");
      return String(response.content).trim();
      
    } catch (error) {
      console.error("💥 [STEP 4] ERROR calling Ollama:", error);
      throw error; 
    }
  }
}