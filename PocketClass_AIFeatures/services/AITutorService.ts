import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonToString }    from '../utils/jsonToString';

import type { TutorChatInput, ChatHistoryEntry } from '../types/input/TutorChatInput';

/**
 * AITutorService
 *
 * Powers the floating AI tutor chatbot on LessonView.tsx.
 * The full conversation history is sent on every call — the model has no
 * persistent memory between invocations.
 *
 * ── TAILORING ─────────────────────────────────────────────────────────────────
 *   Every response is personalised using four dimensions:
 *
 *   WHO   name + grade  → addresses student by name; matches vocabulary to
 *                          their year level (Grade 7 = analogies + simple terms,
 *                          Grade 12 = technical terms allowed)
 *   WHERE country       → localises examples to the student's real context
 *                          (Malaysian, Indonesian, or Bruneian references)
 *   WHAT  lessonContent → model answers strictly from the lesson the student
 *                          just read — never from general world knowledge;
 *                          prevents off-curriculum and grade-inappropriate answers
 *
 * ── SCHEMA ───────────────────────────────────────────────────────────────────
 *   READ  profiles.name          → TutorChatInput.name
 *   READ  profiles.grade         → TutorChatInput.grade
 *   READ  profiles.country       → TutorChatInput.country
 *   READ  subjects.name          → TutorChatInput.subjectName
 *   READ  lessons.title          → TutorChatInput.lessonTitle
 *   READ  lessons.sections[]     → TutorChatInput.lessonContent  (joined text)
 *   READ  chat_messages          → TutorChatInput.history
 *   WRITE chat_messages          ← both user message + tutor reply saved by AITutor.tsx
 *
 * ── UI ───────────────────────────────────────────────────────────────────────
 *   Component : AITutor.tsx  (floating FAB on LessonView.tsx)
 *   Trigger   : student sends a message (sendMessage)
 *   Renders   : chat bubble with plain-text reply
 *   Persists  : both turns written to chat_messages after each exchange
 *
 * ── FLOW ─────────────────────────────────────────────────────────────────────
 *   AITutor.tsx (sendMessage)
 *     → append new user message to history
 *     → build TutorChatInput { name, grade, country, subjectName,
 *                               lessonTitle, lessonContent, history }
 *     → AITutorService.getResponse(input)
 *         → formatHistory(input.history)   // array → "Student: …\nTutor: …"
 *         → ModelClass @ temp 0.5
 *         → aiTutorChatPrompt.pipe(model).invoke({ ...all fields })
 *         → jsonToString(raw.content).trim()
 *     → append tutor reply to chat state
 *     → save both turns to chat_messages
 *
 * ── OUTPUT ───────────────────────────────────────────────────────────────────
 *   string  — plain text, no JSON, no markdown; fed directly into a chat bubble
 *
 * ── TEMPERATURE ──────────────────────────────────────────────────────────────
 *   0.5 — balanced tone; do NOT lower (makes responses robotic and impersonal)
 */
export class AITutorService {

  /**
   * Returns the AI tutor's next conversational reply, tailored to the student.
   *
   * @param input  Student identity, lesson context, and full conversation history
   * @returns      Plain text reply ready for direct display in a chat bubble
   */
  static async getResponse(input: TutorChatInput): Promise<string> {
    ModelClass.setTemperature(0.5);
    const model         = ModelClass.getInstance();
    const historyString = AITutorService.formatHistory(input.history);
    const chain         = PromptTemplates.aiTutorChatPrompt.pipe(model);

    const raw = await chain.invoke({
      name:          input.name,
      grade:         String(input.grade),
      country:       input.country,
      subjectName:   input.subjectName,
      lessonTitle:   input.lessonTitle,
      lessonContent: input.lessonContent,
      history:       historyString,
    });

    return jsonToString(raw.content).trim();
  }

  /**
   * Serialises ChatHistoryEntry[] into a readable dialogue string for the prompt.
   * LangChain PromptTemplate variables must be strings — passing the array
   * directly would produce "[object Object]".
   *
   * Input  : [{ role: 'user', content: 'What is osmosis?' },
   *           { role: 'tutor', content: 'Osmosis is...' }]
   * Output : "Student: What is osmosis?\nTutor: Osmosis is..."
   */
  private static formatHistory(history: ChatHistoryEntry[]): string {
    if (history.length === 0) return '(No messages yet)';
    return history
      .map(entry => {
        const speaker = entry.role === 'user' ? 'Student' : 'Tutor';
        return `${speaker}: ${entry.content}`;
      })
      .join('\n');
  }
}