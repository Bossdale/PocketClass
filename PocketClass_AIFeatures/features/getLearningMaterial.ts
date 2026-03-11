import { ModelClass } from "../model/ModelClass";
import { PromptTemplates } from "../templates/promptTemplates"
import { jsonParser } from "../utils/jsonParser"

export async function getLearningMaterial(){
    const model = ModelClass.getInstance();
    const chain = PromptTemplates.tutorPrompt.pipe(model);

    const response = await chain.invoke({
    topic: "The parts of the body",
    lecture: "example"
    });

    return jsonParser(response.content)
}