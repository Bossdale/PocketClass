/**
 * PromptTemplates  (Static Registry)
 *
 * Single source of truth for every LangChain prompt in the app.
 * All prompts are static — instantiated once at module load, shared by every
 * service with no allocation cost per call.
 *
 * ── PROMPT → SERVICE MAP ─────────────────────────────────────────────────────
 *   diagnosticQuizPrompt      → DiagnosticQuizService   (5 MCQ per quarter)
 *   diagnosticStudyPlanPrompt → StudyPlanService        (1 call, full plan)
 *   lessonMaterialPrompt      → LessonMaterialService   (1 call, 3-page object)
 *   lessonQuizMCQPrompt        → LessonQuizService       (MCQ questions)
 *   lessonQuizTFPrompt         → LessonQuizService       (true/false questions)
 *   lessonQuizFBPrompt         → LessonQuizService       (fill-blank questions)
 *   quarterlyExamMCQPrompt     → QuarterlyExamService    (MCQ questions)
 *   quarterlyExamTFPrompt      → QuarterlyExamService    (true/false questions)
 *   quarterlyExamFBPrompt      → QuarterlyExamService    (fill-blank questions)
 *   quarterlyExamDragDropPrompt→ QuarterlyExamService    (drag-drop sequencing)
 *   quarterlyExamMatchingPrompt→ QuarterlyExamService    (matching pairs)
 *   aiTutorChatPrompt         → AITutorService          (1 call per chat turn)
 *   aiExplanationPrompt       → AIExplanationService    (1 call per TTS section)
 *
 * ── HOW A SERVICE USES A PROMPT ──────────────────────────────────────────────
 *   const chain = PromptTemplates.somePrompt.pipe(ModelClass.getInstance());
 *   const raw   = await chain.invoke({ ...variables });
 *   return jsonParser<OutputType>(raw.content);
 *
 * ── SINGLE-QUESTION GENERATION (lessonQuiz + quarterlyExam) ─────────────────
 *   Each invoke produces exactly 1 question.  The caller loops and passes
 *   previously generated question texts in `alreadyAsked` to prevent repeats.
 *   Small models handle a single focused task far better than a bulk list —
 *   this cuts hallucinations and eliminates truncation mid-array.
 */

import { PromptTemplate } from '@langchain/core/prompts';

export class PromptTemplates {

  // ── 1. Diagnostic Quiz ─────────────────────────────────────────────────────
  // Service : DiagnosticQuizService.generateQuestions()
  // Screen  : DiagnosticTest.tsx  (via hooks/use-diagnostic.ts)
  // Schema  : subjects.q{n}_topic → quarterTopic
  //           subjects.q{n}_content → quarterContent
  //           profiles.grade / profiles.country → grade / country
  // Output  : MultipleChoiceQuestion[]  — 5 items, all difficulty "easy"
  // Invoke  : once per quarter (4 total calls per diagnostic session)
  static diagnosticQuizPrompt = new PromptTemplate({
    inputVariables: ['subjectName', 'quarter', 'quarterTopic', 'quarterContent', 'grade', 'country'],
    template: `
You are an expert teacher and quiz generator for students in {country}.
Generate 5 original multiple-choice questions for a Grade {grade} {subjectName} diagnostic test.

Quarter: {quarter}  |  Topic: {quarterTopic}  |  Difficulty: easy (baseline assessment)

Curriculum Content:
{quarterContent}

Rules:
1. Base ALL questions strictly on the Curriculum Content above.
2. Each question must have exactly 4 distinct, plausible options.
3. correctOption is the 0-based index (0, 1, 2, or 3) of the correct answer.
4. Do NOT use placeholder labels like "option A" — write real educational content.
5. No two questions may test the same fact or share the same correct answer.

Return ONLY a valid JSON array of exactly 5 objects:
[
  {{
    "type": "multiple_choice",
    "difficulty": "easy",
    "questionText": "A specific question about {quarterTopic}?",
    "options": ["Correct answer", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
    "correctOption": 0
  }}
]

Output only the JSON. No extra text.
    `,
  });


