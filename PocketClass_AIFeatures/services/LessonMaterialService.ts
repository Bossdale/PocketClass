import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';
import type { LessonMaterialInput } from '../types/input/';
import type { LessonMaterial }      from '../types/outputs/';

/**
 * LessonMaterialService
 *
 * Generates the 3-page structured lesson content for a given topic.
 * This is the AI-generated counterpart to the static `lessons.sections`
 * stored in SQLite — it is used when the lesson has no pre-seeded content
 * or when AI-generated enrichment is desired.
 *
 * The `lecture` parameter carries whatever seed content exists for the topic
 * (could be a short outline, a paragraph, or even just the topic title
 * repeated). The model expands it into the full 3-page structure.
 *
 * Flow:
 *   LessonViewScreen (mode === 'content', first section load)
 *     → LessonMaterialService.generateMaterial({ topic, lecture })
 *       → ModelClass.getInstance()
 *       → PromptTemplates.lessonMaterialPrompt.pipe(model)
 *       → jsonParser<LessonMaterial>(response)
 *     ← LessonMaterial
 *       page1 → Section 1 (Introduction + objectives + tip)
 *       page2 → Section 2 (Core content + key concepts)
 *       page3 → Section 3 (Real-life application + summary)
 *
 * The page structure maps directly to the `lesson.sections` array that
 * LessonViewScreen already knows how to render via renderContent().
 */
export class LessonMaterialService {
  async generateMaterial(input: LessonMaterialInput): Promise<LessonMaterial> {
    // Slightly higher temperature for richer, more engaging lesson prose
    ModelClass.setTemperature(0.6);
    const model = ModelClass.getInstance();

    const chain = PromptTemplates.lessonMaterialPrompt.pipe(model);

    const response = await chain.invoke({
      topic:   input.topic,
      lecture: input.lecture,
    });

    ModelClass.setTemperature(0.5);

    return jsonParser<LessonMaterial>(response.content);
  }
}
