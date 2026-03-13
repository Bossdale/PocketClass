import { PromptTemplate } from "@langchain/core/prompts";

export class PromptTemplates {
    constructor(){}

    static diagnosticStudyPlanPrompt = PromptTemplate.fromTemplate(`
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

        template: "
        You are an AI tutor helping a student improve based on their diagnostic test results.

        You will receive:
        1. Diagnostic scores for 4 quarters
        2. A list of lessons for each quarter

        Your task is to create a personalized study plan that helps the student improve their understanding of the lessons and prepare before studying them.

        Rules:
        - Focus more on quarters with lower scores.
        - Suggest practical ways to study the lessons.
        - Give reading strategies, practice suggestions, and preparation tips.
        - Keep explanations simple for students.

        Diagnostic Scores:
        Quarter 1 Score: {quarter1_score}
        Quarter 2 Score: {quarter2_score}
        Quarter 3 Score: {quarter3_score}
        Quarter 4 Score: {quarter4_score}

        Lessons:

        Quarter 1 Lessons:
        {quarter1_lessons}

        Quarter 2 Lessons:
        {quarter2_lessons}

        Quarter 3 Lessons:
        {quarter3_lessons}

        Quarter 4 Lessons:
        {quarter4_lessons}

        Return the result in this format:
        "{{
            "quarter1": {{
                "lessons": "...",
                "is_need_review": "true or false inicating the student needs improvement based on his score",
                "how_to_get_high_scores": "1. ... 2. ... 3. ... 4. ... 5. ..."
            }},
            "quarter2": {{
                "lessons": "...",
                "is_need_review": "true or false inicating the student needs improvement based on his score",
                "how_to_get_high_scores": "1. ... 2. ... 3. ... 4. ... 5. ..."
            }},
            "quarter3": {{
                "lessons": "...",
                "is_need_review": "true or false inicating the student needs improvement based on his score",
                "how_to_get_high_scores": "1. ... 2. ... 3. ... 4. ... 5. ..."
            }},
            "quarter4": {{
                "lessons": "...",
                "is_need_review": "true or false inicating the student needs improvement based on his score",
                "how_to_get_high_scores": "1. ... 2. ... 3. ... 4. ... 5. ..."
            }}
        }}

        Focus Level Rules:
        - Score 0–50 → "High Priority"
        - Score 51–75 → "Moderate Priority"
        - Score 76–100 → "Low Priority"

        `)

    static tutorPrompt = new PromptTemplate({
    inputVariables: ["topic", "lecture"],
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
    'grade',
    'country',
    'difficulty',
    'question_number',
    'questions'
  ],
  template: `
You are rewriting existing quiz questions for a school tutoring app.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

Task:
Paraphrase exactly {question_number} multiple-choice questions.

Existing Questions:
{questions}

Difficulty Guidelines:
- easy → simpler wording and direct questions
- medium → slightly more descriptive wording
- hard → more analytical or scenario-based wording

Rules:
1. DO NOT change the meaning of the question.
2. DO NOT change the options.
3. Preserve the correct answer from the input question.
4. The correctAnswer should refer to the correct answer string
5. Only rewrite the questionText wording.
6. Keep exactly 4 options per question.
7. Return exactly {question_number} questions.

Return ONLY JSON:

[
  {{
    "type": "multiple_choice",
    "questionText": "rewritten question",
    "options": ["option1","option2","option3","option4"],
    "correctAnswer": option1
  }}
]
`
});

  // 4b. Lesson Quiz — True / False
static lessonQuizTFPrompt = new PromptTemplate({
  inputVariables: [
    'grade',
    'country',
    'difficulty',
    'question_number',
    'questions'
  ],
  template: `
You are rewriting existing True/False questions.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

Task:
Paraphrase exactly {question_number} true/false questions.

Existing Questions:
{questions}

Rules:
1. DO NOT change the meaning of the statement.
2. Preserve the correctAnswer value from the input question.
3. Only rewrite the wording of questionText.
4. Maintain the same fact being tested.
5. Return exactly {question_number} questions.

Return ONLY JSON:

[
  {{
    "type": "true_false",
    "questionText": "rewritten statement",
    "correctAnswer": false
  }}
]

Important:
correctAnswer must remain the same as the input question (true or false).
`
});
  // 4c. Lesson Quiz — Fill in the Blank
static lessonQuizFBPrompt = new PromptTemplate({
  inputVariables: [
    'grade',
    'country',
    'difficulty',
    'question_number',
    'questions'
  ],
  template: `
You are rewriting existing fill-in-the-blank questions.

Grade  : {grade}
Country: {country}
Target Difficulty: {difficulty}

        STRICT RULES:
        1. Identify a core concept from the Lesson Content and replace the key term with "___".
        2. The 'correctAnswer' must be the exact word(s) missing from the blank.
        3. The 'explanation' must explain the logical definition of the 'correctAnswer' based on the lesson.
        4. STRICT LIMIT: The 'explanation' must be exactly 1 or 2 sentences. DO NOT exceed 2 sentences.

        OUTPUT STRICTLY A JSON OBJECT.
        Use this EXACT format:
        {{
            "type": "fill_blank",
            "difficulty": "{difficulty}",
            "questionText": "[Insert Question]",
            "correctAnswer": "Pi",
            "hint": "It is a mathematical constant approximately equal to 3.14.",
            "explanation": "Pi represents the constant relationship where a circle's circumference is always about 3.14 times its diameter. This value is fundamental for calculating areas and perimeters in geometry."
        }}
        `
});
}