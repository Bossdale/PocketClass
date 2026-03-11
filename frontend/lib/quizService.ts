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
// Fallback questions — 10 items, mixed types
function getFallbackLessonQuestions(): QuizQuestion[] {
  return [
    { id: 'fb-1',  type: 'multiple_choice', difficulty: 'easy',   questionText: 'Which of the following best describes this concept?',      options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, explanation: 'Option A is correct because it most accurately captures the core definition introduced in this lesson.' },
    { id: 'fb-2',  type: 'true_false',      difficulty: 'easy',   questionText: 'This topic is fundamental to the subject.',                 correctAnswer: true,  explanation: 'This is true — foundational topics underpin all subsequent learning in this subject area.' },
    { id: 'fb-3',  type: 'fill_blank',      difficulty: 'easy',   questionText: 'The main idea of this lesson is ___.',                      correctAnswer: 'concept', hint: 'Think about the core topic',            explanation: 'The word "concept" refers to the central idea or principle introduced in this lesson.' },
    { id: 'fb-4',  type: 'multiple_choice', difficulty: 'easy',   questionText: 'What is the primary application of this concept?',          options: ['Daily life', 'Space travel', 'Deep sea diving', 'Time travel'], correctOption: 0, explanation: 'Daily life is correct — most foundational concepts are designed to apply to everyday situations.' },
    { id: 'fb-5',  type: 'true_false',      difficulty: 'medium', questionText: 'Advanced understanding of this topic requires prior knowledge.', correctAnswer: true, explanation: 'True — this subject builds progressively, meaning earlier knowledge is essential for understanding advanced material.' },
    { id: 'fb-6',  type: 'multiple_choice', difficulty: 'medium', questionText: 'Which statement is most accurate about this topic?',        options: ['Statement A', 'Statement B', 'Statement C', 'Statement D'], correctOption: 1, explanation: 'Statement B is the most accurate as it reflects the nuanced understanding expected at this level of study.' },
    { id: 'fb-7',  type: 'fill_blank',      difficulty: 'medium', questionText: 'The process described in this lesson is called ___.',       correctAnswer: 'process', hint: 'Refer to the main definition',          explanation: '"Process" refers to the sequence of steps or actions described as the central mechanism of this lesson.' },
    { id: 'fb-8',  type: 'multiple_choice', difficulty: 'hard',   questionText: 'Which of the following is the best real-world example?',    options: ['Example A', 'Example B', 'Example C', 'Example D'], correctOption: 2, explanation: 'Example C best demonstrates the concept in action because it reflects the conditions and outcomes described in the lesson.' },
    { id: 'fb-9',  type: 'true_false',      difficulty: 'hard',   questionText: 'This concept can be applied across multiple disciplines.',  correctAnswer: false, explanation: 'False — while the concept is broadly useful, its application is specifically scoped to the discipline covered in this course.' },
    { id: 'fb-10', type: 'fill_blank',      difficulty: 'hard',   questionText: 'A key result of applying this concept is ___.',             correctAnswer: 'outcome', hint: 'Think about the effect or result',       explanation: '"Outcome" is the term used to describe the measurable end result when this concept is correctly applied.' },
  ];
}

