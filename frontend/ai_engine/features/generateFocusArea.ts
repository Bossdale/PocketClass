import { ModelClass } from "../model/ModelClass";
import { PromptTemplates } from "../templates/promptTemplates";
import { FocusAreaRequest } from "../input/focusAreaRequestInterface";
import { FocusAreaResponse } from "../input/focusAreaResponseInterface";
import { jsonParser } from "../utils/jsonParser";

export async function generateFocusArea(data: FocusAreaRequest): Promise<FocusAreaResponse | null> {
    const llm = ModelClass.getInstance();
    const executor = PromptTemplates.focusAreaPrompt.pipe(llm);

    console.log(`Analyzing focus area for: ${data.subject_name} -> ${data.lesson_title}...`);

    try {
        const response = await executor.invoke({
            subject_name: data.subject_name,
            subject_mastery: data.subject_mastery.toString(),
            lesson_title: data.lesson_title,
            lesson_score: data.lesson_score.toString(),
            lesson_content: data.lesson_content
        });

        let rawContent = response.content as string;
        const firstBrace = rawContent.indexOf('{');
        const lastBrace = rawContent.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            rawContent = rawContent.substring(firstBrace, lastBrace + 1);
        }

        const parsedFocusArea = jsonParser(rawContent) as FocusAreaResponse;
        
        return parsedFocusArea;
        
    } catch (error) {
        console.error(`Failed to generate Focus Area for ${data.subject_name}. Error:`, error);
        return null; 
    }
}