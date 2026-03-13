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
        You are an AI tutor. You will create a structured lesson for the topic: "{topic}"
        lectur content {lecture}.

        The lesson should have 3 pages:

        Page 1:
        - topic_introduction: a brief introduction of the topic
        - learning_objectives: a list of learning objectives (3-5 points)
        - tip: a small tip for learners

        Page 2:
        - lecture_content: main lecture content explained clearly
        - key_concepts: important key concepts summarized

        Page 3:
        - real_life_application: how this topic is applied in real life
        - summary: summary of the whole lecture content

        Output the lesson in a JSON string exactly like this format:

        {{
            "page1": {{
                "topic_introduction": "...",
                "learning_objectives": ["...", "...", "..."],
                "tip": "..."
            }},
            "page2": {{
                "lecture_content": "...",
                "key_concepts": ["...", "..."]
            }},
            "page3": {{
                "real_life_application": "...",
                "summary": "..."
            }}
        }}

        Make sure the output is valid JSON so it can be parsed directly.
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
}