/**
 * JsonToString  (utility)
 *
 * Ensures any value injected into a LangChain prompt variable is a string.
 *
 * WHY THIS IS NEEDED:
 *   LangChain PromptTemplate.invoke() expects all variable values to be
 *   strings.  If a caller passes an array or an object, the template will
 *   either throw or produce "[object Object]" in the prompt.
 *
 *   This utility is a single, tested place to handle that coercion.
 *
 * CONNECTIONS:
 *   Called by → AITutorService  (serialises the ChatHistoryEntry[] array
 *                                into a readable string before injecting
 *                                into aiTutorChatPrompt)
 *             → AIExplanationService  (ensures the lesson text is always
 *                                      a plain string before prompt injection)
 *
 * EXAMPLES:
 *   jsonToString("hello")           → "hello"
 *   jsonToString(["a", "b"])        → '["a","b"]'
 *   jsonToString({ x: 1 })          → '{"x":1}'
 */
export function jsonToString(content: unknown): string {
  const contentString =
    typeof content === 'string'
      ? content
      : JSON.stringify(content);

  return contentString;
}