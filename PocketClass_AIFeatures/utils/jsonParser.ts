/**
 * JsonParser  (utility)
 *
 * Sanitises raw LLM output and parses it into a typed JavaScript object.
 *
 * WHY THIS IS NEEDED:
 *   Ollama / gemma:2b does not always return clean JSON.  Common issues:
 *     • Response wrapped in  ```json ... ```  markdown fences
 *     • Outer double-quotes wrapping the entire JSON string
 *     • Double curly braces {{ }} from LangChain prompt escaping
 *     • Escaped inner quotes  \"  that break JSON.parse()
 *
 *   Every AI service pipes its raw response through jsonParser() before
 *   returning data to the calling screen.
 *
 * CONNECTIONS:
 *   Called by → DiagnosticQuizService, StudyPlanService, LessonMaterialService,
 *               LessonQuizService, QuarterlyExamService
 *   (AITutorService and AIExplanationService return plain strings, not JSON.)
 *
 * GENERIC OVERLOAD:
 *   The function accepts a type parameter T so callers get a typed return:
 *     const material = jsonParser<LessonMaterial>(response.content);
 *   This avoids type-casting at every call site.
 */
export function jsonParser<T = object>(raw: unknown): T {
  // Step 0: Coerce to string and trim surrounding whitespace
  let cleaned = String(raw).trim();

  // Step 1: Strip Markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/,      '')
    .replace(/```\s*$/,      '')
    .trim();

  // Step 2: Unwrap outer double-quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  // Step 3: Replace escaped double curly braces from LangChain templates
  cleaned = cleaned.replace(/\{\{/g, '{').replace(/\}\}/g, '}');

  // MODIFIED HEURISTIC: Fix unescaped double quotes within string values.
  // We place this here so it works on the most "stable" version of the string.
  cleaned = cleaned.replace(/: \s*"(.*?)"\s*([,}])/g, (match, content, suffix) => {
    const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
    return `: "${escapedContent}"${suffix}`;
  });

  // REMOVED STEP 4: Do not globally unescape \" anymore. 
  // It was causing the "Expected ',' or '}'" syntax errors.

  // Step 5: Extract the outermost JSON block.
  {
    const firstBrace   = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let start = -1;
    let open: string;
    let close: string;

    if (firstBrace === -1 && firstBracket === -1) {
      return JSON.parse(cleaned) as T;
    } else if (firstBrace === -1 || (firstBracket !== -1 && firstBracket < firstBrace)) {
      start = firstBracket;
      open  = '[';
      close = ']';
    } else {
      start = firstBrace;
      open  = '{';
      close = '}';
    }

    let depth = 0;
    let end   = -1;
    let inString = false;

    for (let i = start; i < cleaned.length; i++) {
      const ch   = cleaned[i];
      const prev = i > 0 ? cleaned[i - 1] : '';

      if (ch === '"' && prev !== '\\') {
        inString = !inString;
      }
      if (!inString) {
        if (ch === open)  depth++;
        if (ch === close) depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end !== -1) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }

  // Step 6: Parse the cleaned string
  const parsed = JSON.parse(cleaned);

  // Step 7: Array-wrapping safety net
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'type' in parsed
  ) {
    return [parsed] as unknown as T;
  }

  return parsed as T;
}