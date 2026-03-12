  /**
 * LessonMaterial  (output of LessonMaterialService)
 *
 * The fully parsed AI response for a structured 3-page lesson.
 * Matches exactly the JSON shape defined in PromptTemplates.lessonMaterialPrompt.
 *
 * WHERE IT IS CONSUMED:
 *   LessonView.tsx receives this object and renders each page section
 *   using its renderContent() function, navigating with currentSection state.
 *
 * PAGE BREAKDOWN:
 *   page1 → Introduction card shown first (sets learning context)
 *   page2 → Core content card (the actual teaching material)
 *   page3 → Application card shown last (real-world relevance + recap)
 */

export interface Page1 {
  topic_introduction:  string;
  learning_objectives: string[];
  tip:                 string;
}

export interface Page2 {
  lecture_content: string;
  key_concepts:    string[];
}

export interface Page3 {
  real_life_application: string;
  summary:               string;
}

export interface LessonMaterial {
  page1: Page1;
  page2: Page2;
  page3: Page3;
}
