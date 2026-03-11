import { ModelClass } from "../model/ModelClass";
import { PromptTemplates } from "../templates/promptTemplates";
import { diagnosticScoreInterface } from "../types/input/diagnosticScoreInterface";
import { jsonParser } from "../utils/jsonParser";

export async function getStudyTips(data: diagnosticScoreInterface) {
    const llm = ModelClass.getInstance();
    const executor = PromptTemplates.diagnosticStudyPlanPrompt.pipe(llm);
    const response = await executor.invoke({
        quarter1_score: data.quarter1_score,
        quarter1_lessons: data.quarter1_lessons,
        quarter2_score: data.quarter2_score,
        quarter2_lessons: data.quarter2_lessons,
        quarter3_score: data.quarter3_score,
        quarter3_lessons: data.quarter3_lessons,
        quarter4_score: data.quarter4_score,
        quarter4_lessons: data.quarter4_lessons,
    });

    return jsonParser(response.content);
}
