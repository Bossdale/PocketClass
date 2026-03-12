/**
 * DiagnosticQuizService
 *
 * Generates 5 easy multiple-choice questions for ONE quarter of the diagnostic
 * test, grounded in the subject's seeded curriculum content.
 *
 * SCHEMA
 *   subjects.q{n}_topic    → quarterTopic   (e.g. "Algebra Basics")
 *   subjects.q{n}_content  → quarterContent (raw curriculum text the AI reads)
 *   profiles.grade         → grade
 *   profiles.country       → country
 *   diagnostic_results     ← scores written here after all 4 quarters complete
 *
 * UI
 *   Screen : DiagnosticTest.tsx
 *   Hook   : hooks/use-diagnostic.ts  (calls this service 4× — once per quarter)
 *   After  : scores saved to diagnostic_results; StudyPlanService called;
 *            result shown in DiagnosticResultCard.tsx
 *
 * FLOW
 *   useDiagnostic
 *     → dbGetSubjectById(subjectId)          // read q{n}_topic + q{n}_content
 *     → DiagnosticQuizService.generateQuestions(input)
 *         → ModelClass @ temp 0.2
 *         → diagnosticQuizPrompt.pipe(model).invoke(...)
 *         → jsonParser<MultipleChoiceQuestion[]>(raw.content)
 *     → DiagnosticTest.tsx renders 5 questions
 *
 * OUTPUT  MultipleChoiceQuestion[]  (5 items, all difficulty = "easy")
 * TEMP    0.2 — deterministic; quiz answers must be consistent
 */

import { ModelClass }      from '../model/ModelClass';
import { PromptTemplates } from '../templates/promptTemplates';
import { jsonParser }      from '../utils/jsonParser';

import type { DiagnosticQuizInput }    from '../types/input/diagnosticQuizInput';
import type { MultipleChoiceQuestion } from '../types/outputs/quizQuestion';

export class DiagnosticQuiz {

  /**
   * Generates 5 MCQ baseline questions for a single quarter.
   * Called 4× by useDiagnostic (Q1 → Q2 → Q3 → Q4).
   *
   * @param input  Subject name, quarter, topic + curriculum content, grade, country
   * @returns      5 MultipleChoiceQuestion objects, all difficulty "easy"
   */
  static async generateQuestions(
    input: DiagnosticQuizInput,
  ): Promise<MultipleChoiceQuestion[]> {
    ModelClass.setTemperature(0.3);

    const model = ModelClass.getInstance();
    const chain = PromptTemplates.diagnosticQuizPrompt.pipe(model);

    const raw = await chain.invoke({
      subjectName:    input.subjectName,
      quarter:        String(input.quarter),
      quarterTopic:   input.quarterTopic,
      quarterContent: input.quarterContent,
      grade:          String(input.grade),
      country:        input.country,
    });

    ModelClass.setTemperature(0.5);

    return jsonParser<MultipleChoiceQuestion[]>(raw.content);
  }
}