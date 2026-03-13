import { PromptTemplate } from "@langchain/core/prompts";

export class PromptTemplates {

  /* ─────────────────────────────────────────────
     Diagnostic Study Plan Prompt
  ───────────────────────────────────────────── */

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

Existing Questions:
{questions}

Rules:
- Do NOT change the meaning.
- Keep the same options.
- Only rewrite the question wording.
- Maintain the same correct answer.
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:

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

  static focusAreaPrompt = new PromptTemplate({
    inputVariables: ["subject_name", "subject_mastery", "lesson_title", "lesson_score", "lesson_content"],
    template: `
        You are an analytical educational system generating a dashboard widget. 

        Weakest Subject: {subject_name} (Mastery: {subject_mastery}%)
        Weakest Lesson: {lesson_title} (Score: {lesson_score}%)
        Concepts in this Lesson: {lesson_content}

        Your task is to generate a direct, brief focus action plan for the dashboard. 

        STRICT RULES:
        1. Tone: Be direct and action-oriented. NO greetings.
        2. Call to Action: The 'take_note' MUST be a study "Call to Action". 
        3. Synthesis: Summarize the 'Concepts in this Lesson' briefly. DO NOT copy them word-for-word.

        OUTPUT STRICTLY A SINGLE JSON OBJECT.
        Use this EXACT format:
        {{
            "subject_line": "{subject_name} - {subject_mastery}% mastery",
            "lesson_line": "{lesson_title} - {lesson_score}% quiz result",
            "take_note": "Review [briefly summarized concepts] and [actionable next step, e.g., retake the quizzes for greater results next time]."
        }}
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

Existing Questions:
{questions}

Rules:
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:

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

Existing Questions:
{questions}

Rules:
- Replace the key concept with ___
- Preserve the original meaning
- Always produce 2-sentence explanations that teach the concept, even for easy questions.

Return ONLY JSON:

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

}