import { jsonParser } from "./jsonParser";

export async function aiRetryHandler<T>(
  aiCall: () => Promise<string>,
  validator: (data: any) => boolean,
  fallback: T,
  maxRetries: number = 3
): Promise<T> {

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let rawText = "";

    try {
      console.log(`AI Attempt ${attempt} of ${maxRetries}...`);

      rawText = await aiCall();

      if (!rawText) {
        throw new Error("AI returned empty response");
      }

      let cleaned = rawText;
      const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

      if (match) {
        cleaned = match[0];
      }

      const parsedData = jsonParser<T>(cleaned);

      if (validator(parsedData)) {
        console.log(`AI Attempt ${attempt} successful!`);
        return parsedData;
      } else {
        console.log(`Attempt ${attempt}: Parsed but failed validation.`);
        console.log(JSON.stringify(parsedData, null, 2));
      }

    } catch (error) {
      console.log(`Attempt ${attempt}: Invalid AI output.`);
      console.log("Raw AI text:", rawText);
    }
  }

  console.error("All AI retries failed. Returning safe fallback data.");
  return fallback;
}