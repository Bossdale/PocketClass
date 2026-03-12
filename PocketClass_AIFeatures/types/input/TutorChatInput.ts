/**
 * ChatHistoryEntry
 *
 * A single turn in the AI tutor conversation.
 * Maps directly to the shape used by LangChain's message history.
 *
 * WHERE IT COMES FROM:
 *   AITutor.tsx maps its `messages` state before calling the service:
 *     [...messages].map(m => ({ role: m.role, content: m.content }))
 *   The full history is sent on every call so the model has context.
 */
export interface ChatHistoryEntry {
  role:    'user' | 'tutor';
  content: string;
}

/**
 * TutorChatInput
 *
 * The data shape passed into AITutorService.getResponse().
 *
 * WHERE IT COMES FROM:
 *   AITutor.tsx constructs this inside sendMessage():
 *     - lessonTitle → lessonTitle prop (e.g. "The Human Digestive System")
 *     - history     → all previous messages + the new user message
 *
 * lessonTitle anchors the conversation so the model stays on-topic for
 * the specific lesson being studied, not general knowledge.
 */
export interface TutorChatInput {
  lessonTitle: string;
  history:     ChatHistoryEntry[];
}
