import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';
import { jsonToString }    from '../utils/jsonToString';
import type { diagnosticScoreInterface } from '../types/input/diagnosticScoreInterface';
import type { StudyPlan }            from '../types/outputs/StudyPlan';

/**
 * StudyPlanService
 *
 * Generates the personalised post-diagnostic study plan shown on the
 * DiagnosticResultCard after all 4 quarters are complete.
 *
 * This is the only service that uses jsonToString — it needs to convert
 * the string[] lesson arrays (e.g. ["Algebra Basics", "Linear Equations"])
 * into a plain string before injecting them as prompt variables, because
 * PromptTemplate.invoke() requires string values for all variables.
 *
 * Flow:
 *   DiagnosticTestScreen (isCompleted === true)
 *     → StudyPlanService.generateStudyPlan(diagnosticScoreInput)
 *       → ModelClass.getInstance()
 *       → PromptTemplates.diagnosticStudyPlanPrompt.pipe(model)
 *       → chain.invoke(serialised variables)
 *       → jsonParser<StudyPlan>(response)
 *     ← StudyPlan  →  DiagnosticResultCard renders is_need_review + tips
 */
export class StudyPlanService {
  async generateStudyPlan(input: diagnosticScoreInterface): Promise<StudyPlan> {
    const model = ModelClass.getInstance();

    const chain = PromptTemplates.diagnosticStudyPlanPrompt.pipe(model);

    const response = await chain.invoke({
      quarter1_score:   String(input.quarter1_score),
      // jsonToString converts string[] → "Algebra Basics\nLinear Equations"
      quarter1_lessons: jsonToString(input.quarter1_lessons),
      quarter2_score:   String(input.quarter2_score),
      quarter2_lessons: jsonToString(input.quarter2_lessons),
      quarter3_score:   String(input.quarter3_score),
      quarter3_lessons: jsonToString(input.quarter3_lessons),
      quarter4_score:   String(input.quarter4_score),
      quarter4_lessons: jsonToString(input.quarter4_lessons),
    });

    return jsonParser<StudyPlan>(response.content);
  }
}