  // ── 2. Diagnostic Study Plan ───────────────────────────────────────────────
  // Service : StudyPlanService.generateStudyPlan()
  // Screen  : DiagnosticTest.tsx → DiagnosticResultCard.tsx
  // Schema  : diagnostic_results.q{1-4}_score → quarter{n}_score
  //           lessons.title (per quarter)      → quarter{n}_lessons
  // Output  : StudyPlan  { quarter1…quarter4: StudyPlanQuarter }
  // Invoke  : once, after all 4 diagnostic quarters complete
  static diagnosticStudyPlanPrompt = new PromptTemplate({
    inputVariables: [
      'quarter1_score', 'quarter1_lessons',
      'quarter2_score', 'quarter2_lessons',
      'quarter3_score', 'quarter3_lessons',
      'quarter4_score', 'quarter4_lessons',
    ],
    template: `
You are an AI tutor creating a personalised study plan from a student's diagnostic results.

Priority rules — set focus_level from the score:
  0–50   → "High Priority"
  51–75  → "Moderate Priority"
  76–100 → "Low Priority"

Set is_need_review to true when score < 76.

Diagnostic results:
  Quarter 1 — Score: {quarter1_score}  Lessons: {quarter1_lessons}
  Quarter 2 — Score: {quarter2_score}  Lessons: {quarter2_lessons}
  Quarter 3 — Score: {quarter3_score}  Lessons: {quarter3_lessons}
  Quarter 4 — Score: {quarter4_score}  Lessons: {quarter4_lessons}

Write practical, actionable strategies. Keep language simple and encouraging.
Focus more effort on quarters with lower scores.

Return ONLY a valid JSON object:
{{
  "quarter1": {{
    "lessons": "comma-separated lesson titles from Quarter 1",
    "is_need_review": true,
    "how_to_get_high_scores": "1. ... 2. ... 3. ... 4. ... 5. ...",
    "focus_level": "High Priority"
  }},
  "quarter2": {{ "lessons": "...", "is_need_review": false, "how_to_get_high_scores": "1. ...", "focus_level": "Low Priority" }},
  "quarter3": {{ "lessons": "...", "is_need_review": true,  "how_to_get_high_scores": "1. ...", "focus_level": "..." }},
  "quarter4": {{ "lessons": "...", "is_need_review": true,  "how_to_get_high_scores": "1. ...", "focus_level": "..." }}
}}
No extra text before or after the JSON.
    `,
  });


  // ── 3. Lesson Material ─────────────────────────────────────────────────────
  // Service : LessonMaterialService.generateMaterial()
  // Screen  : LessonView.tsx  (3-page lesson card content)
  // Schema  : lessons.title               → topic
  //           subjects.q{n}_content       → lecture  (NOT lesson.sections)
  // Output  : LessonMaterial  { page1, page2, page3 }
  // Invoke  : once when the student opens a lesson
  static lessonMaterialPrompt = new PromptTemplate({
    inputVariables: ['topic', 'lecture'],
    template: `
You are an AI tutor. Create a structured 3-page lesson for the topic: "{topic}".
Use ONLY the following curriculum content as your source — do not add outside facts.

{lecture}

Page 1 — Introduction:
  topic_introduction : 2–3 sentences introducing the topic engagingly
  learning_objectives: list of 3–5 clear learning goals
  tip                : one practical study tip for students

Page 2 — Core Content:
  lecture_content : main lesson content in student-friendly language
  key_concepts    : 3–5 short bullet-point concept summaries

Page 3 — Application:
  real_life_application : 2–3 sentences on real-world relevance
  summary               : 3–4 sentence recap of the whole lesson

Return ONLY a valid JSON object:
{{
  "page1": {{
    "topic_introduction":  "...",
    "learning_objectives": ["...", "...", "..."],
    "tip": "..."
  }},
  "page2": {{
    "lecture_content": "...",
    "key_concepts":    ["...", "...", "..."]
  }},
  "page3": {{
    "real_life_application": "...",
    "summary": "..."
  }}
}}
No extra text before or after the JSON.
    `,
  });