// Fallback quarterly exam — generates lessonCount × 5 mixed questions dynamically
function getFallbackQuarterlyExamQuestions(lessonCount: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const totalQuestions = lessonCount * 5;

  const mcTemplates = [
    { questionText: 'Which of the following best describes this concept?',       options: ['It defines a process', 'It describes an outcome', 'It identifies a cause', 'It measures a result'], correctOption: 0 },
    { questionText: 'What is the primary purpose of this topic?',                options: ['To explain a phenomenon', 'To solve an equation', 'To list definitions', 'To compare methods'], correctOption: 0 },
    { questionText: 'Which statement is most accurate about this subject?',      options: ['It applies broadly', 'It is only theoretical', 'It has no real use', 'It was recently invented'], correctOption: 0 },
    { questionText: 'What does this concept primarily involve?',                 options: ['Analysis of data', 'Memorization of facts', 'Random guessing', 'Avoiding the topic'], correctOption: 0 },
    { questionText: 'Which of the following is a real-world application?',       options: ['Everyday problem solving', 'Deep sea exploration', 'Time travel', 'Interplanetary travel'], correctOption: 0 },
    { questionText: 'What is a key characteristic of this lesson topic?',        options: ['It builds on prior knowledge', 'It stands alone completely', 'It contradicts science', 'It is purely fictional'], correctOption: 0 },
    { questionText: 'Which example best illustrates this concept?',              options: ['A practical scenario', 'An impossible situation', 'A mythical story', 'A random event'], correctOption: 0 },
    { questionText: 'How is this concept commonly applied in practice?',         options: ['Through observation', 'By ignoring evidence', 'Through guessing', 'By avoiding examples'], correctOption: 0 },
    { questionText: 'What outcome does this concept typically produce?',         options: ['A measurable result', 'No outcome', 'Confusion only', 'Irrelevant data'], correctOption: 0 },
    { questionText: 'Which of the following supports understanding this topic?', options: ['Studying examples', 'Skipping practice', 'Avoiding review', 'Ignoring context'], correctOption: 0 },
  ];

  const tfTemplates = [
    { questionText: 'This topic is relevant to real-world applications.',             correctAnswer: true  },
    { questionText: 'Understanding this concept requires no prior knowledge.',        correctAnswer: false },
    { questionText: 'This subject matter builds on foundational principles.',         correctAnswer: true  },
    { questionText: 'The key ideas in this quarter are unrelated to each other.',     correctAnswer: false },
    { questionText: 'Applying this concept can help solve practical problems.',       correctAnswer: true  },
    { questionText: 'This topic has no connection to other areas of study.',          correctAnswer: false },
    { questionText: 'Reviewing examples helps reinforce understanding of this topic.',correctAnswer: true  },
    { questionText: 'This concept is only useful in a classroom setting.',            correctAnswer: false },
    { questionText: 'Critical thinking is important when studying this subject.',     correctAnswer: true  },
    { questionText: 'All questions about this topic have a single correct answer.',   correctAnswer: false },
  ];

  const fbTemplates = [
    { questionText: 'The main idea behind this lesson is called ___.',          correctAnswer: 'concept',     hint: 'Think about the core topic' },
    { questionText: 'A key term introduced in this quarter is ___.',            correctAnswer: 'term',        hint: 'Recall vocabulary from lessons' },
    { questionText: 'The process described in this lesson is known as ___.',    correctAnswer: 'process',     hint: 'Refer to the main definition' },
    { questionText: 'The result of applying this concept is called ___.',       correctAnswer: 'outcome',     hint: 'Think about the end effect' },
    { questionText: 'The principle that governs this topic is called ___.',     correctAnswer: 'principle',   hint: 'This was introduced early in the quarter' },
    { questionText: 'A practical example of this concept is known as ___.',     correctAnswer: 'application', hint: 'Think of real-world use' },
    { questionText: 'The foundational rule discussed in this lesson is ___.',   correctAnswer: 'rule',        hint: 'It was defined as the basis' },
    { questionText: 'The relationship between these ideas is described as ___.',correctAnswer: 'connection',  hint: 'Think about how they link' },
    { questionText: 'The technique used to solve this type of problem is ___.',correctAnswer: 'method',      hint: 'Recall the step-by-step approach' },
    { questionText: 'The subject area this lesson belongs to is called ___.',   correctAnswer: 'subject',     hint: 'Think about the broader discipline' },
  ];

  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  for (let i = 0; i < totalQuestions; i++) {
    const difficulty = difficulties[i % 3];
    const typeIndex  = i % 3; // 0=mc, 1=tf, 2=fb — cycles evenly
    const templateIndex = i % 10;

    if (typeIndex === 0) {
      const t = mcTemplates[templateIndex];
      questions.push({
        id: `qexam-mc-${i}`,
        type: 'multiple_choice',
        difficulty,
        questionText: `Lesson ${Math.floor(i / 5) + 1}: ${t.questionText}`,
        options: t.options,
        correctOption: t.correctOption,
        explanation: `The correct answer is "${t.options[t.correctOption]}" — this is the option that best aligns with the lesson objectives for Lesson ${Math.floor(i / 5) + 1}.`,
      });
    } else if (typeIndex === 1) {
      const t = tfTemplates[templateIndex];
      questions.push({
        id: `qexam-tf-${i}`,
        type: 'true_false',
        difficulty,
        questionText: `Lesson ${Math.floor(i / 5) + 1}: ${t.questionText}`,
        correctAnswer: t.correctAnswer,
        explanation: `This statement is ${t.correctAnswer} — it reflects a key principle covered in Lesson ${Math.floor(i / 5) + 1} of this quarter.`,
      });
    } else {
      const t = fbTemplates[templateIndex];
      questions.push({
        id: `qexam-fb-${i}`,
        type: 'fill_blank',
        difficulty,
        questionText: `Lesson ${Math.floor(i / 5) + 1}: ${t.questionText}`,
        correctAnswer: t.correctAnswer,
        hint: t.hint,
        explanation: `The answer "${t.correctAnswer}" is the key term from Lesson ${Math.floor(i / 5) + 1} that completes this statement correctly.`,
      });
    }
  }

  return questions;
}

