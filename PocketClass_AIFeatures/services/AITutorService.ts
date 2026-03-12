import { ModelClass }        from '../model/ModelClass';
import { PromptTemplates }   from '../templates/promptTemplates';
import { historyToString }   from '../utils/jsonToString';
import type { TutorChatInput } from '../types/input';

/**
 * AITutorService
 *
 * Generates the AI tutor's next reply in a lesson-scoped conversation.
 *
 * The local gemma:2b model is fully stateless — it has no memory between
 * invocations.  To simulate a coherent conversation, the entire
 * ChatHistoryEntry[] is serialised to a readable string and injected into
 * the prompt on every single call via historyToString().
 *
 * Output is a plain string (not JSON), so jsonParser is NOT used here.
 * The raw response.content is returned directly to the AITutor component.
 *
 * Flow:
 *   AITutor component (user presses Send)
 *     → saveChatMessage(userMsg)
 *     → AITutorService.getResponse({ lessonTitle, history })
 *         history includes ALL previous messages + the new user message
 *       → historyToString(history)  →  "Student: ...\nTutor: ...\nStudent: ..."
 *       → ModelClass.getInstance()
 *       → PromptTemplates.aiTutorChatPrompt.pipe(model)
 *       → chain.invoke({ lessonTitle, history: serialisedHistory })
 *     ← string  (tutor's reply)
 *     → saveChatMessage(tutorMsg)
 *     → appended to messages state → rendered as chat bubble
 *
 * Temperature 0.7: conversational responses benefit from slight creativity
 * without becoming inaccurate.
 */
export class AITutorService {
  async getResponse(input: TutorChatInput): Promise<string> {
    ModelClass.setTemperature(0.7);
    const model = ModelClass.getInstance();

    const chain = PromptTemplates.aiTutorChatPrompt.pipe(model);

    // Serialise history array to a readable conversation string
    const serialisedHistory = historyToString(input.history);

    const response = await chain.invoke({
      lessonTitle: input.lessonTitle,
      history:     serialisedHistory,
    });

    ModelClass.setTemperature(0.5);

    // Return the plain text reply — no JSON parsing needed
    return String(response.content).trim();
  }
}