  // ── 4. Lesson Quiz — one prompt per question type ─────────────────────────
  // Service : LessonQuizService.generateQuiz()
  // Screen  : LessonView.tsx  (student taps "🎯 Take Quiz" after all 3 pages)
  // Schema  : lessons.title         → lessonTitle
  //           subjects.q{n}_content → content  (NOT lesson.sections)
  //           profiles.grade        → grade
  //           profiles.country      → country
  // Output  : QuizQuestion  (1 item per invoke; service collects 10 total)
  //
  // ── WHY ONE PROMPT PER TYPE ──────────────────────────────────────────────
  //   A single prompt with 3 schemas forces the model to parse which schema
  //   applies per call, causing:
  //     • Option letter-prefixes (A. B. C. D.) the MCQ schema didn't forbid
  //     • correctOption always 0 (schema example anchors the model to index 0)
  //     • fill_blank answer leaking into questionText
  //     • fill_blank hint containing the answer verbatim
  //   One prompt per type eliminates all schema noise: every rule in the prompt
  //   applies to the one type being generated.  questionType is no longer a
  //   variable — it is baked into the prompt the service selects.
  //
  // ── CALL PLAN (10 invocations, defined in LessonQuizService.LESSON_QUIZ_PLAN)
  //   #1  easy   lessonQuizMCQPrompt    #6  medium  lessonQuizMCQPrompt
  //   #2  easy   lessonQuizTFPrompt     #7  medium  lessonQuizFBPrompt
  //   #3  easy   lessonQuizFBPrompt     #8  medium  lessonQuizMCQPrompt
  //   #4  easy   lessonQuizMCQPrompt    #9  hard    lessonQuizFBPrompt
  //   #5  medium lessonQuizTFPrompt     #10 hard    lessonQuizMCQPrompt

  // 4a. Lesson Quiz — Multiple Choice
  static lessonQuizMCQPrompt = new PromptTemplate({
    inputVariables: [
      'lessonTitle', 'content', 'grade', 'country',
      'questionNumber', 'totalQuestions', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a multiple-choice question generator for a school tutoring app.

Lesson : {lessonTitle}
Grade  : {grade}  |  Country: {country}
Task   : Generate question {questionNumber} of {totalQuestions}.  Difficulty: {difficulty}

Curriculum Content:
{content}

Questions already generated — do NOT test the same fact or reuse the same correct answer:
{alreadyAsked}

Rules:
1. Base the question strictly on the Curriculum Content above.
2. Write 4 distinct, plausible options — no obviously absurd distractors.
3. Do NOT prefix options with letters (A, B, C, D) — write the text only.
4. Place the correct answer at a varied index (0, 1, 2, or 3) — NOT always 0.
5. correctOption is the 0-based index of the correct option in the array.
6. Double-check: options[correctOption] must be the factually correct answer.

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"multiple_choice","difficulty":"{difficulty}","questionText":"...","options":["...","...","...","..."],"correctOption":2}}]

Output only the JSON array. No extra text.
    `,
  });

  // 4b. Lesson Quiz — True / False
  static lessonQuizTFPrompt = new PromptTemplate({
    inputVariables: [
      'lessonTitle', 'content', 'grade', 'country',
      'questionNumber', 'totalQuestions', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a true/false question generator for a school tutoring app.

Lesson : {lessonTitle}
Grade  : {grade}  |  Country: {country}
Task   : Generate question {questionNumber} of {totalQuestions}.  Difficulty: {difficulty}

Curriculum Content:
{content}

Questions already generated — do NOT test the same fact:
{alreadyAsked}

Rules:
1. Base the statement strictly on the Curriculum Content above.
2. The statement must be clearly and unambiguously true or false — no edge cases.
3. Vary correctAnswer across calls — do not always return true.
4. The statement must test a meaningful concept, not a trivially obvious fact.

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"true_false","difficulty":"{difficulty}","questionText":"...","correctAnswer":true}}]

Output only the JSON array. No extra text.
    `,
  });

  // 4c. Lesson Quiz — Fill in the Blank
  static lessonQuizFBPrompt = new PromptTemplate({
    inputVariables: [
      'lessonTitle', 'content', 'grade', 'country',
      'questionNumber', 'totalQuestions', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a fill-in-the-blank question generator for a school tutoring app.

Lesson : {lessonTitle}
Grade  : {grade}  |  Country: {country}
Task   : Generate question {questionNumber} of {totalQuestions}.  Difficulty: {difficulty}

Curriculum Content:
{content}

Questions already generated — do NOT test the same term:
{alreadyAsked}

Rules:
1. Base the question strictly on the Curriculum Content above.
2. The blank (___) must replace a KEY TERM, concept name, or scientific term — never a common
   grammatical word like "the", "a", "is", "of", or "ability".
3. correctAnswer must NOT appear anywhere else in questionText — not before or after the blank.
4. The hint must give a clue WITHOUT containing the correctAnswer word or phrase.
   Bad hint : "Porosity is the ability of a material to absorb liquid."  (reveals the answer)
   Good hint: "This property describes how much liquid a material can absorb."

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"fill_blank","difficulty":"{difficulty}","questionText":"The process of ___ occurs when iron reacts with oxygen.","correctAnswer":"oxidation","hint":"A clue that does not say the word oxidation."}}]