export async function generateLessonQuiz(
  lessonTitle: string,
  lessonContent: string,
  grade: number,
  country: string
): Promise<QuizQuestion[]> {
  if (!API_KEY) return getFallbackLessonQuestions();

  const system = `You are an educational content creator for secondary school grade ${grade} students in ${country}. Generate quiz questions strictly based on the lesson '${lessonTitle}'. Return ONLY a valid JSON array of exactly 10 question objects. No markdown, no preamble, no explanation.`;

  const user = `Generate exactly 10 quiz questions based on this lesson. Use ONLY these 3 types:

Distribution:
- 4 multiple_choice  (2 easy, 2 medium)
- 3 true_false       (2 easy, 1 hard)
- 3 fill_blank / identification  (1 easy, 1 medium, 1 hard)

Difficulty spread: 4 easy, 3 medium, 3 hard.

Schemas — use EXACTLY these formats, always include explanation:
{ "type":"multiple_choice", "difficulty":"easy"|"medium"|"hard", "questionText":"...", "options":["A","B","C","D"], "correctOption":0, "explanation":"1-2 sentence explanation of why the correct answer is right." }
{ "type":"true_false",      "difficulty":"easy"|"medium"|"hard", "questionText":"...", "correctAnswer":true, "explanation":"1-2 sentence explanation of why the statement is true or false." }
{ "type":"fill_blank",      "difficulty":"easy"|"medium"|"hard", "questionText":"Sentence with ___ as blank.", "correctAnswer":"exact answer", "hint":"short clue", "explanation":"1-2 sentence explanation of the correct answer." }

Rules:
- All questions must be directly based on the lesson content below.
- fill_blank acts as identification: the student types the missing term.
- Order: easy first, then medium, then hard.
- correctOption for multiple_choice is a 0-based index.

Lesson: ${lessonContent.substring(0, 800)}`;

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
  country: string,
  lessonCount: number = 5  // 5 questions per lesson
): Promise<QuizQuestion[]> {
  if (!API_KEY) return getFallbackQuarterlyExamQuestions(lessonCount);

  const totalQuestions = lessonCount * 5;
  // Distribute types proportionally across total
  const mcCount   = Math.round(totalQuestions * 0.4);  // 40% multiple choice
  const tfCount   = Math.round(totalQuestions * 0.3);  // 30% true/false
  const fbCount   = totalQuestions - mcCount - tfCount; // 30% identification

  const system = `You are an educational content creator for secondary school grade ${grade} students in ${country}. Generate a quarterly exam for ${subjectName} Quarter ${quarter}: ${quarterTopic}. Return ONLY a valid JSON array of exactly ${totalQuestions} question objects. No markdown, no preamble, no explanation.`;

  const user = `Generate exactly ${totalQuestions} quarterly exam questions covering all ${lessonCount} lessons in Quarter ${quarter} (${quarterTopic}).

This quarter has ${lessonCount} lessons — generate 5 questions per lesson, spread evenly across all lesson topics.

Distribution:
- ${mcCount} multiple_choice
- ${tfCount} true_false
- ${fbCount} fill_blank (identification)

Difficulty spread: roughly 1/3 each — easy, medium, hard.

Schemas — use EXACTLY these formats, always include explanation:
{ "type":"multiple_choice", "difficulty":"easy"|"medium"|"hard", "questionText":"...", "options":["A","B","C","D"], "correctOption":0, "explanation":"1-2 sentence explanation of why the correct answer is right." }
{ "type":"true_false",      "difficulty":"easy"|"medium"|"hard", "questionText":"...", "correctAnswer":true, "explanation":"1-2 sentence explanation of why the statement is true or false." }
{ "type":"fill_blank",      "difficulty":"easy"|"medium"|"hard", "questionText":"Sentence with ___ as blank.", "correctAnswer":"exact answer", "hint":"short clue", "explanation":"1-2 sentence explanation of the correct answer." }

Rules:
- Cover ALL ${lessonCount} lessons — do not focus on just one or two.
- fill_blank acts as identification: the student types the missing term.
- Order: easy first, then medium, then hard.
- correctOption for multiple_choice is a 0-based index.`;

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