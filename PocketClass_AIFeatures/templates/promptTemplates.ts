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
      "quarter1_score",
      "quarter1_lessons",
      "quarter2_score",
      "quarter2_lessons",
      "quarter3_score",
      "quarter3_lessons",
      "quarter4_score",
      "quarter4_lessons"
    ],
    template: `
You are an AI tutor helping a student improve based on diagnostic test results.

Diagnostic Scores:
Quarter 1: {quarter1_score}
Quarter 2: {quarter2_score}
Quarter 3: {quarter3_score}
Quarter 4: {quarter4_score}

Lessons:

Quarter 1:
{quarter1_lessons}

Quarter 2:
{quarter2_lessons}

Quarter 3:
{quarter3_lessons}

Quarter 4:
{quarter4_lessons}

Rules:
- Focus more on quarters with lower scores.
- Give practical study strategies.
- Use simple explanations for students.

Return ONLY JSON:

{{
  "quarter1": {{
    "lessons": "...",
    "is_need_review": true,
    "how_to_get_high_scores": ["...", "...", "...", "...", "..."]
  }},
  "quarter2": {{
    "lessons": "...",
    "is_need_review": false,
    "how_to_get_high_scores": ["...", "...", "...", "...", "..."]
  }},
  "quarter3": {{
    "lessons": "...",
    "is_need_review": true,
    "how_to_get_high_scores": ["...", "...", "...", "...", "..."]
  }},
  "quarter4": {{
    "lessons": "...",
    "is_need_review": false,
    "how_to_get_high_scores": ["...", "...", "...", "...", "..."]
  }}
}}
`
  });


  /* ─────────────────────────────────────────────
     Tutor Lesson Prompt
  ───────────────────────────────────────────── */

  static tutorPrompt = new PromptTemplate({
    inputVariables: ["topic", "lecture"],
    template: `
You are an AI tutor. Create a structured 3-page lesson for the topic: "{topic}".

Use ONLY the following curriculum content as your source:

{lecture}

Page 1 — Introduction  
Page 2 — Core Content  
Page 3 — Application  

Return ONLY JSON:

{{
  "page1": {{
    "topic_introduction": "...",
    "learning_objectives": ["...", "...", "..."],
    "tip": "..."
  }},
  "page2": {{
    "lecture_content": "...",
    "key_concepts": ["...", "...", "..."]
  }},
  "page3": {{
    "real_life_application": "...",
    "summary": "..."
  }}
}}
`
  });


  /* ─────────────────────────────────────────────
     Lesson Quiz — Multiple Choice
  ───────────────────────────────────────────── */

  static lessonQuizMCQPrompt = new PromptTemplate({
    inputVariables: [
      "grade",
      "country",
      "difficulty",
      "question_number",
      "questions"
    ],
    template: `
You are rewriting multiple-choice questions.

Grade: {grade}  
Country: {country}  
Difficulty: {difficulty}

Existing Question:
{questions}

Rules:
- Do NOT change the meaning.
- Keep the same options.
- Only rewrite the question wording.
- Maintain the same correct answer.
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "multiple_choice",
    "difficulty": "{difficulty}",
    "questionText": "rewritten question",
    "options": [
                "Correct concept",
                "Common misconception",
                "Related concept",
                "Clearly incorrect answer"
                ],
    "correctOption": 0,
    "explanation": "Short explanation of why the answer is correct."
  }}
]
`
  });


  /* ─────────────────────────────────────────────
     Lesson Quiz — True/False
  ───────────────────────────────────────────── */

  static lessonQuizTFPrompt = new PromptTemplate({
    inputVariables: [
      "grade",
      "country",
      "difficulty",
      "question_number",
      "questions"
    ],
    template: `
Rewrite the following True/False question.

Grade: {grade}  
Country: {country}

Existing Question:
{questions}

Rules:
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "true_false",
    "difficulty": "{difficulty}",
    "questionText": "rewritten statement",
    "correctAnswer": true,
    "explanation": "Short explanation of why the answer is correct."
  }}
]
`
  });


  /* ─────────────────────────────────────────────
     Lesson Quiz — Fill in the Blank
  ───────────────────────────────────────────── */

  static lessonQuizFBPrompt = new PromptTemplate({
    inputVariables: [
      "grade",
      "country",
      "difficulty",
      "question_number",
      "questions"
    ],
    template: `
Rewrite the fill-in-the-blank question.

Existing Question:
{questions}

<<<<<<< HEAD
STRICT RULES:
1. CORRECT ANSWER: Preserve the EXACT correctAnswer word/phrase from the input.
2. THE BLANK: The rewritten sentence must logically lead to the exact answer. Use exactly three underscores (___) for the blank.
3. NO LEAKS: DO NOT include the correctAnswer word anywhere in the rewritten questionText or the hint.
4. TASK: Only rewrite the surrounding wording to match the difficulty level.
=======
Rules:
- Replace the key concept with ___
- Preserve the original meaning
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:
>>>>>>> origin/ai_features_she

Return ONLY a valid JSON array containing exactly 1 object:
[
  {{
    "type": "fill_blank",
    "difficulty": "{difficulty}",
    "questionText": "Plants make food using ___",
    "correctAnswer": "photosynthesis",
    "hint": "Process plants use sunlight for energy.",
    "explanation": "Photosynthesis is the process plants use to make food."
  }}
]
`
  });

  // ── Multiple Choice ──────────────────────────────
  static quarterlyExamMCQPrompt = new PromptTemplate({
    inputVariables: ['grade','difficulty','questions','questionCount'],
    template: `
You are an expert AI tutor. You are rewriting multiple-choice questions for a school tutoring app.

Grade  : {grade}
Target Difficulty: {difficulty}

Task:
Rewrite the wording of the following question to match the target difficulty.

Existing Question:
{questions}

You will receive a list of questions with options and the correct answer.

Task:
- Paraphrase each question to make it sound fresh.
- DO NOT change the meaning of the question.
- DO NOT change the correct answer.
- Ensure the correct answer remains in the options.
- Keep the original options exactly as they are.
- Return exactly {questionCount} questions.
- THERE SHOULD BE 4 OPTIONS IN TOTAL

Return ONLY a valid JSON array containing {questionCount} questions
[
  {{
    "type": "multiple_choice",
    "questionText": "rewritten question",
    "options": ["option1","option2","option3","option4"],
    "correctAnswer": correctAnswer
  }}
`
  });

  // ── True/False ──────────────────────────────
  static quarterlyExamTFPrompt = new PromptTemplate({
    inputVariables: ['grade','difficulty','questions','questionCount'],
    template: `
You are an expert AI tutor. You are rewriting true/false questions for a school tutoring app.

Grade  : {grade}
Target Difficulty: {difficulty}

You will receive a list of true/false questions with their correct answers.

Existing Question:
{questions}

Task:
- Paraphrase each statement to make it sound fresh.
- DO NOT change the truth value of any question.
- Return exactly {questionCount} questions.

Return ONLY a valid JSON array:

[
  {{
    "type": "true_false",
    "questionText": "paraphrased statement",
    "correctAnswer": true
  }}
]
`
  });

  // ── Fill-in-the-Blank ──────────────────────────────
  static quarterlyExamFBPrompt = new PromptTemplate({
    inputVariables: ['grade','difficulty','questions','questionCount'],
    template: `
You are an expert AI tutor. You are rewriting fill-in-the-blank questions for a school tutoring app.

Grade  : {grade}
Target Difficulty: {difficulty}

Existing Question:
{questions}

You will receive a list of questions with the correct answer.

Task:
- Paraphrase the sentence while keeping the blank and correct answer intact.
- Use exactly ___ for the blank.
- Provide a short hint if needed.
- Return exactly {questionCount} questions.

Return ONLY a valid JSON array:

[
  {{
    "type": "fill_blank",
    "questionText": "paraphrased sentence with ___",
    "correctAnswer": "answer",
    "hint": "short hint"
  }}
]
`
  });

  static aiTutorChatPrompt = new PromptTemplate({
  inputVariables: ['name', 'grade', 'country', 'subjectName', 'lessonTitle', 'lessonContent', 'history'],
  template: `
You are a friendly AI tutor for {name}, a Grade {grade} student in {country}.
Subject: {subjectName} | Lesson: {lessonTitle}

--- LESSON CONTENT (ONLY USE THIS) ---
{lessonContent}

--- CONVERSATION HISTORY ---
{history}

--- FINAL INSTRUCTIONS ---
1. Address {name} and answer their LAST question using ONLY the Lesson Content above.
2. If the question is NOT in the Lesson Content, say: "I'm sorry {name}, but that isn't covered in our lesson on {lessonTitle}. Should we get back to that?"
3. Use a local example from {country} (like local plants or landmarks).
4. Do NOT repeat your previous answers from the history. 
5. Provide a NEW, direct answer to the latest message.
6. Plain text only. No markdown.

Reply:
`
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
    static focusAreaPrompt: any;
}