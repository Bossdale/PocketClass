import { PromptTemplate } from '@langchain/core/prompts';

export class PromptTemplates {

  // ── 1. Diagnostic Quiz ─────────────────────────────────────────────────────
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

  // ── 4. Lesson Quiz — (Left as Original for Service Compatibility) ─────────
  static lessonQuizMCQPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'question_number', 'questions'],
    template: `
You are rewriting an existing multiple-choice question for a school tutoring app.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

Task:
Rewrite the wording of the following question to match the target difficulty.

Existing Question:
{questions}

STRICT RULES:
1. FACTUAL INTEGRITY: DO NOT change the scientific, historical, or mathematical facts.
2. OPTIONS: You MUST split the pipe-separated options from the input into an array of exactly 4 separate strings. DO NOT change the options themselves.
3. CORRECT ANSWER: The correctAnswer MUST be the EXACT TEXT of the correct option from the input. DO NOT use placeholders.
4. TASK: Only rewrite the questionText wording.

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "multiple_choice",
    "difficulty": "{difficulty}",
    "questionText": "<your rewritten question here>",
    "options": ["<first option>", "<second option>", "<third option>", "<fourth option>"],
    "correctAnswer": "<the exact text of the correct option>"
  }}
]
`
  });

  static lessonQuizTFPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'question_number', 'questions'],
    template: `
You are rewriting an existing true/false question for a school tutoring app.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

Task:
Rewrite the wording of the following true/false question to match the target difficulty.

Existing Question:
{questions}

STRICT RULES:
1. FACTUAL INTEGRITY: You MUST preserve the exact same meaning and fact being tested.
2. CORRECT ANSWER: The correctAnswer MUST remain the exact same boolean (true or false) as the input question. DO NOT re-evaluate or flip the truth value.
3. TASK: Only rewrite the questionText to match the difficulty. Ensure it is a complete sentence or clear question.

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "true_false",
    "difficulty": "{difficulty}",
    "questionText": "<your rewritten statement or question here>",
    "correctAnswer": <true or false, exactly matching the input>
  }}
]
`
  });

  static lessonQuizFBPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'question_number', 'questions'],
    template: `
You are rewriting an existing fill-in-the-blank question for a school tutoring app.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

Task:
Rewrite the wording of the following fill-in-the-blank question to match the target difficulty.

Existing Question:
{questions}

STRICT RULES:
1. CORRECT ANSWER: Preserve the EXACT correctAnswer word/phrase from the input.
2. THE BLANK: The rewritten sentence must logically lead to the exact answer. Use exactly three underscores (___) for the blank.
3. NO LEAKS: DO NOT include the correctAnswer word anywhere in the rewritten questionText or the hint.
4. TASK: Only rewrite the surrounding wording to match the difficulty level.

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "fill_blank",
    "difficulty": "{difficulty}",
    "questionText": "<your rewritten sentence with ___>",
    "correctAnswer": "<the exact answer from the input>",
    "hint": "<a short, helpful clue that does not contain the answer>"
  }}
]
`
  });

  // ── 5. Quarterly Exam — Decoupled Architecture ──────────────────────────────
  // These prompts NO LONGER return full Question objects. 
  // They ONLY return the rewritten text strings.

  static quarterlyExamMCQPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'questions'],
    template: `
You are rewriting the wording of a multiple-choice exam question for a school tutoring app.

Grade: {grade}
Country: {country}
Target Difficulty: {difficulty}

Original Question Context:
{questions}

STRICT RULES:
1. ONLY rewrite the question wording to match the target difficulty.
2. DO NOT change the underlying facts or meaning.
3. DO NOT return the options or the answer. The system handles those.
4. DO NOT append the multiple-choice options (A, B, C, D) to the end of the questionText.

Return ONLY a valid JSON object with the new question text:
{{ "questionText": "<your rewritten question here>" }}

Output only the JSON object. No extra text.
    `,
  });

  static quarterlyExamTFPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'questions'],
    template: `
You are rewriting the wording of a true/false exam question for a school tutoring app.

Grade: {grade}
Country: {country}
Target Difficulty: {difficulty}

Original Question Context:
{questions}

STRICT RULES:
1. ONLY rewrite the statement wording to match the target difficulty. Ensure it is a complete sentence or a clear question.
2. DO NOT alter the truth value of the underlying scientific fact.
3. DO NOT return the boolean answer. The system handles that.
4. DO NOT change the conditions of the statement in a way that flips the scientific truth value.
5. CRITICAL: DO NOT use antonyms. DO NOT add or remove the word "NOT". Ensure the rewritten statement evaluates to the exact same truth value as the original.

Return ONLY a valid JSON object with the new question text:
{{ "questionText": "<your rewritten statement or question here>" }}

Output only the JSON object. No extra text.
    `,
  });

  static quarterlyExamFBPrompt = new PromptTemplate({
    inputVariables: ['grade', 'country', 'difficulty', 'questions'],
    template: `
You are rewriting the wording of a fill-in-the-blank exam question for a school tutoring app.

Grade: {grade}
Country: {country}
Target Difficulty: {difficulty}

Original Question Context:
{questions}

STRICT RULES:
1. Rewrite the sentence so it logically leads to the exact same answer as the original.
2. The blank MUST be exactly three underscores (___).
3. DO NOT include the answer word anywhere in your rewritten sentence or hint.
4. Provide a helpful hint that does not give away the exact answer.

Return ONLY a valid JSON object with the text and hint:
{{ 
  "questionText": "<your rewritten sentence with ___>",
  "hint": "<a short clue that does not contain the answer>"
}}

Output only the JSON object. No extra text.
    `,
  });

  // ── 6. AI Tutor Chat ───────────────────────────────────────────────────────
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