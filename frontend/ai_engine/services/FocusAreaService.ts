import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';

import type { FocusAreaRequest  } from '../input/focusAreaRequestInterface';
import type { FocusAreaResponse } from '../input/focusAreaResponseInterface';

/**
 * FocusAreaService
 *
 * Generates the dashboard "Focus Area" widget — a brief, action-oriented
 * snapshot of the student's weakest subject and lesson with a study call-to-action.
 *
 * ── SCHEMA ───────────────────────────────────────────────────────────────────
 *   READ  subjects.name          → FocusAreaRequest.subject_name
 *   READ  subjects.mastery       → FocusAreaRequest.subject_mastery
 *   READ  lessons.title          → FocusAreaRequest.lesson_title
 *   READ  lessons.latest_quiz_score → FocusAreaRequest.lesson_score
 *   READ  lesson_sections.content (joined) → FocusAreaRequest.lesson_content
 *   WRITE focus_areas            ← FocusAreaResponse persisted after generation
 *
 * ── UI ───────────────────────────────────────────────────────────────────────
 *   Component : DashboardWidget.tsx  (home screen focus card)
 *   Trigger   : on dashboard mount, or after quiz score update
 *   Renders   : subject_line, lesson_line, take_note
 *
 * ── FLOW ─────────────────────────────────────────────────────────────────────
 *   DashboardWidget
 *     → query DB for lowest mastery subject + lowest quiz_score lesson
 *     → build FocusAreaRequest
 *     → FocusAreaService.getFocusArea(input)
 *         → ModelClass @ temp 0.3  (deterministic; widget must be consistent)
 *         → focusAreaPrompt.pipe(model).invoke({ ...fields })
 *         → jsonParser<FocusAreaResponse>(raw.content)
 *     ← FocusAreaResponse  → persisted to focus_areas table
 *
 * ── OUTPUT ───────────────────────────────────────────────────────────────────
 *   FocusAreaResponse {
 *     subject_line : "Biology - 42% mastery"
 *     lesson_line  : "The Human Digestive System - 38% quiz result"
 *     take_note    : "Review [concepts] and retake the quizzes."
 *   }
 *
 * ── TEMPERATURE ──────────────────────────────────────────────────────────────
 *   0.3 — low; dashboard widget must produce consistent, non-creative output.
 */
export class FocusAreaService {

  /**
   * Generates a focused study action plan for the student's weakest area.
   *
   * @param input  Weakest subject + lesson metadata with curriculum concepts
   * @returns      FocusAreaResponse ready to render on the dashboard
   */
  static async getFocusArea(input: FocusAreaRequest): Promise<FocusAreaResponse> {
    ModelClass.setTemperature(0.3);
    const model = ModelClass.getInstance();
    const chain = PromptTemplates.focusAreaPrompt.pipe(model);

    const raw = await chain.invoke({
      subject_name:    input.subject_name,
      subject_mastery: String(input.subject_mastery),
      lesson_title:    input.lesson_title,
      lesson_score:    String(input.lesson_score),
      lesson_content:  input.lesson_content,
    });

    ModelClass.setTemperature(0.5);

    return jsonParser<FocusAreaResponse>(raw.content);
  }
}