Output only the JSON array. No extra text.
    `,
  });


  // ── 5. Quarterly Exam — one prompt per question type ──────────────────────
  // Service : QuarterlyExamService.generateExam()
  // Screen  : QuarterlyExam.tsx  (gated by dbQuarterlyExamUnlocked)
  // Schema  : subjects.name         → subjectName
  //           subjects.q{n}_topic   → topic
  //           lessons.title         → lessonTitle  (one lesson per outer loop)
  //           lessons.sections[]    → lessonContent (joined; populated by LessonMaterialService)
  //           profiles.grade        → grade
  //           profiles.country      → country
  // Output  : QuizQuestion  (1 item per invoke)
  //           Service collects 5 per lesson × N lessons in the quarter
  //
  // ── WHY ONE PROMPT PER TYPE ──────────────────────────────────────────────
  //   Sample output confirmed 4 failure modes from the combined prompt:
  //     • MCQ options had letter prefixes (A. B. C. D.)
  //     • correctOption biased to 0, causing factual errors (rusting, sublimation)
  //     • drag_drop instructions said "Match..." (confused with matching schema)
  //     • matching correctPairs always [0,1,2,3] (trivial, no shuffling)
  //   One prompt per type means each call has zero irrelevant schema noise.
  //   questionType is no longer a variable — the service selects the prompt.
  //
  // ── CALL PLAN (5 invocations per lesson, defined in QuarterlyExamService.EXAM_QUESTION_PLAN)
  //   #1  easy   quarterlyExamMCQPrompt
  //   #2  easy   quarterlyExamTFPrompt
  //   #3  medium quarterlyExamFBPrompt
  //   #4  medium quarterlyExamMCQPrompt
  //   #5  hard   quarterlyExamDragDropPrompt  ← even-indexed lessons
  //       hard   quarterlyExamMatchingPrompt  ← odd-indexed lessons

  // 5a. Quarterly Exam — Multiple Choice
  static quarterlyExamMCQPrompt = new PromptTemplate({
    inputVariables: [
      'subjectName', 'quarter', 'topic',
      'lessonTitle', 'lessonContent',
      'grade', 'country',
      'questionNumber', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a multiple-choice exam question generator for a school tutoring app.

Subject : {subjectName}  |  Quarter: {quarter}  |  Topic: {topic}
Lesson  : {lessonTitle}
Grade   : {grade}  |  Country: {country}
Task    : Generate question {questionNumber} of 5 for this lesson.  Difficulty: {difficulty}

Lesson Content:
{lessonContent}

Questions already generated for this lesson — do NOT test the same fact or reuse the same correct answer:
{alreadyAsked}

Rules:
1. Base the question strictly on the Lesson Content above.
2. Write 4 distinct, plausible options — no obviously absurd distractors.
3. Do NOT prefix options with letters (A, B, C, D) — write the text only.
4. Place the correct answer at a varied index (0, 1, 2, or 3) — NOT always 0.
5. correctOption is the 0-based index of the correct option in the array.
6. Double-check: options[correctOption] must be the factually correct answer.

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"multiple_choice","difficulty":"{difficulty}","questionText":"...","options":["...","...","...","..."],"correctOption":2}}]

Output only the JSON array. No extra text.
    `,
  });

  // 5b. Quarterly Exam — True / False
  static quarterlyExamTFPrompt = new PromptTemplate({
    inputVariables: [
      'subjectName', 'quarter', 'topic',
      'lessonTitle', 'lessonContent',
      'grade', 'country',
      'questionNumber', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a true/false exam question generator for a school tutoring app.

Subject : {subjectName}  |  Quarter: {quarter}  |  Topic: {topic}
Lesson  : {lessonTitle}
Grade   : {grade}  |  Country: {country}
Task    : Generate question {questionNumber} of 5 for this lesson.  Difficulty: {difficulty}

Lesson Content:
{lessonContent}

Questions already generated for this lesson — do NOT test the same fact:
{alreadyAsked}

Rules:
1. Base the statement strictly on the Lesson Content above.
2. The statement must be clearly and unambiguously true or false — no edge cases.
3. Vary correctAnswer across calls — do not always return true.
4. The statement must test a meaningful concept, not a trivially obvious fact.

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"true_false","difficulty":"{difficulty}","questionText":"...","correctAnswer":true}}]

