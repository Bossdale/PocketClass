import { ModelClass } from "../model/ModelClass";
import { PromptTemplates } from "../templates/promptTemplates";
import { FocusAreaRequest } from "../types/input/focusAreaRequestInterface";
import { FocusAreaResponse } from "../types/outputs/focusAreaResponseInterface";
import { jsonParser } from "../utils/jsonParser";

export async function generateFocusArea(data: FocusAreaRequest): Promise<FocusAreaResponse | null> {
    const llm = ModelClass.getInstance();
    const executor = PromptTemplates.focusAreaPrompt.pipe(llm);

    console.log(`Analyzing focus area for: ${data.subject_name} -> ${data.lesson_title}...`);

    const response = await executor.invoke({
        subject_name: data.subject_name,
        subject_mastery: data.subject_mastery.toString(),
        lesson_title: data.lesson_title,
        lesson_score: data.lesson_score.toString(),
        lesson_content: data.lesson_content
    });

    const parsedFocusArea = jsonParser(response.content) as FocusAreaResponse;
    return parsedFocusArea;
        
}