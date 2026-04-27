export function jsonParser(raw: any): object {
    // Step 0: Convert to string and trim
    let cleaned = String(raw).trim();

    // Step 1: Remove Markdown code fences (```json and ```)
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "").trim();

    // Step 2: Remove starting and ending quotes if they exist
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }

    // Step 3: Replace all double curly braces with single braces
    cleaned = cleaned.replace(/{{/g, "{").replace(/}}/g, "}");

    // Step 4: Remove any escaped quotes if present
    cleaned = cleaned.replace(/\\"/g, '"');

    // Step 5: Parse JSON
    return JSON.parse(cleaned);
    }