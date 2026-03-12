/**
 * StudyPlanQuarter  (one quarter block inside StudyPlan)
 *
 * FIELDS:
 *   lessons             → comma-separated lesson names for this quarter
 *   is_need_review      → true when score < 76 (AI decides based on priority rules)
 *   how_to_get_high_scores → numbered list of actionable study strategies
 *   focus_level         → "High Priority" | "Moderate Priority" | "Low Priority"
 *                         derived from score band in the prompt:
 *                           0–50   → High Priority
 *                           51–75  → Moderate Priority
 *                           76–100 → Low Priority
 */
export interface StudyPlanQuarter {
  lessons:                string;
  is_need_review:         boolean;
  how_to_get_high_scores: string;
  focus_level:            'High Priority' | 'Moderate Priority' | 'Low Priority';
}

/**
 * StudyPlan  (output of StudyPlanService)
 *
 * The fully parsed AI response for a personalised post-diagnostic study plan.
 * Matches exactly the JSON shape in PromptTemplates.diagnosticStudyPlanPrompt.
 *
 * WHERE IT IS CONSUMED:
 *   DiagnosticResultCard.tsx reads this to render the "📋 Study Plan" section
 *   and the weak quarter pills after the student completes the diagnostic test.
 */
export interface StudyPlan {
  quarter1: StudyPlanQuarter;
  quarter2: StudyPlanQuarter;
  quarter3: StudyPlanQuarter;
  quarter4: StudyPlanQuarter;
}
