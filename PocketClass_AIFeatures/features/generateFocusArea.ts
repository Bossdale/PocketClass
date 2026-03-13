import { ModelClass } from "../model/ModelClass";
import { PromptTemplates } from "../templates/promptTemplates";
import { FocusAreaRequest } from "../types/input/focusAreaRequestInterface";
import { FocusAreaResponse } from "../types/outputs/focusAreaResponseInterface";
import { aiRetryHandler } from "../utils/aiRetryHandler"; // <-- Import your new utility

export async function generateFocusArea(data: FocusAreaRequest): Promise<FocusAreaResponse> {
    const llm = ModelClass.getInstance();
    const executor = PromptTemplates.focusAreaPrompt.pipe(llm);

    // 1. Define the safe fallback just in case the AI completely breaks
    const safeFallback: FocusAreaResponse = {
        subject_line: `${data.subject_name} - ${data.subject_mastery}% mastery`,
        lesson_line: `${data.lesson_title} - ${data.lesson_score}% quiz result`,
        take_note: "Review your notes for this lesson and try taking a practice quiz to improve your score."
    };

    // 2. Call your new retry utility
    const finalResult = await aiRetryHandler<FocusAreaResponse>(
        // Function 1: The AI Call
        async () => {
            const response = await executor.invoke({
                subject_name: data.subject_name,
                subject_mastery: data.subject_mastery.toString(),
                lesson_title: data.lesson_title,
                lesson_score: data.lesson_score.toString(),
                lesson_content: data.lesson_content
            });
            return response.content as string;
        },
        
        // Function 2: The Validator (Make sure it didn't give you garbage)
        (parsed) => {
            // It ONLY passes if it has all 3 exact keys we asked for
            return parsed && 
                   typeof parsed.subject_line === 'string' && 
                   typeof parsed.lesson_line === 'string' && 
                   typeof parsed.take_note === 'string';
        },

        // The Fallback and Retries
        safeFallback,
        3 
    );

    return finalResult;
}