Output only the JSON array. No extra text.
    `,
  });

  // 5c. Quarterly Exam — Fill in the Blank
  static quarterlyExamFBPrompt = new PromptTemplate({
    inputVariables: [
      'subjectName', 'quarter', 'topic',
      'lessonTitle', 'lessonContent',
      'grade', 'country',
      'questionNumber', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a fill-in-the-blank exam question generator for a school tutoring app.

Subject : {subjectName}  |  Quarter: {quarter}  |  Topic: {topic}
Lesson  : {lessonTitle}
Grade   : {grade}  |  Country: {country}
Task    : Generate question {questionNumber} of 5 for this lesson.  Difficulty: {difficulty}

Lesson Content:
{lessonContent}

Questions already generated for this lesson — do NOT test the same term:
{alreadyAsked}

Rules:
1. Base the question strictly on the Lesson Content above.
2. The blank (___) must replace a KEY TERM, concept name, or scientific term — never a common
   grammatical word like "the", "a", "is", "of", or "ability".
3. correctAnswer must NOT appear anywhere else in questionText — not before or after the blank.
4. The hint must give a clue WITHOUT containing the correctAnswer word or phrase.
   Bad hint : "Porosity is the ability of a material to absorb liquid."  (reveals the answer)
   Good hint: "This property describes how much liquid a material can absorb."

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"fill_blank","difficulty":"{difficulty}","questionText":"The process of ___ occurs when iron reacts with oxygen.","correctAnswer":"oxidation","hint":"A clue that does not say the word oxidation."}}]

Output only the JSON array. No extra text.
    `,
  });

  // 5d. Quarterly Exam — Drag & Drop
  //
  // drag_drop tests SEQUENCING — the student drags items into the correct order.
  // It is NOT a matching task.  instruction must describe a process or sequence to arrange.
  //
  // correctOrder semantics:
  //   correctOrder[position] = the index in items[] that belongs at that position.
  //   Example: items = ["Step C", "Step A", "Step D", "Step B"]
  //            correctOrder = [1, 3, 0, 2]
  //            means: position 0 → items[1] ("Step A")
  //                   position 1 → items[3] ("Step B")
  //                   position 2 → items[0] ("Step C")
  //                   position 3 → items[2] ("Step D")
  static quarterlyExamDragDropPrompt = new PromptTemplate({
    inputVariables: [
      'subjectName', 'quarter', 'topic',
      'lessonTitle', 'lessonContent',
      'grade', 'country',
      'questionNumber', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a drag-and-drop sequencing exam question generator for a school tutoring app.

Subject : {subjectName}  |  Quarter: {quarter}  |  Topic: {topic}
Lesson  : {lessonTitle}
Grade   : {grade}  |  Country: {country}
Task    : Generate question {questionNumber} of 5 for this lesson.  Difficulty: {difficulty}

Lesson Content:
{lessonContent}

Questions already generated for this lesson — do NOT test the same sequence:
{alreadyAsked}

Rules:
1. Base the question strictly on the Lesson Content above.
2. drag_drop tests SEQUENCING — the student arranges items into the correct order.
   It is NOT a matching task.  Do NOT write "Match the following."
3. instruction must describe a process, sequence, or timeline to arrange.
   Good: "Arrange the stages of the water cycle in the correct order."
   Bad : "Match the following terms with their definitions."
4. Provide 4 items in a SHUFFLED order — NOT in the correct sequence.
5. correctOrder[i] = the index in items[] that belongs at position i in the correct sequence.
   Example: items=["Step C","Step A","Step D","Step B"], correctOrder=[1,3,0,2]
   means the correct sequence is: items[1]→items[3]→items[0]→items[2]  (A→B→C→D).

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"drag_drop","difficulty":"{difficulty}","instruction":"Arrange the steps of [process] in the correct order.","items":["Step C","Step A","Step D","Step B"],"correctOrder":[1,3,0,2]}}]

