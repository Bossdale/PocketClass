import { jsonParser } from "./jsonParser";

export async function aiRetryHandler<T>(
    aiCall: () => Promise<string>,         // The function that triggers the AI
    validator: (data: any) => boolean,     // The rule to check if the output is correct
    fallback: T,                           // The safe data to return if ALL retries fail
    maxRetries: number = 3                 // How many times to try before giving up
): Promise<T> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let rawText = ""; // Declare here so we can access it in the catch block
        
        try {
            console.log(`AI Attempt ${attempt} of ${maxRetries}...`);
            
            // 1. Get the raw string from the AI
            rawText = await aiCall();

            // 2. Pre-clean: Grab only the text between the first and last brackets
            let cleaned = rawText;
            const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                cleaned = match[0];
            }

            // 3. Attempt to parse it (If this fails, it jumps to the catch block)
            const parsedData = jsonParser<T>(cleaned);

            // 4. Validate it! (Check if it has the keys you actually want)
            if (validator(parsedData)) {
                console.log(`AI Attempt ${attempt} successful!`);
                return parsedData; 
            } else {
                console.log(`Attempt ${attempt}: Parsed successfully, but failed your validator rules.`);
                console.log(`DEBUG -> What the AI outputted:\n`, JSON.stringify(parsedData, null, 2));
            }

        } catch (error) {
            console.log(`Attempt ${attempt}: AI output was completely unparsable (Invalid JSON).`);
            console.log(`DEBUG -> Raw AI text was:\n`, rawText);
        }
    }

    // 5. If it fails 3 times, return the fallback so your React Native app NEVER crashes
    console.error("All AI retries failed. Returning safe fallback data.");
    return fallback;
}