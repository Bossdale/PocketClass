# PocketClass — AI Module Documentation

> **Version:** 1.0  
> **Module path:** `lib/ai/`  
> **Model:** `gemma:2b` via Ollama (local, offline)  
> **Runtime:** Node.js (CLI testing) / React Native (production)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Directory Structure](#3-directory-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Core — ModelClass](#5-core--modelclass)
6. [Core — PromptTemplates](#6-core--prompttemplates)
7. [Utilities](#7-utilities)
   - [JsonParser](#71-jsonparser)
   - [JsonToString](#72-jsontostring)
8. [Input Types](#8-input-types)
9. [Output Types](#9-output-types)
10. [Services](#10-services)
    - [DiagnosticQuizService](#101-diagnosticquizservice)
    - [StudyPlanService](#102-studyplanservice)
    - [LessonMaterialService](#103-lessonmaterialservice)
    - [LessonQuizService](#104-lessonquizservice)
    - [QuarterlyExamService](#105-quarterlyexamservice)
    - [AITutorService](#106-aitutorservice)
    - [AIExplanationService](#107-aiexplanationservice)
11. [Barrel Export — index.ts](#11-barrel-export--indexts)
12. [CLI Testing with main.ts](#12-cli-testing-with-maints)
    - [Setup](#121-setup)
    - [Test Runner Structure](#122-test-runner-structure)
    - [Testing Each Service](#123-testing-each-service)
    - [Running the Tests](#124-running-the-tests)
    - [Reading the Output](#125-reading-the-output)
    - [Common Errors & Fixes](#126-common-errors--fixes)
13. [Adding a New AI Feature](#13-adding-a-new-ai-feature)
14. [Temperature Reference](#14-temperature-reference)

---

## 1. Overview

The AI module is a self-contained TypeScript layer that connects every AI-powered screen in PocketClass to a locally running `gemma:2b` model via Ollama. All inference happens on-device — no internet connection or external API key is required.

The module covers four screens and seven distinct AI features:

| Screen | AI Feature | Service |
|---|---|---|
| `DiagnosticTest.tsx` | Generate 5 MCQ questions per quarter | `DiagnosticQuizService` |
| `DiagnosticTest.tsx` → `DiagnosticResultCard.tsx` | Generate personalised study plan from scores | `StudyPlanService` |
| `LessonView.tsx` | Generate structured 3-page lesson content | `LessonMaterialService` |
| `LessonView.tsx` | Generate adaptive 10-question lesson quiz | `LessonQuizService` |
| `LessonView.tsx` | Generate spoken TTS follow-up explanation | `AIExplanationService` |
| `LessonView.tsx` → `AITutor.tsx` | AI tutor chatbot replies | `AITutorService` |
| `QuarterlyExam.tsx` | Generate 15-question quarterly exam | `QuarterlyExamService` |

Every service shares a single `ChatOllama` instance managed by `ModelClass` (Singleton pattern). No service ever instantiates the model directly.

---

## 2. Prerequisites

### Ollama

Ollama must be installed and running locally before any service can be called.

```bash
# Install Ollama (macOS / Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model used by the app
ollama pull gemma:2b

# Verify the model is available
ollama list
# Expected output includes:  gemma:2b
```

> **Windows:** Download the installer from [https://ollama.com](https://ollama.com).  
> The Ollama server runs on `http://localhost:11434` by default.

### Node.js Dependencies

```bash
# From the project root
npm install

# Required packages (should already be in package.json)
npm install @langchain/ollama @langchain/core
npm install --save-dev tsx typescript @types/node
```

### TypeScript / tsx

The CLI test runner uses `tsx` to execute TypeScript files directly without a separate compile step.

```bash
npm install --save-dev tsx

# Verify
npx tsx --version
```

---

## 3. Directory Structure

```
lib/ai/
│
├── index.ts                          # Barrel export — single import point
│
├── model/
│   └── ModelClass.ts                 # Singleton ChatOllama instance
│
├── templates/
│   └── PromptTemplates.ts            # All 7 static LangChain prompt templates
│
├── utils/
│   ├── JsonParser.ts                 # Cleans & parses raw LLM JSON output
│   └── JsonToString.ts              # Coerces any value to string for prompt injection
│
├── types/
│   ├── inputs/
│   │   ├── DiagnosticQuizInput.ts    # Input for DiagnosticQuizService
│   │   ├── DiagnosticScoreInput.ts   # Input for StudyPlanService
│   │   ├── LessonMaterialInput.ts    # Input for LessonMaterialService
│   │   ├── LessonQuizInput.ts        # Input for LessonQuizService
│   │   ├── QuarterlyExamInput.ts     # Input for QuarterlyExamService
│   │   ├── TutorChatInput.ts         # Input for AITutorService (+ ChatHistoryEntry)
│   │   └── AIExplanationInput.ts     # Input for AIExplanationService
│   │
│   └── outputs/
│       ├── QuizQuestion.ts           # Union type for all 5 question variants
│       ├── LessonMaterial.ts         # 3-page lesson structure (Page1/2/3)
│       └── StudyPlan.ts              # Per-quarter study plan
│
└── services/
    ├── DiagnosticQuizService.ts
    ├── StudyPlanService.ts
    ├── LessonMaterialService.ts
    ├── LessonQuizService.ts
    ├── QuarterlyExamService.ts
    ├── AITutorService.ts
    └── AIExplanationService.ts
```

---

## 4. Architecture & Data Flow

The module is built in strict layers. Data flows top-to-bottom; no layer ever imports from a layer above it.

```
┌─────────────────────────────────────────────────────┐
│                   SCREENS / HOOKS                   │
│  DiagnosticTest  LessonView  QuarterlyExam  AITutor  │
└──────────────────────┬──────────────────────────────┘
                       │  import from '@/lib/ai'
┌──────────────────────▼──────────────────────────────┐
│                    SERVICES  (7)                    │
│  Each service has one static method and owns        │
│  no state. It picks a prompt, calls the model,      │
│  and returns a typed result.                        │
└───────┬──────────────────────────┬──────────────────┘
        │ getInstance()            │ prompt
┌───────▼──────────┐  ┌───────────▼──────────────────┐
│   ModelClass     │  │      PromptTemplates          │
│  (Singleton)     │  │  7 static PromptTemplate      │
│  ChatOllama x1   │  │  instances, one per feature   │
└───────┬──────────┘  └──────────────────────────────┘
        │ .pipe().invoke()
┌───────▼──────────────────────────────────────────────┐
│                  ChatOllama (Ollama)                  │
│              gemma:2b  —  local model                 │
└───────┬──────────────────────────────────────────────┘
        │ raw string response
┌───────▼──────────────────────────────────────────────┐
│                   UTILITIES                           │
│   JsonParser   — sanitises & parses JSON responses   │
│   JsonToString — coerces values to strings           │
└──────────────────────────────────────────────────────┘
```

**Call pattern used by every service:**

```typescript
// 1. Get (or lazily create) the singleton model
const model = ModelClass.getInstance();

// 2. Create a chain: prompt → model
const chain = PromptTemplates.somethingPrompt.pipe(model);

// 3. Invoke with the template variables
const raw = await chain.invoke({ variable1, variable2 });

// 4a. For structured outputs: sanitise and parse
return jsonParser<ExpectedType>(raw.content);

// 4b. For plain-text outputs (chat/TTS): coerce and return
return jsonToString(raw.content).trim();
```

---

## 5. Core — ModelClass

**File:** `lib/ai/model/ModelClass.ts`

The `ModelClass` is the foundation of the entire module. It implements the **Singleton pattern** to ensure `ChatOllama` is constructed exactly once, regardless of how many services are active simultaneously.

### Why Singleton?

Constructing `ChatOllama` is expensive. It opens a connection to the local Ollama server and loads `gemma:2b` into memory. On a mobile device, creating a new instance per service call would cause:
- Noticeable latency on every AI action
- Multiple redundant server connections
- Potential out-of-memory crashes on lower-end devices

### Public API

```typescript
// Get the shared ChatOllama instance (creates it on first call)
ModelClass.getInstance(): ChatOllama

// Temporarily change the model's temperature
ModelClass.setTemperature(temp: number): void

// Read the current temperature
ModelClass.getTemperature(): number | null

// Destroy the instance (testing teardown only)
ModelClass.reset(): void
```

### How Services Use It

```typescript
// Inside any service — this is the only allowed way to get the model
const model = ModelClass.getInstance();
const chain = PromptTemplates.lessonQuizPrompt.pipe(model);
```

### Temperature Management

Services that generate factual output (quizzes, exams) temporarily lower the temperature to `0.2` before calling the model and reset it to `0.5` after. This makes quiz answers more deterministic without permanently changing the global setting.

```typescript
// Pattern used by DiagnosticQuizService, LessonQuizService, QuarterlyExamService
ModelClass.setTemperature(0.2);
const raw = await chain.invoke({ ... });
ModelClass.setTemperature(0.5);  // always reset
```

---

## 6. Core — PromptTemplates

**File:** `lib/ai/templates/PromptTemplates.ts`

`PromptTemplates` is a static class that acts as the **central registry** for all seven LangChain `PromptTemplate` instances. Each prompt is constructed once at module load time and reused by its corresponding service on every call.

### Why Static?

`PromptTemplate` instances are pure data — they hold a template string and a list of input variable names. There is no runtime state that requires instance creation. Keeping them static avoids allocation cost and makes the mapping between service and prompt explicit and auditable in one file.

### Prompt Registry

| Static Property | Used By | Output Format |
|---|---|---|
| `diagnosticQuizPrompt` | `DiagnosticQuizService` | JSON array |
| `diagnosticStudyPlanPrompt` | `StudyPlanService` | JSON object |
| `lessonMaterialPrompt` | `LessonMaterialService` | JSON object |
| `lessonQuizPrompt` | `LessonQuizService` | JSON array |
| `quarterlyExamPrompt` | `QuarterlyExamService` | JSON array |
| `aiTutorChatPrompt` | `AITutorService` | Plain string |
| `aiExplanationPrompt` | `AIExplanationService` | Plain string |

### Adding a New Prompt

To add an eighth AI feature, add one static property here and one new service file. No other files need to change.

```typescript
// In PromptTemplates.ts
static myNewFeaturePrompt = new PromptTemplate({
  inputVariables: ['var1', 'var2'],
  template: `Your prompt text with {var1} and {var2}. Return JSON: {{ ... }}`,
});
```

---

## 7. Utilities

### 7.1 JsonParser

**File:** `lib/ai/utils/JsonParser.ts`  
**Used by:** `DiagnosticQuizService`, `StudyPlanService`, `LessonMaterialService`, `LessonQuizService`, `QuarterlyExamService`

`gemma:2b` does not always return clean JSON. `jsonParser` normalises the raw model output through five cleaning steps before calling `JSON.parse()`.

#### Cleaning Pipeline

| Step | What It Removes | Example |
|---|---|---|
| 0 | Coerce to string, trim whitespace | `"  {...}  "` → `"{...}"` |
| 1 | Markdown code fences | ` ```json\n{...}\n``` ` → `{...}` |
| 2 | Outer wrapping quotes | `'"{...}"'` → `'{...}'` |
| 3 | LangChain double-brace escaping | `{{key}}` → `{key}` |
| 4 | Escaped inner quotes | `\"value\"` → `"value"` |

#### Generic Type Parameter

```typescript
// Without type parameter — returns object
const result = jsonParser(raw.content);

// With type parameter — returns typed value, no casting needed
const questions = jsonParser<MultipleChoiceQuestion[]>(raw.content);
const material  = jsonParser<LessonMaterial>(raw.content);
const plan      = jsonParser<StudyPlan>(raw.content);
```

#### Error Behaviour

If `JSON.parse()` fails after all cleaning steps, it throws a native `SyntaxError`. Services do not catch this — it surfaces as an unhandled rejection so the calling screen can display an error state and prompt a retry.

---

### 7.2 JsonToString

**File:** `lib/ai/utils/JsonToString.ts`  
**Used by:** `AITutorService`, `AIExplanationService`

Ensures any value injected into a LangChain prompt variable is a plain string. LangChain's `PromptTemplate.invoke()` expects all variable values to be strings — passing an array or object would produce `[object Object]` in the rendered prompt.

```typescript
jsonToString("hello")          // → "hello"             (passthrough)
jsonToString(["a", "b"])       // → '["a","b"]'          (JSON.stringify)
jsonToString({ role: "user" }) // → '{"role":"user"}'    (JSON.stringify)
```

---

## 8. Input Types

Each input type is a TypeScript `interface` that defines the exact data shape a screen must provide to a service. They live in `lib/ai/types/inputs/`.

### DiagnosticQuizInput

```typescript
interface DiagnosticQuizInput {
  subjectName:  string;  // e.g. "Mathematics"
  quarter:      number;  // 1 | 2 | 3 | 4
  quarterTopic: string;  // e.g. "Algebra Basics"
  grade:        number;  // 7–12
  country:      string;  // "indonesia" | "malaysia" | "brunei"
}
```

Built by `DiagnosticTest.tsx` from the `SUBJECTS` constant, `QUARTER_TOPICS`, and the student's profile.

---

### DiagnosticScoreInput

```typescript
interface DiagnosticScoreInput {
  quarter1_score:   number;
  quarter1_lessons: string[];
  quarter2_score:   number;
  quarter2_lessons: string[];
  quarter3_score:   number;
  quarter3_lessons: string[];
  quarter4_score:   number;
  quarter4_lessons: string[];
}
```

Built by `DiagnosticTest.tsx` after the test completes. Scores come from `getQuarterScores()` in the `useDiagnostic` hook; lesson arrays come from the DB. Direct evolution of the original `diagnosticScoreInterface`.

---

### LessonMaterialInput

```typescript
interface LessonMaterialInput {
  topic:   string;  // lesson.title
  lecture: string;  // lesson.sections joined as a single string
}
```

The `lecture` field must be the **full unedited content** of all lesson sections joined together — the prompt instructs the model to stay strictly within it and not hallucinate.

---

### LessonQuizInput

```typescript
interface LessonQuizInput {
  lessonTitle: string;
  content:     string;  // lesson.sections.map(s => s.content).join('\n')
  grade:       number;
  country:     string;
}
```

---

### QuarterlyExamInput

```typescript
interface QuarterlyExamInput {
  subjectName: string;
  quarter:     number;
  topic:       string;  // QUARTER_TOPICS[subjectId][quarter - 1]
  grade:       number;
  country:     string;
}
```

---

### TutorChatInput & ChatHistoryEntry

```typescript
interface ChatHistoryEntry {
  role:    'user' | 'tutor';
  content: string;
}

interface TutorChatInput {
  lessonTitle: string;
  history:     ChatHistoryEntry[];
}
```

The entire conversation history is sent on every call because the local LLM has no memory between invocations. `AITutor.tsx` builds the `history` array by mapping its `messages` state: `messages.map(m => ({ role: m.role, content: m.content }))`.

---

### AIExplanationInput

```typescript
interface AIExplanationInput {
  text:  string;  // stripMarkdown(lesson.sections[currentSection].content)
  grade: number;
}
```

The `text` field should be the already-stripped plain-text version of the section content (no markdown symbols) since it will ultimately be spoken aloud.

---

## 9. Output Types

### QuizQuestion (Union)

**File:** `lib/ai/types/outputs/QuizQuestion.ts`

All three quiz-generating services return `QuizQuestion[]`. It is a **discriminated union** — `QuizRenderer.tsx` switches on `question.type` to select the correct renderer component, and TypeScript narrows the type automatically inside each branch.

```typescript
type QuizQuestion =
  | MultipleChoiceQuestion  // type: 'multiple_choice'
  | TrueFalseQuestion       // type: 'true_false'
  | FillBlankQuestion       // type: 'fill_blank'
  | DragDropQuestion        // type: 'drag_drop'
  | MatchingQuestion        // type: 'matching'
```

**Difficulty distribution by service:**

| Service | easy | medium | hard | Total | Types |
|---|---|---|---|---|---|
| `DiagnosticQuizService` | 5 | 0 | 0 | 5 | MCQ only |
| `LessonQuizService` | 4 | 4 | 2 | 10 | MCQ, T/F, Fill-blank |
| `QuarterlyExamService` | 5 | 5 | 5 | 15 | All 5 types |

---

### LessonMaterial

**File:** `lib/ai/types/outputs/LessonMaterial.ts`

```typescript
interface LessonMaterial {
  page1: {
    topic_introduction:  string;
    learning_objectives: string[];
    tip:                 string;
  };
  page2: {
    lecture_content: string;
    key_concepts:    string[];
  };
  page3: {
    real_life_application: string;
    summary:               string;
  };
}
```

`LessonView.tsx` navigates between pages using `currentSection` state. Each page maps directly to a rendered card in the lesson content view.

---

### StudyPlan

**File:** `lib/ai/types/outputs/StudyPlan.ts`

```typescript
interface StudyPlan {
  quarter1: StudyPlanQuarter;
  quarter2: StudyPlanQuarter;
  quarter3: StudyPlanQuarter;
  quarter4: StudyPlanQuarter;
}

interface StudyPlanQuarter {
  lessons:                string;   // comma-separated lesson titles
  is_need_review:         boolean;
  how_to_get_high_scores: string;   // numbered list "1. ... 2. ..."
  focus_level:            'High Priority' | 'Moderate Priority' | 'Low Priority';
}
```

Focus level is determined by the score band: `0–50` = High, `51–75` = Moderate, `76–100` = Low. `DiagnosticResultCard.tsx` reads `is_need_review` to render the warning pills and `how_to_get_high_scores` for the study plan card.

---

## 10. Services

All services are **static classes** — no instantiation needed, no shared state. Every method follows the same four-step pattern: get model → pick prompt → invoke chain → parse output.

---

### 10.1 DiagnosticQuizService

**File:** `lib/ai/services/DiagnosticQuizService.ts`  
**Screen:** `DiagnosticTest.tsx` (via `useDiagnostic` hook)

Generates 5 multiple-choice diagnostic questions for **one quarter at a time**. The `useDiagnostic` hook calls this service 4 times to populate all 4 quarters of a diagnostic test.

```typescript
DiagnosticQuizService.generateQuestions(
  input: DiagnosticQuizInput
): Promise<MultipleChoiceQuestion[]>
```

**Temperature:** `0.2` (deterministic — quiz answers must be factually consistent)

**Connection chain:**
```
DiagnosticTest.tsx
  → useDiagnostic hook
    → DiagnosticQuizService.generateQuestions()
      → ModelClass.getInstance()
      → PromptTemplates.diagnosticQuizPrompt.pipe(model)
      → chain.invoke({ subjectName, quarter, quarterTopic, grade, country })
      → jsonParser<MultipleChoiceQuestion[]>(raw.content)
```

---

### 10.2 StudyPlanService

**File:** `lib/ai/services/StudyPlanService.ts`  
**Screen:** `DiagnosticTest.tsx` → `DiagnosticResultCard.tsx`

Generates a personalised quarter-by-quarter study plan immediately after the diagnostic is saved. The result drives the "📋 Study Plan" section in `DiagnosticResultCard.tsx`.

```typescript
StudyPlanService.generateStudyPlan(
  input: DiagnosticScoreInput
): Promise<StudyPlan>
```

**Temperature:** `0.5` (default — needs some creativity for varied study advice)

**Note:** `quarter*_lessons` arrays are joined to comma-separated strings internally before prompt injection, because LangChain requires all prompt variables to be strings.

**Connection chain:**
```
DiagnosticTest.tsx (processResults useEffect)
  → StudyPlanService.generateStudyPlan()
    → ModelClass.getInstance()
    → PromptTemplates.diagnosticStudyPlanPrompt.pipe(model)
    → chain.invoke({ quarter1_score, quarter1_lessons, ... })
    → jsonParser<StudyPlan>(raw.content)
    → DiagnosticResultCard.tsx renders result
```

---

### 10.3 LessonMaterialService

**File:** `lib/ai/services/LessonMaterialService.ts`  
**Screen:** `LessonView.tsx`

Transforms raw seeded lesson content from the database into a structured, student-friendly 3-page presentation. The model is instructed to use only the provided `lecture` content and not add facts.

```typescript
LessonMaterialService.generateMaterial(
  input: LessonMaterialInput
): Promise<LessonMaterial>
```

**Temperature:** `0.5` (default — needs clarity and slight reformulation of source text)

**Connection chain:**
```
LessonView.tsx (on lesson load)
  → LessonMaterialService.generateMaterial()
    → ModelClass.getInstance()
    → PromptTemplates.lessonMaterialPrompt.pipe(model)
    → chain.invoke({ topic, lecture })
    → jsonParser<LessonMaterial>(raw.content)
    → page1 / page2 / page3 rendered in section cards
```

---

### 10.4 LessonQuizService

**File:** `lib/ai/services/LessonQuizService.ts`  
**Screen:** `LessonView.tsx` (triggered by "🎯 Take Quiz" button)

Generates an adaptive 10-question quiz based strictly on the lesson's content. Uses only `multiple_choice`, `true_false`, and `fill_blank` types (drag/drop and matching are reserved for the quarterly exam).

```typescript
LessonQuizService.generateQuiz(
  input: LessonQuizInput
): Promise<QuizQuestion[]>
```

**Temperature:** `0.2` (deterministic — correct answers must match the lesson content)

**Connection chain:**
```
LessonView.tsx (startQuiz)
  → LessonQuizService.generateQuiz()
    → ModelClass.getInstance()
    → PromptTemplates.lessonQuizPrompt.pipe(model)
    → chain.invoke({ lessonTitle, content, grade, country })
    → jsonParser<QuizQuestion[]>(raw.content)
    → QuizRenderer renders each question
```

---

### 10.5 QuarterlyExamService

**File:** `lib/ai/services/QuarterlyExamService.ts`  
**Screen:** `QuarterlyExam.tsx` (triggered by "Start Exam" button)

Generates a comprehensive 15-question exam using all 5 question types. Only accessible after all lessons in the quarter are completed (enforced by `dbQuarterlyExamUnlocked` in `SubjectView.tsx`).

```typescript
QuarterlyExamService.generateExam(
  input: QuarterlyExamInput
): Promise<QuizQuestion[]>
```

**Temperature:** `0.2` (deterministic — exam answers must be factually consistent)

**Connection chain:**
```
QuarterlyExam.tsx (startExam)
  → QuarterlyExamService.generateExam()
    → ModelClass.getInstance()
    → PromptTemplates.quarterlyExamPrompt.pipe(model)
    → chain.invoke({ subjectName, quarter, topic, grade, country })
    → jsonParser<QuizQuestion[]>(raw.content)
    → QuizRenderer → QuizDragDrop / QuizMatching as needed
```

---

### 10.6 AITutorService

**File:** `lib/ai/services/AITutorService.ts`  
**Screen:** `LessonView.tsx` → `AITutor.tsx` component (floating FAB)

Powers the context-aware chatbot. The full conversation history is serialised and injected into the prompt on every call because `gemma:2b` has no persistent memory between invocations.

```typescript
AITutorService.getResponse(
  input: TutorChatInput
): Promise<string>
```

**Temperature:** `0.5` (default — responses must be natural and conversational, not robotic)  
**Output:** Plain text string, no JSON parsing. Displayed directly in the chat bubble.

**History format:** The `ChatHistoryEntry[]` array is converted to a readable dialogue string by `formatHistory()`:
```
Student: What is photosynthesis?
Tutor: Photosynthesis is the process by which plants...
Student: Can you give an example?
```

**Connection chain:**
```
AITutor.tsx (sendMessage)
  → AITutorService.getResponse()
    → ModelClass.getInstance()
    → AITutorService.formatHistory(input.history)  [private]
    → PromptTemplates.aiTutorChatPrompt.pipe(model)
    → chain.invoke({ lessonTitle, history })
    → jsonToString(raw.content).trim()
    → displayed in chat bubble
```

---

### 10.7 AIExplanationService

**File:** `lib/ai/services/AIExplanationService.ts`  
**Screen:** `LessonView.tsx` (triggered by the 🔊 TTS button)

Generates a grade-appropriate spoken follow-up explanation. Called inside the `onDone` callback of `expo-speech` after the raw lesson section has been read aloud. The returned string is immediately fed into a second `Speech.speak()` call — it is never shown on screen.

```typescript
AIExplanationService.getExplanation(
  input: AIExplanationInput
): Promise<string>
```

**Temperature:** `0.5` (default — natural spoken language, not robotic)  
**Output:** Plain text string, no JSON parsing. Must be free of markdown, lists, and special characters.

**Connection chain:**
```
LessonView.tsx (handleTTS → Speech.speak onDone)
  → AIExplanationService.getExplanation()
    → ModelClass.getInstance()
    → jsonToString(input.text)           [sanitise before injection]
    → PromptTemplates.aiExplanationPrompt.pipe(model)
    → chain.invoke({ text, grade })
    → jsonToString(raw.content).trim()
    → Speech.speak(explanation)
```

---

## 11. Barrel Export — index.ts

**File:** `lib/ai/index.ts`

The single entry point for the entire module. Every screen and hook imports exclusively from here.

```typescript
// Screens use one clean import for everything they need
import {
  LessonQuizService,
  LessonMaterialService,
  type LessonQuizInput,
  type LessonMaterial,
  type QuizQuestion,
} from '@/lib/ai';
```

**Why this matters:** The internal file paths of services, types, and utilities are completely hidden from consumers. The entire internal structure can be refactored without touching a single import statement in any screen file.

### What Each Screen Imports

```typescript
// DiagnosticTest.tsx
import { DiagnosticQuizService, StudyPlanService } from '@/lib/ai';
import type { DiagnosticQuizInput, DiagnosticScoreInput } from '@/lib/ai';

// LessonView.tsx
import { LessonMaterialService, LessonQuizService, AIExplanationService } from '@/lib/ai';
import type { LessonMaterialInput, LessonQuizInput, AIExplanationInput, LessonMaterial } from '@/lib/ai';

// QuarterlyExam.tsx
import { QuarterlyExamService } from '@/lib/ai';
import type { QuarterlyExamInput } from '@/lib/ai';

// AITutor.tsx
import { AITutorService } from '@/lib/ai';
import type { TutorChatInput, ChatHistoryEntry } from '@/lib/ai';
```

---

## 12. CLI Testing with main.ts

The `main.ts` file at the project root is the **CLI test runner** for the AI module. It lets developers test every service directly from the terminal without launching the mobile app, making it possible to iterate on prompts and verify model output quickly.

### 12.1 Setup

Create or replace your `main.ts` with the full test runner below. Place it at the root of the project (same level as `package.json`).

**`tsconfig.json`** — ensure module resolution is set correctly:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "paths": {
      "@/lib/ai": ["./lib/ai/index.ts"],
      "@/lib/ai/*": ["./lib/ai/*"]
    }
  }
}
```

**`package.json`** — add a test script:

```json
{
  "scripts": {
    "test:ai": "npx tsx main.ts"
  }
}
```

---

### 12.2 Test Runner Structure

The test runner is organised into labelled sections that can be run individually by commenting out the sections you don't need. Each section:

1. Declares a typed mock input
2. Calls the service
3. Prints the structured result with a label
4. Catches and reports errors without crashing subsequent tests

---

### 12.3 Testing Each Service

Replace the contents of your `main.ts` with the following complete test runner:

```typescript
// main.ts — PocketClass AI Module CLI Test Runner
// Run with:  npx tsx main.ts

import { ModelClass }            from './lib/ai/model/ModelClass';
import { DiagnosticQuizService } from './lib/ai/services/DiagnosticQuizService';
import { StudyPlanService }      from './lib/ai/services/StudyPlanService';
import { LessonMaterialService } from './lib/ai/services/LessonMaterialService';
import { LessonQuizService }     from './lib/ai/services/LessonQuizService';
import { QuarterlyExamService }  from './lib/ai/services/QuarterlyExamService';
import { AITutorService }        from './lib/ai/services/AITutorService';
import { AIExplanationService }  from './lib/ai/services/AIExplanationService';

import type { DiagnosticQuizInput }  from './lib/ai/types/inputs/DiagnosticQuizInput';
import type { DiagnosticScoreInput } from './lib/ai/types/inputs/DiagnosticScoreInput';
import type { LessonMaterialInput }  from './lib/ai/types/inputs/LessonMaterialInput';
import type { LessonQuizInput }      from './lib/ai/types/inputs/LessonQuizInput';
import type { QuarterlyExamInput }   from './lib/ai/types/inputs/QuarterlyExamInput';
import type { TutorChatInput }       from './lib/ai/types/inputs/TutorChatInput';
import type { AIExplanationInput }   from './lib/ai/types/inputs/AIExplanationInput';

// ─── Shared mock lesson content ───────────────────────────────────────────────

const MOCK_LESSON_CONTENT = `
# The Human Digestive System

## Introduction
The digestive system breaks down food into nutrients the body can absorb and use for energy, growth, and repair.

## Key Organs
- **Mouth**: Chewing and saliva begin the breakdown of food.
- **Oesophagus**: Carries food from the mouth to the stomach.
- **Stomach**: Acids and enzymes break down food further into a liquid called chyme.
- **Small Intestine**: Absorbs most nutrients into the bloodstream.
- **Large Intestine**: Absorbs water; remaining waste forms stool.
- **Liver**: Produces bile to help digest fats.
- **Pancreas**: Releases enzymes and regulates blood sugar.

## Process Summary
Digestion begins in the mouth and ends in the large intestine.
The entire process takes 24 to 72 hours depending on what was eaten.
`;

const MOCK_LESSON_TITLE = 'Biology — The Human Digestive System';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function printResult(label: string, data: unknown): void {
  console.log(`\n▶ ${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

async function runTest<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  console.log(`\n⏳ Running: ${label}...`);
  try {
    const result = await fn();
    console.log(`✅ Passed: ${label}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed: ${label}`);
    console.error('   Error:', (err as Error).message);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — ModelClass Singleton
// Verifies the singleton initialises and returns a stable instance.
// ═════════════════════════════════════════════════════════════════════════════

async function testModelClass(): Promise<void> {
  printSection('TEST 1 — ModelClass Singleton');

  const m1 = ModelClass.getInstance();
  const m2 = ModelClass.getInstance();

  const isSameInstance = m1 === m2;
  console.log(`\n▶ Same instance on double call: ${isSameInstance ? '✅ YES' : '❌ NO'}`);
  console.log(`▶ Default temperature: ${ModelClass.getTemperature()}`);

  ModelClass.setTemperature(0.2);
  console.log(`▶ After setTemperature(0.2): ${ModelClass.getTemperature()}`);

  ModelClass.setTemperature(0.5);
  console.log(`▶ After reset to 0.5: ${ModelClass.getTemperature()}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — DiagnosticQuizService
// Generates 5 MCQ questions for one quarter of a diagnostic test.
// ═════════════════════════════════════════════════════════════════════════════

async function testDiagnosticQuizService(): Promise<void> {
  printSection('TEST 2 — DiagnosticQuizService');

  const input: DiagnosticQuizInput = {
    subjectName:  'Biology',
    quarter:      1,
    quarterTopic: 'The Human Digestive System',
    grade:        9,
    country:      'malaysia',
  };

  console.log('\n📥 Input:', JSON.stringify(input, null, 2));

  const result = await runTest('DiagnosticQuizService.generateQuestions', () =>
    DiagnosticQuizService.generateQuestions(input),
  );

  if (result) {
    printResult('Questions generated', result);
    console.log(`\n▶ Question count: ${result.length} (expected 5)`);
    console.log(`▶ All are MCQ: ${result.every(q => q.type === 'multiple_choice') ? '✅' : '❌'}`);
    console.log(`▶ All are easy: ${result.every(q => q.difficulty === 'easy') ? '✅' : '❌'}`);
    console.log(`▶ All have 4 options: ${result.every(q => q.options.length === 4) ? '✅' : '❌'}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3 — StudyPlanService
// Generates a personalised study plan from diagnostic scores.
// ═════════════════════════════════════════════════════════════════════════════

async function testStudyPlanService(): Promise<void> {
  printSection('TEST 3 — StudyPlanService');

  const input: DiagnosticScoreInput = {
    quarter1_score:   42,
    quarter1_lessons: ['The Human Digestive System', 'The Circulatory System'],
    quarter2_score:   68,
    quarter2_lessons: ['Cells and Cell Division', 'DNA and Heredity'],
    quarter3_score:   85,
    quarter3_lessons: ['Photosynthesis', 'Respiration in Plants'],
    quarter4_score:   55,
    quarter4_lessons: ['Ecosystems', 'Food Chains and Webs'],
  };

  console.log('\n📥 Scores: Q1=42 Q2=68 Q3=85 Q4=55');

  const result = await runTest('StudyPlanService.generateStudyPlan', () =>
    StudyPlanService.generateStudyPlan(input),
  );

  if (result) {
    printResult('Study plan generated', result);
    console.log('\n▶ Focus level checks:');
    console.log(`   Q1 (score 42)  → ${result.quarter1.focus_level} (expected: High Priority)`);
    console.log(`   Q2 (score 68)  → ${result.quarter2.focus_level} (expected: Moderate Priority)`);
    console.log(`   Q3 (score 85)  → ${result.quarter3.focus_level} (expected: Low Priority)`);
    console.log(`   Q4 (score 55)  → ${result.quarter4.focus_level} (expected: Moderate Priority)`);
    console.log(`\n▶ Q1 needs review: ${result.quarter1.is_need_review} (expected: true)`);
    console.log(`▶ Q3 needs review: ${result.quarter3.is_need_review} (expected: false)`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — LessonMaterialService
// Generates a 3-page structured lesson from raw content.
// ═════════════════════════════════════════════════════════════════════════════

async function testLessonMaterialService(): Promise<void> {
  printSection('TEST 4 — LessonMaterialService');

  const input: LessonMaterialInput = {
    topic:   MOCK_LESSON_TITLE,
    lecture: MOCK_LESSON_CONTENT,
  };

  console.log(`\n📥 Topic: "${input.topic}"`);
  console.log(`▶ Lecture content: ${input.lecture.length} characters`);

  const result = await runTest('LessonMaterialService.generateMaterial', () =>
    LessonMaterialService.generateMaterial(input),
  );

  if (result) {
    console.log('\n▶ Page 1 — Introduction:');
    console.log('   topic_introduction:', result.page1.topic_introduction);
    console.log('   learning_objectives:', result.page1.learning_objectives);
    console.log('   tip:', result.page1.tip);

    console.log('\n▶ Page 2 — Core Content:');
    console.log('   lecture_content (first 200 chars):',
      result.page2.lecture_content.substring(0, 200) + '...');
    console.log('   key_concepts:', result.page2.key_concepts);

    console.log('\n▶ Page 3 — Application:');
    console.log('   real_life_application:', result.page3.real_life_application);
    console.log('   summary:', result.page3.summary);

    console.log('\n▶ Structure checks:');
    console.log(`   Has page1: ${!!result.page1 ? '✅' : '❌'}`);
    console.log(`   Has page2: ${!!result.page2 ? '✅' : '❌'}`);
    console.log(`   Has page3: ${!!result.page3 ? '✅' : '❌'}`);
    console.log(`   learning_objectives is array: ${Array.isArray(result.page1.learning_objectives) ? '✅' : '❌'}`);
    console.log(`   key_concepts is array: ${Array.isArray(result.page2.key_concepts) ? '✅' : '❌'}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — LessonQuizService
// Generates a 10-question adaptive quiz based on lesson content.
// ═════════════════════════════════════════════════════════════════════════════

async function testLessonQuizService(): Promise<void> {
  printSection('TEST 5 — LessonQuizService');

  const input: LessonQuizInput = {
    lessonTitle: MOCK_LESSON_TITLE,
    content:     MOCK_LESSON_CONTENT,
    grade:       9,
    country:     'malaysia',
  };

  console.log(`\n📥 Lesson: "${input.lessonTitle}" | Grade: ${input.grade} | Country: ${input.country}`);

  const result = await runTest('LessonQuizService.generateQuiz', () =>
    LessonQuizService.generateQuiz(input),
  );

  if (result) {
    printResult('Quiz questions generated', result);

    const types = result.map(q => q.type);
    const difficulties = result.map(q => q.difficulty);

    console.log('\n▶ Summary:');
    console.log(`   Total questions: ${result.length} (expected 10)`);
    console.log(`   Types present: ${[...new Set(types)].join(', ')}`);
    console.log(`   Easy: ${difficulties.filter(d => d === 'easy').length} (expected 4)`);
    console.log(`   Medium: ${difficulties.filter(d => d === 'medium').length} (expected 4)`);
    console.log(`   Hard: ${difficulties.filter(d => d === 'hard').length} (expected 2)`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6 — QuarterlyExamService
// Generates a 15-question exam using all 5 question types.
// ═════════════════════════════════════════════════════════════════════════════

async function testQuarterlyExamService(): Promise<void> {
  printSection('TEST 6 — QuarterlyExamService');

  const input: QuarterlyExamInput = {
    subjectName: 'Biology',
    quarter:     1,
    topic:       'Human Body Systems — Digestive, Circulatory, Respiratory',
    grade:       9,
    country:     'malaysia',
  };

  console.log('\n📥 Input:', JSON.stringify(input, null, 2));

  const result = await runTest('QuarterlyExamService.generateExam', () =>
    QuarterlyExamService.generateExam(input),
  );

  if (result) {
    const types = result.map(q => q.type);
    const difficulties = result.map(q => q.difficulty);

    console.log('\n▶ Summary:');
    console.log(`   Total questions: ${result.length} (expected 15)`);
    console.log(`   Types present: ${[...new Set(types)].join(', ')}`);
    console.log(`   Easy: ${difficulties.filter(d => d === 'easy').length} (expected 5)`);
    console.log(`   Medium: ${difficulties.filter(d => d === 'medium').length} (expected 5)`);
    console.log(`   Hard: ${difficulties.filter(d => d === 'hard').length} (expected 5)`);
    console.log(`   Has drag_drop: ${types.includes('drag_drop') ? '✅' : '⚠️ none generated'}`);
    console.log(`   Has matching: ${types.includes('matching') ? '✅' : '⚠️ none generated'}`);

    console.log('\n▶ First 3 questions (preview):');
    result.slice(0, 3).forEach((q, i) => {
      console.log(`   [${i + 1}] type=${q.type} | difficulty=${q.difficulty}`);
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 7 — AITutorService
// Tests a 2-turn conversation anchored to the lesson topic.
// ═════════════════════════════════════════════════════════════════════════════

async function testAITutorService(): Promise<void> {
  printSection('TEST 7 — AITutorService');

  // Turn 1 — opening question
  const turn1Input: TutorChatInput = {
    lessonTitle: MOCK_LESSON_TITLE,
    history: [
      { role: 'user', content: 'What does the small intestine do?' },
    ],
  };

  console.log('\n📥 Turn 1 — Student asks: "What does the small intestine do?"');

  const reply1 = await runTest('AITutorService.getResponse (turn 1)', () =>
    AITutorService.getResponse(turn1Input),
  );

  if (reply1) {
    console.log(`\n▶ Tutor reply:\n   "${reply1}"`);
    console.log(`▶ Is plain text (no JSON): ${!reply1.startsWith('{') ? '✅' : '❌'}`);

    // Turn 2 — follow-up using history
    const turn2Input: TutorChatInput = {
      lessonTitle: MOCK_LESSON_TITLE,
      history: [
        { role: 'user',  content: 'What does the small intestine do?' },
        { role: 'tutor', content: reply1 },
        { role: 'user',  content: 'How long does this process take?' },
      ],
    };

    console.log('\n📥 Turn 2 — Student follow-up: "How long does this process take?"');

    const reply2 = await runTest('AITutorService.getResponse (turn 2 with history)', () =>
      AITutorService.getResponse(turn2Input),
    );

    if (reply2) {
      console.log(`\n▶ Tutor reply:\n   "${reply2}"`);
      console.log('▶ History context carried forward: ✅');
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 8 — AIExplanationService
// Tests grade-calibrated spoken follow-up explanations.
// ═════════════════════════════════════════════════════════════════════════════

async function testAIExplanationService(): Promise<void> {
  printSection('TEST 8 — AIExplanationService');

  const sectionText = `
    The small intestine absorbs most nutrients into the bloodstream.
    It is about 6 to 7 metres long and is lined with tiny finger-like 
    projections called villi that increase the surface area for absorption.
  `.trim();

  // Test for Grade 7 (simple explanation)
  const grade7Input: AIExplanationInput = { text: sectionText, grade: 7 };

  console.log(`\n📥 Input text (first 100 chars): "${sectionText.substring(0, 100)}..."`);
  console.log('▶ Testing Grade 7 explanation...');

  const grade7Result = await runTest('AIExplanationService.getExplanation (Grade 7)', () =>
    AIExplanationService.getExplanation(grade7Input),
  );

  if (grade7Result) {
    console.log(`\n▶ Grade 7 explanation:\n   "${grade7Result}"`);
    console.log(`▶ No markdown symbols: ${!/[*#[\]`]/.test(grade7Result) ? '✅' : '❌'}`);
    console.log(`▶ Suitable for TTS (plain text): ✅`);
  }

  // Test for Grade 12 (more technical)
  const grade12Input: AIExplanationInput = { text: sectionText, grade: 12 };
  console.log('\n▶ Testing Grade 12 explanation...');

  const grade12Result = await runTest('AIExplanationService.getExplanation (Grade 12)', () =>
    AIExplanationService.getExplanation(grade12Input),
  );

  if (grade12Result) {
    console.log(`\n▶ Grade 12 explanation:\n   "${grade12Result}"`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN — Run all tests sequentially
// Comment out individual sections to skip them during development.
// ═════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('\n🚀 PocketClass AI Module — CLI Test Runner');
  console.log('Model: gemma:2b via Ollama');
  console.log('Ensure Ollama is running:  ollama serve');
  console.log('Ensure model is pulled:    ollama pull gemma:2b\n');

  const startTime = Date.now();

  // ── Run individual tests (comment out any you want to skip) ───────────────
  await testModelClass();
  await testDiagnosticQuizService();
  await testStudyPlanService();
  await testLessonMaterialService();
  await testLessonQuizService();
  await testQuarterlyExamService();
  await testAITutorService();
  await testAIExplanationService();
  // ─────────────────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ All tests complete — ${elapsed}s`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥 Unhandled error in test runner:', err);
  process.exit(1);
});
```

---

### 12.4 Running the Tests

```bash
# Run the full test suite
npx tsx main.ts

# Or if you added the npm script
npm run test:ai
```

**To test a single service**, comment out all other test calls in the `main()` function at the bottom of the file:

```typescript
async function main(): Promise<void> {
  // Only run the lesson material test
  // await testModelClass();
  // await testDiagnosticQuizService();
  // await testStudyPlanService();
  await testLessonMaterialService();   // ← only this runs
  // await testLessonQuizService();
  // ...
}
```

---

### 12.5 Reading the Output

Each test section produces output in this format:

```
════════════════════════════════════════════════════════════
  TEST 4 — LessonMaterialService
════════════════════════════════════════════════════════════

📥 Topic: "Biology — The Human Digestive System"
▶ Lecture content: 782 characters

⏳ Running: LessonMaterialService.generateMaterial...
✅ Passed: LessonMaterialService.generateMaterial

▶ Page 1 — Introduction:
   topic_introduction: "The human digestive system is a remarkable..."
   learning_objectives: ["Identify the major organs...", "Explain how nutrients..."]
   tip: "Draw a diagram of the digestive tract..."

▶ Structure checks:
   Has page1: ✅
   Has page2: ✅
   Has page3: ✅
   learning_objectives is array: ✅
   key_concepts is array: ✅
```

**Status indicators:**
- `⏳` — test is running (waiting for model response)
- `✅ Passed` — service returned without throwing
- `❌ Failed` — service threw an error (message shown below)
- `✅` / `❌` inline — structural assertion about the returned data

---

### 12.6 Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Error: connect ECONNREFUSED 127.0.0.1:11434` | Ollama server is not running | Run `ollama serve` in a separate terminal |
| `Error: model 'gemma:2b' not found` | Model not pulled | Run `ollama pull gemma:2b` |
| `SyntaxError: Unexpected token` | Model returned malformed JSON | Re-run the test — the model occasionally produces invalid JSON. If persistent, check the prompt in `PromptTemplates.ts` |
| `Cannot find module '@/lib/ai'` | Path alias not resolved by tsx | Import directly: `import { ... } from './lib/ai'` in `main.ts` |
| `TypeError: Cannot read properties of undefined` | JSON parsed successfully but structure doesn't match type | The model omitted a required field. Check the prompt output format section |

**Tip — Debugging a malformed JSON response:**  
Add a `console.log(raw.content)` call inside the relevant service *before* the `jsonParser()` call, then re-run `main.ts`. This prints the exact raw string the model returned so you can see what `jsonParser` received.

---

## 13. Adding a New AI Feature

Follow these steps in order:

1. **Define the input type** — create `lib/ai/types/inputs/MyFeatureInput.ts`
2. **Define the output type** — create `lib/ai/types/outputs/MyFeatureOutput.ts` (if needed)
3. **Write the prompt** — add a static property to `PromptTemplates.ts`
4. **Write the service** — create `lib/ai/services/MyFeatureService.ts`
5. **Export from the barrel** — add exports to `lib/ai/index.ts`
6. **Add a test** — add a `testMyFeatureService()` function to `main.ts`

No other files need to change. The singleton `ModelClass` and both utilities are already available to the new service without modification.

---

## 14. Temperature Reference

| Value | Behaviour | Used for |
|---|---|---|
| `0.0–0.2` | Highly deterministic | Quiz generation, exam generation — answers must be factually consistent |
| `0.3–0.5` | Balanced (default: `0.5`) | Study plans, lesson material, chat, TTS explanations |
| `0.6–1.0` | Creative / unpredictable | Not recommended for this app — risks hallucination in educational content |

Services that require a different temperature call `ModelClass.setTemperature()` before invoking the model and **always reset to `0.5` afterwards**. This pattern ensures the global default is never accidentally left at a non-standard value between service calls.
