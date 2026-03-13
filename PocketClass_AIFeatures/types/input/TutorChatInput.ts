/**
 * TutorChatInput
 *
 * The data shape passed into AITutorService.getResponse().
 *
 * ── TAILORING FIELDS ─────────────────────────────────────────────────────────
 *   Every field beyond lessonTitle and history exists so the model can tailor
 *   its response to the specific student:
 *
 *   name          → the model addresses the student by name ("Great question,
 *                   Amirah!"), making the experience feel personal
 *   grade         → controls vocabulary complexity and example depth
 *                   Grade 7: simple analogies, everyday language
 *                   Grade 12: technical vocabulary, abstract reasoning allowed
 *   country       → localises examples to the student's context
 *                   (Malaysian geography, Indonesian culture, Bruneian context)
 *   subjectName   → keeps the model domain-aware ("In Science, this means...")
 *   lessonContent → the model answers FROM what the student actually studied,
 *                   not from general world knowledge — prevents the tutor from
 *                   going off-curriculum or giving grade-inappropriate answers
 *
 * ── WHERE EACH FIELD COMES FROM (AITutor.tsx) ────────────────────────────────
 *   name          → profile.name
 *   grade         → profile.grade
 *   country       → profile.country
 *   subjectName   → subject.name         (passed as prop from LessonView.tsx)
 *   lessonTitle   → lesson.title
 *   lessonContent → lesson.sections.map(s => s.content).join('\n')
 *                   (already populated by LessonMaterialService before the
 *                    student can open the tutor; AITutor.tsx is gated behind
 *                    lesson sections being loaded)
 *   history       → all previous messages + the new user message appended
 *
 * ── HOW TO BUILD IT ──────────────────────────────────────────────────────────
 *   const input: TutorChatInput = {
 *     name:          profile.name,
 *     grade:         profile.grade,
 *     country:       profile.country,
 *     subjectName:   subject.name,
 *     lessonTitle:   lesson.title,
 *     lessonContent: lesson.sections.map(s => s.content).join('\n'),
 *     history:       [...messages, { role: 'user', content: userText }],
 *   };
 */

/**
 * A single turn in the AI tutor conversation.
 * Both the student message and the tutor reply are stored here before being
 * persisted to chat_messages in the database.
 */
export interface ChatHistoryEntry {
  role:    'user' | 'tutor';
  content: string;
}

export interface TutorChatInput {
  // ── Student identity (tailoring) ─────────────────────────────────────────
  name:    string;   // profile.name    — used to address the student directly
  grade:   number;   // profile.grade   — 7–12; controls vocabulary + depth
  country: string;   // profile.country — 'indonesia' | 'malaysia' | 'brunei'

  // ── Lesson context (grounding) ────────────────────────────────────────────
  subjectName:   string;   // subject.name — domain anchor ("Science", "Mathematics")
  lessonTitle:   string;   // lesson.title — topic anchor for on-topic redirection
  lessonContent: string;   // lesson.sections joined — the model answers from this

  // ── Conversation ──────────────────────────────────────────────────────────
  history: ChatHistoryEntry[];   // full history + new user message appended
}