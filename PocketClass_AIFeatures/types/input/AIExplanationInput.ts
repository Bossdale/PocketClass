/**
 * AIExplanationInput
 *
 * The data shape passed into AIExplanationService.getExplanation().
 *
 * WHERE IT COMES FROM:
 *   LessonView.tsx builds this inside handleTTS(), after expo-speech
 *   finishes reading the raw lesson section aloud:
 *     - text  → stripMarkdown(lesson.sections[currentSection].content)
 *     - grade → profile.grade
 *
 * WHY text IS STRIPPED OF MARKDOWN:
 *   The text will ultimately be read aloud by expo-speech a second time
 *   as the AI explanation. Markdown symbols (* # [ ] `) would be spoken
 *   literally, which sounds unnatural. Strip them before passing here.
 */
export interface AIExplanationInput {
  text:  string;  // plain-text lesson section content (markdown stripped)
  grade: number;  // student's grade level, e.g. 7–12
}