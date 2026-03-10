import type { QuizQuestion, DiagnosticQuestion } from './types';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

async function callAnthropic(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

function parseJsonResponse(text: string): any[] {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

function addIds(questions: any[]): QuizQuestion[] {
  return questions.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
  }));
}

// Fallback questions
function getFallbackLessonQuestions(): QuizQuestion[] {
  return [
    { id: 'fb-1', type: 'multiple_choice', difficulty: 'easy', questionText: 'Which of the following best describes this concept?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0 },
    { id: 'fb-2', type: 'true_false', difficulty: 'easy', questionText: 'This topic is fundamental to the subject.', correctAnswer: true },
    { id: 'fb-3', type: 'multiple_choice', difficulty: 'medium', questionText: 'What is the primary application of this concept?', options: ['Daily life', 'Space travel', 'Deep sea diving', 'Time travel'], correctOption: 0 },
  ];
}

export async function generateLessonQuiz(
  lessonTitle: string,
  lessonContent: string,
  grade: number,
  country: string
): Promise<QuizQuestion[]> {
  if (!API_KEY) return getFallbackLessonQuestions();

  const system = `You are an educational content creator for secondary school grade ${grade} students in ${country}. Generate quiz questions for the lesson '${lessonTitle}'. Return ONLY a valid JSON array of exactly 5 question objects. No markdown, no preamble, no explanation.`;
  
  const user = `Generate 5 quiz questions:
- 2 easy (multiple_choice or true_false)
- 2 medium (multiple_choice, fill_blank, or matching)
- 1 hard (drag_drop, matching, or fill_blank)

Schemas:
{ "type":"multiple_choice", "difficulty":"...", "questionText":"...", "options":["A","B","C","D"], "correctOption":0 }
{ "type":"true_false", "difficulty":"...", "questionText":"...", "correctAnswer":true }
{ "type":"fill_blank", "difficulty":"...", "questionText":"Question with ___ for blank", "correctAnswer":"word", "hint":"optional" }
{ "type":"drag_drop", "difficulty":"...", "instruction":"...", "items":["B","A","C"], "correctOrder":[1,0,2] }
{ "type":"matching", "difficulty":"...", "instruction":"...", "leftItems":["A","B"], "rightItems":["2","1"], "correctPairs":[1,0] }

Lesson context: ${lessonContent.substring(0, 500)}`;

  try {
    const text = await callAnthropic(system, user);
    const parsed = parseJsonResponse(text);
    return addIds(parsed);
  } catch {
    return getFallbackLessonQuestions();
  }
}

export async function generateQuarterlyExam(
  subjectName: string,
  quarter: number,
  quarterTopic: string,
  grade: number,
  country: string
): Promise<QuizQuestion[]> {
  if (!API_KEY) return getFallbackLessonQuestions();

  const system = `You are an educational content creator for secondary school grade ${grade} students in ${country}. Generate quarterly exam questions for ${subjectName} Quarter ${quarter}: ${quarterTopic}. Return ONLY a valid JSON array of exactly 15 question objects. No markdown, no preamble, no explanation.`;
  
  const user = `Generate 15 exam questions covering all lessons in Quarter ${quarter} (${quarterTopic}):
- 5 easy, 5 medium, 5 hard
- Include at least: 2 multiple_choice, 2 true_false, 1 fill_blank, 1 drag_drop, 1 matching

Use these schemas:
{ "type":"multiple_choice", "difficulty":"...", "questionText":"...", "options":["A","B","C","D"], "correctOption":0 }
{ "type":"true_false", "difficulty":"...", "questionText":"...", "correctAnswer":true }
{ "type":"fill_blank", "difficulty":"...", "questionText":"Question with ___ for blank", "correctAnswer":"word", "hint":"optional" }
{ "type":"drag_drop", "difficulty":"...", "instruction":"...", "items":["B","A","C"], "correctOrder":[1,0,2] }
{ "type":"matching", "difficulty":"...", "instruction":"...", "leftItems":["A","B"], "rightItems":["2","1"], "correctPairs":[1,0] }

Order: easy questions first, then medium, then hard.`;

  try {
    const text = await callAnthropic(system, user);
    const parsed = parseJsonResponse(text);
    return addIds(parsed);
  } catch {
    return getFallbackLessonQuestions();
  }
}

export async function generateDiagnosticQuestions(
  subjectName: string,
  quarterTopics: string[],
  grade: number,
  country: string
): Promise<DiagnosticQuestion[]> {
  if (!API_KEY) return getFallbackDiagnosticQuestions(subjectName);

  const system = `You are an educational content creator for secondary school grade ${grade} students in ${country}. Generate diagnostic test questions for ${subjectName}. Return ONLY a valid JSON array of exactly 20 question objects. No markdown, no preamble, no explanation.`;
  
  const user = `Generate 20 multiple-choice diagnostic questions, 5 per quarter:
Quarter 1: ${quarterTopics[0]}
Quarter 2: ${quarterTopics[1]}
Quarter 3: ${quarterTopics[2]}
Quarter 4: ${quarterTopics[3]}

Schema for each: { "quarter":1, "questionOrder":1, "questionText":"...", "options":["A","B","C","D"], "correctOption":0 }

Questions should assess baseline knowledge of each topic.`;

  try {
    const text = await callAnthropic(system, user);
    const parsed = parseJsonResponse(text);
    return parsed.map((q: any, i: number) => ({
      ...q,
      id: `diag-${Date.now()}-${i}`,
      subjectId: subjectName.toLowerCase(),
    }));
  } catch {
    return getFallbackDiagnosticQuestions(subjectName);
  }
}

function getFallbackDiagnosticQuestions(subjectName: string): DiagnosticQuestion[] {
  const questions: DiagnosticQuestion[] = [];
  for (let q = 1; q <= 4; q++) {
    for (let o = 1; o <= 5; o++) {
      questions.push({
        id: `diag-fb-${q}-${o}`,
        subjectId: subjectName.toLowerCase(),
        quarter: q,
        questionOrder: o,
        questionText: `Sample diagnostic question ${o} for Quarter ${q}`,
        options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
        correctOption: 0,
      });
    }
  }
  return questions;
}

export async function getAIExplanation(
  sectionContent: string,
  grade: number
): Promise<string> {
  if (!API_KEY) return 'This section covers important concepts that build on foundational knowledge. Practice applying these ideas to real-world scenarios for better understanding.';

  const system = `You are an engaging tutor. Explain the following lesson section comprehensively in 3–5 sentences. Expand on the key idea, clarify any difficult concepts, and give one memorable real-world example. Keep it conversational and suitable for a grade ${grade} student.`;

  try {
    const text = await callAnthropic(system, sectionContent.substring(0, 1000));
    return text;
  } catch {
    return 'This section covers important foundational concepts. Try to connect these ideas to things you see in your daily life!';
  }
}

export async function getAITutorResponse(
  lessonTitle: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  if (!API_KEY) return "I'd be happy to help! That's a great question about this topic. The key concept here is to understand the fundamental principles and how they connect to real-world applications.";

  const system = `You are a friendly, expert tutor helping a secondary school student understand '${lessonTitle}'. Give clear, encouraging, concise answers (2–4 sentences) with a practical example when helpful.`;

  try {
    const apiMessages = messages.map(m => ({
      role: m.role === 'tutor' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));
    
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages: apiMessages,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "I'm here to help! Could you rephrase your question?";
  } catch {
    return "I'm having trouble connecting right now. Please try again in a moment!";
  }
}