Output only the JSON array. No extra text.
    `,
  });

  // 5e. Quarterly Exam — Matching
  //
  // correctPairs semantics:
  //   correctPairs[leftIndex] = the index in rightItems[] that matches leftItems[leftIndex].
  //   Example: leftItems  = ["Heart",  "Lungs",      "Liver"]
  //            rightItems = ["Filters blood", "Pumps blood", "Gas exchange"]  ← shuffled
  //            correctPairs = [1, 2, 0]
  //            means: Heart  → rightItems[1] ("Pumps blood")
  //                   Lungs  → rightItems[2] ("Gas exchange")
  //                   Liver  → rightItems[0] ("Filters blood")
  static quarterlyExamMatchingPrompt = new PromptTemplate({
    inputVariables: [
      'subjectName', 'quarter', 'topic',
      'lessonTitle', 'lessonContent',
      'grade', 'country',
      'questionNumber', 'difficulty', 'alreadyAsked',
    ],
    template: `
You are a matching exam question generator for a school tutoring app.

Subject : {subjectName}  |  Quarter: {quarter}  |  Topic: {topic}
Lesson  : {lessonTitle}
Grade   : {grade}  |  Country: {country}
Task    : Generate question {questionNumber} of 5 for this lesson.  Difficulty: {difficulty}

Lesson Content:
{lessonContent}

Questions already generated for this lesson — do NOT test the same pairs:
{alreadyAsked}

Rules:
1. Base the question strictly on the Lesson Content above.
2. Provide 3 or 4 leftItems (terms) and the same number of rightItems (definitions/descriptions).
3. rightItems MUST be in a SHUFFLED order relative to leftItems.
   correctPairs MUST NOT equal [0,1,2,3] — if your natural pairing produces that, reshuffle rightItems.
4. correctPairs[i] = the index in rightItems[] that matches leftItems[i].
   Example: leftItems  = ["Oxidation", "Galvanization", "Rusting"]
            rightItems = ["Coating iron with zinc", "Iron reacting with oxygen", "Visible rust on iron"]
                          ↑ shuffled so natural order is broken
            correctPairs = [1, 0, 2]
            meaning: Oxidation→rightItems[1], Galvanization→rightItems[0], Rusting→rightItems[2].

Return ONLY a valid JSON array containing exactly 1 object:
[{{"type":"matching","difficulty":"{difficulty}","instruction":"Match each term to its definition.","leftItems":["Oxidation","Galvanization","Rusting"],"rightItems":["Coating iron with zinc","Iron reacting with oxygen","Visible rust on iron"],"correctPairs":[1,0,2]}}]

Output only the JSON array. No extra text.
    `,
  });


  // ── 6. AI Tutor Chat ───────────────────────────────────────────────────────
  // Service : AITutorService.getResponse()
  // Screen  : AITutor.tsx  (floating FAB on LessonView.tsx)
  // Schema  : lessons.title   → lessonTitle
  //           chat_messages   ← each turn saved after send/receive
  // Output  : string  (plain text; no JSON; directly into chat bubble)
  // Invoke  : once per student message
  static aiTutorChatPrompt = new PromptTemplate({
    inputVariables: ['lessonTitle', 'history'],
    template: `
You are a friendly and encouraging AI tutor for school students.
You are helping a student understand the lesson: "{lessonTitle}".

Stay focused on this lesson topic. If the student asks something unrelated,
gently redirect them back to the lesson.

Keep your answers:
- Clear and simple (suitable for school students)
- Encouraging and positive in tone
- Concise (2–4 sentences unless a longer explanation is needed)
- Always in plain text — do NOT use markdown, bullet points, or headers

Conversation so far:
{history}

Respond only with your next reply. Do not repeat the conversation history.
    `,
  });


  // ── 7. AI Explanation — TTS follow-up ─────────────────────────────────────
  // Service : AIExplanationService.getExplanation()
  // Screen  : LessonView.tsx  (auto-plays via expo-speech after each page read)
  // Schema  : lessons.sections[n].content → text  (stripped of markdown)
  //           profiles.grade              → grade
  // Output  : string  (plain spoken language; no JSON; fed into Speech.speak())
  // Invoke  : once per lesson page after TTS finishes reading it
  static aiExplanationPrompt = new PromptTemplate({
    inputVariables: ['text', 'grade'],
    template: `
You are an AI tutor providing a spoken follow-up explanation for a school student.

The student has just heard this lesson section read aloud:
"{text}"

They are in Grade {grade}.

Your task:
- Explain the key idea from that passage in simple, spoken language.
- Use vocabulary and examples appropriate for a Grade {grade} student.
- Keep your explanation to 3–5 sentences — it will be read aloud by text-to-speech.
- Do NOT use bullet points, markdown, lists, or special characters.
- Write as if speaking naturally to a student.

Explanation:
    `,
  });
}