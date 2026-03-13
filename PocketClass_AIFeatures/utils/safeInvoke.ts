/**
 * SafeInvoke (utility)
 *
 * Wraps an LLM invocation in a retry loop. If the model outputs invalid JSON
 * or fails a custom validation check, it will automatically re-invoke the model
 * up to a specified number of maximum retries.
 *
 * WHY THIS IS NEEDED:
 * Even with strict prompts and `jsonParser`, smaller models occasionally
 * hallucinate malformed syntax or return an object when an array is expected.
 * This utility acts as a safety net to quietly recover from those failures
 * without crashing the app.
 *
 * CONNECTIONS:
 * Used by any service calling LangChain chains:
 * LessonQuizService, QuarterlyExamService, DiagnosticQuizService, etc.
 *
 * EXAMPLES:
 * const result = await safeInvoke<MyType>(
 * () => chain.invoke({ ...variables }),
 * (parsed) => Array.isArray(parsed) && parsed.length > 0, // optional validation
 * 3 // max retries
 * );
 */

import { jsonParser } from './jsonParser';

export async function safeInvoke<T>(
  invokeFn: () => Promise<any>, // Function that returns the raw LangChain response
  validator?: (parsed: T) => boolean, // Optional function to check schema/logic validity
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Call the model
      const response = await invokeFn();
      
      // LangChain usually returns an object with a `.content` string property
      const rawContent = typeof response === 'string' ? response : response.content;

      // 2. Try to parse the raw string into JSON
      // If the JSON is irreparably broken, jsonParser will throw here.
      const parsed = jsonParser<T>(rawContent);

      // 3. Optional validation
      // Even if it parses as valid JSON, is it the right shape? (e.g., an array, has specific keys)
      if (validator && !validator(parsed)) {
        throw new Error('Parsed JSON failed custom schema validation.');
      }

      // 4. Success! Return the parsed object
      return parsed;

    } catch (error) {
      lastError = error;
      console.warn(`[safeInvoke] Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
      // If we haven't hit the max retries, loop continues and tries again.
    }
  }

  // If we exhaust all retries, throw the final error to be handled by the caller.
  throw new Error(`[safeInvoke] Failed completely after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}