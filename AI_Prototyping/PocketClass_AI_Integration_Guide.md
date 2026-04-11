# PocketClass — Local AI Integration Guide

> **Version:** 1.0 · **Stack:** Expo 54 / React Native 0.81 / TypeScript · **AI Runtime:** llama.rn (llama.cpp)
> **Target Platforms:** Android (Windows dev) · iOS (Mac dev)

---

## Table of Contents

1. [Overview of AI Integration](#1-overview-of-ai-integration)
2. [Definition of Concepts Applied](#2-definition-of-concepts-applied)
3. [Project Structure with Local AI](#3-project-structure-with-local-ai)
4. [Integration Instructions](#4-integration-instructions)
   - [Windows → Android](#41-windows--android)
   - [Mac → iOS](#42-mac--ios)
5. [AI Services — Implementation Instructions](#5-ai-services--implementation-instructions)
   - [llamaService.ts — Core Engine](#51-llamaservicets--core-engine)
   - [generateLessonQuiz](#52-generatelessonquiz)
   - [generateQuarterlyExam](#53-generatequarterlyexam)
   - [generateDiagnosticQuestions](#54-generatediagnosticquestions)
   - [getAIExplanation](#55-getaiexplanation)
   - [getAITutorResponse](#56-getaitutorresponse)
   - [getStudyPlan](#57-getstudyplan)
6. [Mapping AI Output → Local Database](#6-mapping-ai-output--local-database)
7. [Mapping Frontend Inputs → AI](#7-mapping-frontend-inputs--ai)
8. [Updating PocketClass_AIFeatures for Local AI Testing](#8-updating-pocketclass_aifeatures-for-local-ai-testing)

---

## 1. Overview of AI Integration

PocketClass is a mobile learning application built for secondary school students across Indonesia, Malaysia, and Brunei. The app delivers curriculum-aligned content across six subjects (Mathematics, Science, English, History, Geography, Civics), structured across four quarters of twenty lessons each.

The original implementation routes all AI calls to the **Anthropic Claude API** over the internet, which requires a live API key and a network connection. The local AI integration replaces this with an on-device **GGUF language model** running through `llama.rn`, a React Native binding for `llama.cpp`. Once integrated, every AI feature in PocketClass operates with no internet dependency, no API cost, and no data leaving the device — a critical requirement for students in low-connectivity environments.

### What the AI Does in PocketClass

The AI powers six distinct features, all defined in `frontend/lib/quizService.ts`:

| Feature | Trigger | Output |
|---|---|---|
| **Lesson Quiz Generation** | Student completes a lesson | 10 quiz questions (MC, T/F, fill-blank) |
| **Quarterly Exam Generation** | All lessons in a quarter completed | `lessonCount × 5` exam questions |
| **Diagnostic Test Generation** | Student starts a new subject | 20 baseline questions across 4 quarters |
| **AI Section Explanation** | Student taps "Explain" on a lesson section | 3–5 spoken-style explanatory sentences |
| **AI Tutor Chat** | Student opens the AI Tutor overlay in a lesson | Conversational, multi-turn Q&A responses |
| **Study Plan Generation** | Diagnostic test completed | Personalised 4-quarter study plan JSON |

### What Changes with Local AI

The migration is a **drop-in replacement**. The two internal helper functions — `callAnthropic(system, user)` and `callOllama(system, user)` — are both replaced by a single `callLocalLlama(system, user)` that has the identical signature `(string, string) => Promise<string>`. Every higher-level service function (`generateLessonQuiz`, `getAITutorResponse`, etc.) is unchanged — they still build their prompts and parse their outputs exactly as before.

---

## 2. Definition of Concepts Applied

### 2.1 Large Language Model (LLM)

A **large language model** is a neural network trained on massive text datasets to predict and generate human-like text. Given a sequence of text (the "prompt"), it generates a continuation token by token. PocketClass uses an LLM to generate quiz questions, write explanations, respond to student questions, and produce structured study plans.

**How it is applied:** The app sends a prompt composed of a *system instruction* (role and task definition) and a *user message* (the specific request with lesson context) to the model. The model returns a text completion which is then either parsed as JSON (for structured features) or displayed directly (for conversational features).

### 2.2 GGUF Format

**GGUF** (GPT-Generated Unified Format) is a binary file format for storing quantised LLM weights. It is the successor to GGML and is the native format used by `llama.cpp`. A single `.gguf` file contains the model architecture, vocabulary, and all weight tensors in a compact, memory-mappable layout.

**How it is applied:** The developer places a `.gguf` file inside `frontend/assets/models/`. At runtime, `llama.rn` memory-maps this file into the process, avoiding a full load into RAM. This is the file the student's device runs inference on.

### 2.3 Quantisation

**Quantisation** is the process of reducing the numerical precision of model weights (e.g., from 32-bit float to 4-bit integer) to shrink file size and memory footprint, at a small cost to output quality. Common quantisation levels used with GGUF are Q4_K_M, Q5_K_M, and Q8_0.

**How it is applied:** The GGUF model the developer bundles should be chosen based on target device RAM. Mid-range Android devices (3–4 GB RAM) should use a Q4_K_M quantised 1B–3B parameter model. Higher-end devices (6–8 GB) can use Q5_K_M or larger models. The quantisation level is baked into the `.gguf` filename and requires no code changes.

### 2.4 Context Window

The **context window** is the maximum number of tokens (roughly 0.75 words each) the model can process in one call, including both the prompt and the generated response. Exceeding this limit causes older content to be silently dropped.

**How it is applied:** In `llamaService.ts`, the `n_ctx` parameter is set to `2048` tokens — sufficient for all PocketClass prompts. Lesson content sent to quiz generation is truncated to 800 characters in the prompt to stay safely within this limit. The tutor chat flattens conversation history into a single prompt string; long histories are trimmed to the last 10 turns before being sent.

### 2.5 Prompt Engineering

**Prompt engineering** is the practice of carefully crafting the text sent to an LLM to reliably produce the desired output format and content. It includes writing system instructions, specifying output schemas, and providing examples.

**How it is applied:** Every service function in `quizService.ts` uses a two-part prompt: a `system` string that defines the AI's role and output constraints, and a `user` string that provides the specific task. For structured outputs (quiz questions, study plans), the system prompt explicitly states "Return ONLY a valid JSON array/object. No markdown, no preamble." The `parseJsonResponse` utility then strips any accidental markdown fences before `JSON.parse`.

### 2.6 Structured Output (JSON Mode)

**Structured output** means instructing the model to respond exclusively in a specific data format (JSON) so the application can reliably parse and use the response programmatically.

**How it is applied:** Four of the six AI features require JSON output: lesson quiz, quarterly exam, diagnostic questions, and study plan. Each prompt schema precisely defines the expected object shape with field names, types, and example values. The `parseJsonResponse(text)` function in `quizService.ts` handles the extraction. If JSON parsing fails, a static fallback dataset is returned so the app never crashes.

### 2.7 Inference Parameters

**Inference parameters** control how the model generates text. Key parameters used in PocketClass:

- `n_predict` — maximum tokens to generate per call
- `temperature` — randomness (0.0 = deterministic, 1.0 = creative)
- `top_p` — nucleus sampling threshold (filters low-probability tokens)
- `stop` — token sequences that end generation early

**How it is applied:** Quiz and exam generation uses `temperature: 0.7` and `n_predict: 1200` for creative but structured output. The AI Tutor uses `temperature: 0.8` for natural conversation. Section Explanations use `temperature: 0.6` and `n_predict: 300` for concise, controlled text.

### 2.8 Chat Template / Prompt Format

Every instruction-tuned model expects its input in a specific **chat template** format with special tokens marking system, user, and assistant turns. Using the wrong template produces degraded outputs.

**How it is applied:** `llamaService.ts` formats prompts using the `<|system|>` / `<|user|>` / `<|assistant|>` template, compatible with Phi-3, Llama 3.x, and similar instruction-tuned models. The developer must verify the template matches the bundled `.gguf` file. A `PROMPT_TEMPLATES` map is provided in the service for other common formats (Mistral, Gemma, ChatML).

### 2.9 Native Module / Bridge

A **native module** is platform-specific code (C++, Swift, Kotlin) exposed to JavaScript/TypeScript through React Native's bridge. `llama.rn` ships pre-compiled native binaries that wrap `llama.cpp` and expose a JavaScript API.

**How it is applied:** The developer installs `llama.rn` via npm, then runs `expo run:android` or `expo run:ios` to compile and link the native binary into the app. After that, JavaScript code calls `initLlama()` and `context.completion()` which transparently execute in a background C++ thread, keeping the UI thread unblocked.

### 2.10 AsyncStorage (Local Database)

**AsyncStorage** is React Native's key-value persistence layer — a simple, asynchronous, unencrypted string store backed by SQLite on Android and flat files on iOS. PocketClass uses it as its entire local database.

**How it is applied:** All AI outputs that need to persist — quiz results, diagnostic scores, chat messages, study plans — are serialised to JSON and written to AsyncStorage by functions in `store.ts`. The AI itself is stateless; `store.ts` is the sole source of truth between sessions.

---

## 3. Project Structure with Local AI

```
PocketClass/
└── frontend/
    ├── app/
    │   ├── _layout.tsx              # ← MODIFY: call initLocalLlama() on mount
    │   ├── (tabs)/
    │   │   └── index.tsx            # Home / subject dashboard
    │   ├── index.tsx                # Entry / splash
    │   ├── Onboarding.tsx           # Profile creation (grade, country)
    │   ├── SubjectView.tsx          # Quarter & lesson list
    │   ├── LessonView.tsx           # Lesson reader + AI Tutor overlay
    │   ├── DiagnosticTest.tsx       # Baseline diagnostic quiz screen
    │   └── QuarterlyExam.tsx        # Quarter exam screen
    │
    ├── assets/
    │   └── models/
    │       └── your-model.gguf      # ← ADD: place your GGUF model file here
    │
    ├── components/
    │   └── AITutor.tsx              # Chat overlay — no changes needed
    │
    └── lib/
        ├── llamaService.ts          # ← CREATE NEW: engine init + callLocalLlama()
        ├── quizService.ts           # ← MODIFY: redirect callAnthropic → callLocalLlama
        ├── store.ts                 # Local database — no changes needed
        ├── types.ts                 # TypeScript types — no changes needed
        ├── masteryService.ts        # Score computation — no changes needed
        └── tts.ts                   # Text-to-speech — no changes needed
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Screens                        │
│  LessonView  │  DiagnosticTest  │  QuarterlyExam  │  index  │
└──────┬───────┴────────┬─────────┴────────┬─────────┴───┬────┘
       │                │                  │             │
       ▼                ▼                  ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    quizService.ts                           │
│  generateLessonQuiz │ generateQuarterlyExam │ getStudyPlan  │
│  generateDiagnostic │ getAIExplanation      │ getAITutor    │
└──────────────────────────────┬──────────────────────────────┘
                               │  callLocalLlama(system, user)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    llamaService.ts                          │
│  initLocalLlama() → LlamaContext → context.completion()     │
└──────────────────────────────┬──────────────────────────────┘
                               │  llama.rn native bridge
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              assets/models/your-model.gguf                  │
│              (runs on CPU + GPU via Metal / Vulkan)         │
└─────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │  AI text response                   │
            ▼                                     ▼
┌───────────────────────┐            ┌────────────────────────┐
│  Parsed JSON output   │            │  Plain text output     │
│  (quiz / exam /       │            │  (explanation /        │
│   diagnostic /        │            │   tutor response)      │
│   study plan)         │            │                        │
└──────────┬────────────┘            └───────────┬────────────┘
           │                                     │
           ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       store.ts                              │
│  AsyncStorage — saveLessonQuizResult, saveDiagnosticResult  │
│  saveQuarterlyExamResult, saveStudyPlan, saveChatMessage     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Integration Instructions

### 4.1 Windows → Android

#### Prerequisites

- Node.js 18+ and npm
- Android Studio (latest stable)
- Android SDK, platform-tools, NDK r25+ (install via SDK Manager in Android Studio)
- A physical Android device or emulator (API level 31+, minimum 3 GB RAM)
- USB debugging enabled on device

#### Step 1 — Install llama.rn

Navigate into the `frontend` directory and install `llama.rn` using npm. This adds the package to `package.json` and downloads the native module source files that will be compiled during the build step.

#### Step 2 — Add the GGUF Model

Place your `.gguf` file inside `frontend/assets/models/`. Keep the model file under approximately 1.5 GB for broad device compatibility.

Open `app.json` and add a plugins entry for `llama.rn`. Inside that plugin configuration, provide the model's name and its relative source path pointing to `./assets/models/your-model.gguf`. This tells Metro to include the binary file in the app bundle.

#### Step 3 — Create `frontend/lib/llamaService.ts`

Create this new file from scratch. See the full implementation instructions in [Section 5.1](#51-llamaservicets--core-engine).

#### Step 4 — Patch `quizService.ts`

At the top of `frontend/lib/quizService.ts`, import `callLocalLlama` from `./llamaService`. Then replace the entire body of the existing `callAnthropic` function so that it simply delegates to `callLocalLlama`, passing through both the `system` and `user` arguments and returning the result. The function signature stays the same — only the internal implementation changes.

Also update `getAITutorResponse` to use `callLocalLlamaWithHistory` instead of the direct `fetch` call it currently makes. See [Section 5.6](#56-getaitutorresponse) for the specific changes.

#### Step 5 — Warm Up the Model on App Start

Open `frontend/app/_layout.tsx`. Import `initLocalLlama` from `@/lib/llamaService`. Inside the root layout component, add a `useEffect` with an empty dependency array that calls `initLocalLlama()` and silently catches any errors with a `console.warn`. This pre-loads the model in the background the moment the app launches, so the first AI call the student triggers does not have to wait for model initialisation.

#### Step 6 — Build and Run

Run `npx expo run:android` to generate the Android build. This step compiles the native C++ code from `llama.rn` using the Android NDK and links it into the APK. It will take approximately 5 minutes on the first run. On subsequent runs, `npx expo start --android` can be used with the Metro dev server.

> **Important:** `llama.rn` requires a **development build** and cannot run inside the Expo Go client app. If you see "NativeModule not found", you have run `expo start` instead of `expo run:android`.

#### Step 7 — Verify the NDK Version

If the build fails with a CMake or NDK-related error, open Android Studio, go to SDK Manager, select the SDK Tools tab, and install **NDK (Side by side)** version **25.1.8937393** or later.

#### Troubleshooting (Windows/Android)

| Symptom | Fix |
|---|---|
| `NativeModule 'Llama' is null` | Ran in Expo Go — use `expo run:android` |
| CMake build error | Install NDK r25+ via Android Studio SDK Manager |
| Model not found on device | Check `app.json` plugin config; run `expo prebuild --clean` |
| Out of memory crash on emulator | Increase emulator RAM to 4 GB in AVD Manager, or test on physical device |
| Slow first inference | Normal — first call compiles GPU kernels. Subsequent calls are faster. |

---

### 4.2 Mac → iOS

#### Prerequisites

- macOS 13+ (Ventura or later)
- Xcode 15+
- CocoaPods (`sudo gem install cocoapods`)
- An Apple Developer account (free tier works for personal device testing)
- iPhone or iPad with iOS 16+, minimum 3 GB RAM

#### Step 1 — Install llama.rn

Navigate into the `frontend` directory and install `llama.rn` using npm, same as the Android guide.

#### Step 2 — Add the GGUF Model

Same as the Android guide — place the file in `frontend/assets/models/` and add the plugin configuration to `app.json`.

#### Step 3 — Install iOS Pods

Navigate into the `ios` subdirectory and run `pod install`. This downloads and links the native iOS dependencies for `llama.rn`, including the compiled Metal-accelerated llama.cpp framework. Return to the `frontend` directory after this completes. If `pod install` reports a version conflict, run `pod repo update` first, then retry with `pod install --repo-update`.

#### Step 4 — Create `llamaService.ts` and Patch `quizService.ts`

Follow Steps 3 and 4 from the Android guide exactly. The TypeScript files are identical across both platforms.

#### Step 5 — Enable Metal GPU Acceleration

When writing `llamaService.ts`, ensure the `n_gpu_layers` parameter in the `initLlama` call is set to `99`. On iOS, `llama.rn` automatically routes these layers to the Metal GPU framework when the value is greater than zero, which dramatically reduces inference time compared to CPU-only mode.

#### Step 6 — Set a Large File Entitlement (if model > 512 MB)

For model files larger than 512 MB, open `ios/PocketClass/PocketClass.entitlements` and add an entry for `com.apple.developer.kernel.extended-virtual-addressing` with a boolean value of `true`. This entitlement allows iOS to memory-map files beyond the default 512 MB limit, which is required for most usefully-sized language models.

#### Step 7 — Build and Run

Run `npx expo run:ios` for the first build. On subsequent runs, use `npx expo start --ios`.

#### Step 8 — Trust the Developer Certificate on Device

On the test iPhone, navigate to **Settings → General → VPN & Device Management → [Your Apple ID] → Trust**.

#### Troubleshooting (Mac/iOS)

| Symptom | Fix |
|---|---|
| `NativeModule 'Llama' is null` | Ran in Expo Go — use `expo run:ios` |
| CocoaPods version conflict | `sudo gem update cocoapods && pod install --repo-update` |
| "Untrusted Developer" on device | Settings → General → VPN & Device Management → Trust |
| App crashes on model load | Enable Extended Virtual Addressing entitlement (Step 6) |
| Slow inference on old iPhone | Reduce `n_ctx` to 1024 and use a smaller Q4_K_M model |
| Model file not bundled in IPA | Verify `app.json` plugin block and run `expo prebuild --clean && expo run:ios` |

---

## 5. AI Services — Implementation Instructions

Each section below describes exactly what to write in each file and function. Follow the comments in order — they are your step-by-step implementation guide.

---

### 5.1 `llamaService.ts` — Core Engine

**Create this file at:** `frontend/lib/llamaService.ts`

This is the only file in the project that imports from `llama.rn`. Everything else calls through `callLocalLlama`. Build it in the order shown below.

```typescript
// ─── IMPORTS ──────────────────────────────────────────────────────────────────
// 1. Import initLlama and the LlamaContext type from 'llama.rn'.
// 2. Import Asset from 'expo-asset' to resolve the bundled model file path.

// ─── MODULE-LEVEL STATE ───────────────────────────────────────────────────────
// 3. Declare a variable typed as LlamaContext | null, initialised to null.
//    This holds the single active model context for the lifetime of the app.
//    It is module-level (not React state) so it persists across all component
//    renders and navigation events.
//
// 4. Declare a second variable typed as Promise<void> | null, initialised to null.
//    This holds the in-progress init Promise so that if two components call
//    initLocalLlama() simultaneously, only the first actually runs initLlama() —
//    the second awaits the same Promise instead of starting a duplicate load.

// ─── PROMPT TEMPLATES ─────────────────────────────────────────────────────────
// 5. Create a constant object called PROMPT_TEMPLATES.
//    Each entry is a function (system: string, user: string) => string.
//    Write four entries — one per model family — using these token formats:
//
//      phi3_llama3 : wrap system in <|system|>..., user in <|user|>...,
//                    end with <|assistant|> left open for the model to continue
//      mistral     : wrap the combined system + user block in [INST]...[/INST]
//      gemma       : use <start_of_turn>user and <start_of_turn>model tokens
//      chatml      : use <|im_start|>system, <|im_end|>, <|im_start|>user,
//                    <|im_end|>, <|im_start|>assistant pattern
//
// 6. Declare a constant called buildPrompt and assign it to the PROMPT_TEMPLATES
//    entry that matches your bundled model's training format.
//    Add a developer comment to update this line when switching models.

// ─── STOP TOKENS ──────────────────────────────────────────────────────────────
// 7. Declare a constant string array called STOP_TOKENS.
//    Populate it with the special tokens that signal end-of-turn for your chosen
//    template. For phi3_llama3: '<|user|>', '<|system|>', '<|end|>', '</s>'.
//    Generation halts the moment any of these appear — preventing the model
//    from continuing into a second turn and corrupting JSON output.

// ─── MODEL ASSET ──────────────────────────────────────────────────────────────
// 8. Use require() to reference your GGUF file at the relative path
//    '../assets/models/your-model.gguf'. Store it in a constant called MODEL_ASSET.
//    Add a comment instructing developers to update the filename here when
//    they swap to a different model.

// ─── resolveModelPath() ───────────────────────────────────────────────────────
// 9. Write a private async function called resolveModelPath(): Promise<string>.
//    a. Call Asset.fromModule(MODEL_ASSET) to get the Expo asset reference.
//    b. Call asset.downloadAsync() — this is idempotent and ensures the file
//       is available on disk regardless of platform.
//    c. Throw an error if asset.localUri is null or undefined.
//    d. Strip the 'file://' prefix using .replace() before returning —
//       llama.rn expects a raw filesystem path, not a URI.

// ─── initLocalLlama() ─────────────────────────────────────────────────────────
// 10. Write and export an async function called initLocalLlama(): Promise<void>.
//     a. If the context variable is already set, return immediately (already loaded).
//     b. If initPromise is already set, await it and return (load in progress).
//     c. Otherwise, assign a new Promise to initPromise.
//        Inside that Promise:
//          i.  Call resolveModelPath() to get the filesystem path.
//          ii. Call initLlama() passing a config object with these fields:
//                model        → the resolved path string
//                n_ctx        → 2048  (max tokens: prompt + response combined)
//                n_threads    → 4     (CPU threads; tune to device core count)
//                n_gpu_layers → 99    (offload all layers to Metal/Vulkan GPU)
//                use_mlock    → true  (pin weights in RAM; prevents paging)
//          iii.Assign the returned context to the module-level context variable.
//          iv. In the catch block, reset both context and initPromise to null
//              so a retry is possible if the load fails.
//     d. Return initPromise so callers can await completion.

// ─── callLocalLlama() ─────────────────────────────────────────────────────────
// 11. Write and export an async function called callLocalLlama with this signature:
//       callLocalLlama(system: string, user: string, options?: {
//         maxTokens?: number,    // default: 800
//         temperature?: number,  // default: 0.7
//         topP?: number          // default: 0.9
//       }): Promise<string>
//
//     a. Call initLocalLlama() — if already loaded this is a no-op.
//     b. Throw if context is still null after init (should not happen in practice).
//     c. Call buildPrompt(system, user) to format the full prompt string using
//        the chat template tokens selected in step 6.
//     d. Call context.completion() with:
//          prompt      → the formatted prompt
//          n_predict   → options.maxTokens ?? 800
//          temperature → options.temperature ?? 0.7
//          top_p       → options.topP ?? 0.9
//          stop        → STOP_TOKENS
//     e. Return result.text.trim().

// ─── callLocalLlamaWithHistory() ──────────────────────────────────────────────
// 12. Write and export an async function called callLocalLlamaWithHistory:
//       callLocalLlamaWithHistory(
//         system: string,
//         messages: { role: string; content: string }[],
//         maxTurnsToInclude: number = 10
//       ): Promise<string>
//
//     a. Ensure the model is loaded (same check as callLocalLlama steps a–b).
//     b. Slice messages to the last maxTurnsToInclude entries.
//        This is the single most important step for keeping multi-turn
//        conversations within the context window — never skip it.
//     c. Map each message to its formatted chat-template string.
//        Use the <|user|> token when role is 'user', <|assistant|> otherwise.
//     d. Prepend the system block and join all turns into one prompt string.
//        End the string by opening the assistant turn without closing it —
//        the model will continue generating from that point.
//     e. Call context.completion() with n_predict: 400, temperature: 0.8.
//     f. Return result.text.trim().

// ─── releaseLocalLlama() ──────────────────────────────────────────────────────
// 13. Write and export a synchronous function called releaseLocalLlama(): void.
//     Call context.release() if context is not null, then reset both
//     context and initPromise to null.
//     This is only needed when deliberately freeing memory — not called
//     during normal use.
```

---

### 5.2 `generateLessonQuiz`

**Modify in:** `frontend/lib/quizService.ts` — this function already exists. Redirect its AI call and update the prompt.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from LessonView.tsx after the student finishes reading all lesson
// sections. Generates exactly 10 quiz questions grounded in the lesson's
// own content. Returns QuizQuestion[] consumed directly by QuizRenderer.

// ─── STEP 1: REDIRECT THE AI CALL ────────────────────────────────────────────
// At the top of quizService.ts, import callLocalLlama from './llamaService'.
// Replace the body of callAnthropic() so it delegates to callLocalLlama,
// passing system and user through unchanged and returning the result.
// The function signature must stay identical — nothing that calls callAnthropic
// needs to change.

// ─── STEP 2: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Identifies the AI as an educational content creator
//   - Interpolates the student's grade and country from the function parameters
//   - Names the lesson title
//   - States the exact output requirement:
//     "Return ONLY a valid JSON array of exactly 10 question objects.
//      No markdown, no preamble, no explanation outside the JSON."

// ─── STEP 3: BUILD THE USER PROMPT ───────────────────────────────────────────
// Write a user string that:
//   - Requests exactly 10 questions with this distribution:
//       4 multiple_choice  (2 easy, 2 medium)
//       3 true_false       (2 easy, 1 hard)
//       3 fill_blank       (1 easy, 1 medium, 1 hard)
//   - Defines the JSON schema for each question type showing all required fields:
//       multiple_choice → type, difficulty, questionText, options (array of 4),
//                         correctOption (0-based index), explanation
//       true_false      → type, difficulty, questionText,
//                         correctAnswer (boolean), explanation
//       fill_blank      → type, difficulty, questionText (with ___ as blank),
//                         correctAnswer (exact string), hint, explanation
//   - Appends the lesson content truncated to 800 characters:
//       lessonContent.substring(0, 800)
//     Always truncate — sending full content risks exceeding the context window.

// ─── STEP 4: CALL THE LOCAL MODEL ────────────────────────────────────────────
// Call callLocalLlama(system, user) passing maxTokens: 1200, temperature: 0.7.
// Use 1200 tokens because 10 questions with explanations produces verbose JSON.

// ─── STEP 5: PARSE THE JSON RESPONSE ─────────────────────────────────────────
// Pass the raw string through the existing parseJsonResponse() helper to strip
// any accidental markdown fences, then parse with JSON.parse().

// ─── STEP 6: INJECT UNIQUE IDs ───────────────────────────────────────────────
// Call the existing addIds() helper on the parsed array.
// The model does not generate IDs. They are required as React keys in
// QuizRenderer and as foreign keys in LessonQuizResult stored in AsyncStorage.

// ─── STEP 7: HANDLE FAILURE ───────────────────────────────────────────────────
// Wrap steps 4–6 in a try/catch. On any error, log a console.warn and
// return getFallbackLessonQuestions(). The student must always receive a quiz —
// never let this function throw to the calling screen.
```

---

### 5.3 `generateQuarterlyExam`

**Modify in:** `frontend/lib/quizService.ts` — this function already exists. Redirect its AI call and update the prompt.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from QuarterlyExam.tsx when the student starts the end-of-quarter exam.
// Must cover ALL lessons in the quarter — not just the most recent topic.
// Returns QuizQuestion[] of length lessonCount × 5.

// ─── STEP 1: COMPUTE THE QUESTION DISTRIBUTION ───────────────────────────────
// Before building prompts, calculate:
//   totalQuestions = lessonCount * 5
//   mcCount  = Math.round(totalQuestions * 0.4)    // 40% multiple choice
//   tfCount  = Math.round(totalQuestions * 0.3)    // 30% true/false
//   fbCount  = totalQuestions - mcCount - tfCount  // remainder = fill-blank
// Use these variables in both prompts below.

// ─── STEP 2: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Names the subject, quarter number, quarter topic, grade, and country
//   - States: "Return ONLY a valid JSON array of exactly ${totalQuestions}
//     question objects. No markdown, no preamble."

// ─── STEP 3: BUILD THE USER PROMPT ───────────────────────────────────────────
// Write a user string that:
//   - States the total count and the number of lessons to cover
//   - Explicitly instructs the model to spread questions across ALL lessons —
//     not to fixate on just one topic (smaller models commonly make this mistake)
//   - Lists the computed distribution: mcCount MC, tfCount T/F, fbCount fill-blank
//   - States the difficulty spread: roughly one-third each easy, medium, hard
//   - Includes the same three JSON schemas as the lesson quiz prompt

// ─── STEP 4: CALL THE LOCAL MODEL ────────────────────────────────────────────
// Call callLocalLlama(system, user) with maxTokens: 1800, temperature: 0.7.
// Use 1800 because a 25-question exam generates substantially more JSON
// than the 10-question lesson quiz.

// ─── STEP 5: PARSE, INJECT IDs, HANDLE FAILURE ───────────────────────────────
// Same pattern as generateLessonQuiz steps 5–7.
// On failure, return getFallbackQuarterlyExamQuestions(lessonCount).
```

---

### 5.4 `generateDiagnosticQuestions`

**Modify in:** `frontend/lib/quizService.ts` — this function already exists. Redirect its AI call and update the prompt.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from DiagnosticTest.tsx the first time a student starts a subject.
// Generates 20 easy multiple-choice questions (5 per quarter) to measure
// baseline prior knowledge before any lessons are completed.
// The per-quarter scores produced here are fed into getStudyPlan() to build
// a personalised review plan.

// ─── STEP 1: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Names the subject, grade, and country
//   - Describes the purpose: baseline diagnostic, not a graded exam
//   - States: "Return ONLY a valid JSON array of exactly 20 question objects.
//     No markdown, no preamble."

// ─── STEP 2: BUILD THE USER PROMPT ───────────────────────────────────────────
// Write a user string that:
//   - Requests 20 multiple-choice questions, exactly 5 per quarter
//   - Lists all four quarter topics by interpolating the quarterTopics array:
//       Quarter 1: ${quarterTopics[0]}
//       Quarter 2: ${quarterTopics[1]}
//       Quarter 3: ${quarterTopics[2]}
//       Quarter 4: ${quarterTopics[3]}
//   - Provides the JSON schema. CRITICAL: include a "quarter" integer field (1–4)
//     in the schema. DiagnosticTest.tsx filters questions by this field to
//     compute separate q1Score, q2Score, q3Score, q4Score values. Without it
//     the study plan cannot be generated correctly.
//   - Instructs the model to keep all questions at "easy" difficulty —
//     this is prior-knowledge assessment, not a test of current mastery.

// ─── STEP 3: CALL THE LOCAL MODEL ────────────────────────────────────────────
// Call callLocalLlama(system, user) with maxTokens: 1200, temperature: 0.6.
// Use 0.6 temperature for more consistent, factually grounded questions.

// ─── STEP 4: PARSE AND ENRICH THE RESPONSE ───────────────────────────────────
// Parse the raw string using parseJsonResponse() and JSON.parse().
// Map over the parsed array and inject two fields the model does not produce:
//   id        → template literal: `diag-${Date.now()}-${index}`
//   subjectId → subjectName.toLowerCase()

// ─── STEP 5: HANDLE FAILURE ───────────────────────────────────────────────────
// On any error, return getFallbackDiagnosticQuestions(subjectName).
```

---

### 5.5 `getAIExplanation`

**Modify in:** `frontend/lib/quizService.ts` — replace the `callOllama` call with `callLocalLlama`.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from LessonView.tsx when the student taps "Explain" after a section
// is read aloud by the TTS engine. Returns 3–5 plain-prose sentences that
// re-explain the section's key idea in simpler, spoken language.
// The output feeds directly into tts.ts → expo-speech.
// It is NOT saved to AsyncStorage — it is ephemeral.

// ─── STEP 1: DEFINE A STATIC FALLBACK ────────────────────────────────────────
// Before the try block, declare a FALLBACK constant with a short, generic,
// educational sentence safe to speak aloud if the model fails entirely.

// ─── STEP 2: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Establishes the AI as a spoken tutor for a Grade ${grade} student
//   - States clearly: "Your response will be read aloud by text-to-speech"
//   - Bans ALL markdown: no bullet points, no asterisks, no headers, no numbered
//     lists, no special characters of any kind — these would be spoken literally
//   - Restricts length to exactly 3 to 5 sentences
//   - Instructs the model to write as it would speak naturally to the student,
//     not as it would write in a textbook

// ─── STEP 3: BUILD THE USER PROMPT ───────────────────────────────────────────
// Write a user string that:
//   - Wraps the sectionContent parameter in quotation marks
//   - Asks the model to explain the key idea in its own words
//   - Instructs it to begin the explanation directly — no affirmations
//     like "Sure!", "Of course!", or "Great question!" at the start

// ─── STEP 4: CALL THE LOCAL MODEL ────────────────────────────────────────────
// Call callLocalLlama(system, user) with maxTokens: 300, temperature: 0.6.
// 300 tokens is sufficient for 5 sentences.
// 0.6 temperature keeps the explanation focused and on-topic — critical
// because this text will be read aloud and must be coherent.

// ─── STEP 5: RETURN AND HANDLE FAILURE ───────────────────────────────────────
// Return the trimmed result string if it is non-empty, otherwise return FALLBACK.
// Catch any exception and return FALLBACK. Never let this throw to the UI.
```

---

### 5.6 `getAITutorResponse`

**Modify in:** `frontend/lib/quizService.ts` — replace the existing direct `fetch` call to the Anthropic API with `callLocalLlamaWithHistory`.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from AITutor.tsx on every message the student sends.
// The full conversation history is passed so the model gives contextually
// relevant follow-up replies rather than treating each message in isolation.
// Returns a plain-text string — no JSON, no markdown.
// The caller saves both the user message and this reply to AsyncStorage
// via saveChatMessage(), making the conversation persist across sessions.

// ─── STEP 1: DEFINE A STATIC FALLBACK ────────────────────────────────────────
// Declare a FALLBACK constant with a friendly, generic tutor message that
// encourages the student to rephrase or try again.

// ─── STEP 2: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Interpolates the lessonTitle parameter to bind the tutor to this lesson
//   - Defines the persona: friendly, expert, secondary school tutor
//   - Constrains reply length to 2–4 sentences
//   - Encourages including a practical real-world example when helpful
//   - Bans markdown and bullet points — plain prose only
//   - Instructs the model to gently redirect off-topic questions back to the
//     lesson subject

// ─── STEP 3: CALL callLocalLlamaWithHistory ───────────────────────────────────
// Replace the existing fetch() call to the Anthropic API with:
//   callLocalLlamaWithHistory(system, messages, 10)
// The third argument caps conversation history at the last 10 turns.
// Older messages are silently dropped to prevent context window overflow.

// ─── STEP 4: RETURN AND HANDLE FAILURE ───────────────────────────────────────
// Return the response if non-empty, otherwise return FALLBACK.
// Catch any exception and return FALLBACK.
```

---

### 5.7 `getStudyPlan`

**Modify in:** `frontend/lib/quizService.ts` — this function already exists. Redirect its AI call and tighten the prompt.

```typescript
// ─── PURPOSE ──────────────────────────────────────────────────────────────────
// Called from DiagnosticTest.tsx immediately after per-quarter scores are computed.
// Returns a StudyPlan object — four quarter entries each with a review priority
// flag and 5 personalised study tips.
// The caller saves this via saveStudyPlan(subjectId, plan).
// SubjectView.tsx reads and renders it as a personalised study guide.

// ─── STEP 1: BUILD THE SYSTEM PROMPT ─────────────────────────────────────────
// Write a system string that:
//   - Defines the AI as a personalised study plan creator
//   - States: "Return ONLY a valid JSON object with exactly 4 keys:
//     quarter1, quarter2, quarter3, quarter4. No markdown, no explanation."

// ─── STEP 2: BUILD THE USER PROMPT ───────────────────────────────────────────
// Write a user string that:
//   - Defines the three review priority thresholds explicitly so the model
//     applies them consistently regardless of which GGUF model is running:
//       Score 0–50   → is_need_review: true  (High Priority)
//       Score 51–75  → is_need_review: true  (Moderate Priority)
//       Score 76–100 → is_need_review: false (Low Priority)
//   - Interpolates all eight function parameters:
//       Quarter 1 Score: ${q1Score} | Lessons: ${q1Lessons.join(', ')}
//       ... (repeat for all four quarters)
//   - States that how_to_get_high_scores must contain EXACTLY 5 numbered tips.
//     This is non-negotiable — SubjectView.tsx renders them as a fixed list
//     and will display incorrectly if fewer or more tips are returned.
//   - Provides the full expected JSON structure showing all field names and
//     value types for all four quarter objects so the model has a concrete
//     schema to follow

// ─── STEP 3: CALL THE LOCAL MODEL ────────────────────────────────────────────
// Call callLocalLlama(system, user) with maxTokens: 600, temperature: 0.5.
// Use 0.5 temperature — the lowest of all AI calls — because the thresholds,
// tip count, and JSON structure must be followed precisely and deterministically.

// ─── STEP 4: PARSE AND RETURN ────────────────────────────────────────────────
// Pass the raw string through parseJsonResponse() then JSON.parse().
// Cast the result to StudyPlan and return it.

// ─── STEP 5: HANDLE FAILURE ───────────────────────────────────────────────────
// On any error, return null. The caller (DiagnosticTest.tsx) already handles
// null gracefully by skipping study plan display rather than crashing.
```

---

## 6. Mapping AI Output → Local Database

All AI output is ephemeral — generated fresh on each call. Persistence is the exclusive responsibility of `store.ts` using `AsyncStorage`. The table below maps every AI function to its corresponding storage call and the TypeScript type written.

### AI Output → AsyncStorage Key Mapping

| AI Function | Storage Function | AsyncStorage Key | Type Written |
|---|---|---|---|
| `generateLessonQuiz` | `saveLessonQuizResult()` | `pocketclass_lesson_quiz_results` | `LessonQuizResult[]` |
| `generateQuarterlyExam` | `saveQuarterlyExamResult()` | `pocketclass_quarterly_exam_results` | `QuarterlyExamResult[]` |
| `generateDiagnosticQuestions` | `saveDiagnosticResult()` | `pocketclass_diagnostic_results` | `DiagnosticResult[]` |
| `getAIExplanation` | *(not persisted — TTS only)* | — | — |
| `getAITutorResponse` | `saveChatMessage()` (×2: user + tutor) | `pocketclass_chat_history` | `ChatMessage[]` |
| `getStudyPlan` | `saveStudyPlan()` | `pocketclass_study_plans` | `Record<string, StudyPlan>` |

### How Quiz Results Are Written

When the student finishes a lesson quiz, `LessonView.tsx` computes the score and calls `saveLessonQuizResult`. The AI generated the questions but not the result — the result object is assembled from the student's actual answers:

```
[AI generates QuizQuestion[]]
       ↓
[Student answers each question in QuizRenderer]
       ↓
[LessonView.tsx computes score, easyScore, mediumScore, hardScore]
       ↓
saveLessonQuizResult({
  id: generateId(),
  lessonId: lesson.id,           ← from Lesson object
  userId: profile.id,            ← from Profile in AsyncStorage
  score: 80,                     ← (correct / total) * 100
  totalQuestions: 10,
  easyScore: 100,
  mediumScore: 75,
  hardScore: 60,
  completedAt: new Date().toISOString(),
  attemptNumber: previousAttempts + 1,
})
       ↓
[completeLesson() → recomputeMastery() → saveSubjectProgress()]
```

### How Mastery Score Is Derived from AI-Driven Data

The `recomputeMastery(subjectId)` function in `store.ts` aggregates all AI-assessment results:

```
masteryScore = weighted average of:
  ├── latestDiagnosticResult.overallScore  × 0.20
  ├── average of latest LessonQuizResult   × 0.40
  └── average of latest QuarterlyExamResult × 0.40
```

### Study Plan Persistence

```
[AI generates StudyPlan JSON]
  → saveStudyPlan(subjectId, studyPlan)
  → AsyncStorage key 'pocketclass_study_plans' stores all subjects as one object

[SubjectView.tsx mounts]
  → getStudyPlanForSubject(subjectId)
  → Renders quarter review badges and how_to_get_high_scores tips
```

### Chat Message Persistence

```
[User sends message]
  → saveChatMessage({ id, lessonId, role: 'user', content, timestamp })

[AI generates response]
  → saveChatMessage({ id, lessonId, role: 'tutor', content, timestamp })

[AITutor.tsx mounts / lessonId changes]
  → getChatHistory(lessonId) restores full thread from AsyncStorage
```

---

## 7. Mapping Frontend Inputs → AI

### 7.1 Lesson Quiz — `LessonView.tsx` → `generateLessonQuiz`

```
USER ACTION: Taps "Take Quiz" after reading all lesson sections.

LessonView.tsx collects:
  lesson.title             → lessonTitle
  lesson.sections[].content joined → lessonContent (truncated to 800 chars in prompt)
  profile.grade            → grade
  profile.country          → country

CALLS: generateLessonQuiz(lessonTitle, lessonContent, grade, country)

AI OUTPUT: QuizQuestion[] (10 questions)
  → Passed to QuizRenderer
  → On completion → saveLessonQuizResult()
```

### 7.2 Quarterly Exam — `QuarterlyExam.tsx` → `generateQuarterlyExam`

```
USER ACTION: Taps "Start Quarter Exam" (only visible after all 5 lessons completed).

QuarterlyExam.tsx collects:
  subject.name                          → subjectName
  lesson.quarter                        → quarter
  QUARTER_TOPICS[subjectId][quarter-1]  → quarterTopic
  profile.grade                         → grade
  profile.country                       → country
  5 (constant)                          → lessonCount

CALLS: generateQuarterlyExam(subjectName, quarter, quarterTopic, grade, country, lessonCount)

AI OUTPUT: QuizQuestion[] (25 questions)
  → On completion → saveQuarterlyExamResult()
```

### 7.3 Diagnostic Test — `DiagnosticTest.tsx` → `generateDiagnosticQuestions` + `getStudyPlan`

```
USER ACTION: Taps "Start Diagnostic" on a new subject.

DiagnosticTest.tsx collects:
  subject.name              → subjectName
  QUARTER_TOPICS[subjectId] → quarterTopics (array of 4 strings)
  profile.grade             → grade
  profile.country           → country

CALL 1: generateDiagnosticQuestions(subjectName, quarterTopics, grade, country)
  AI OUTPUT: DiagnosticQuestion[] (20 questions)
  → On completion → saveDiagnosticResult()
  → DiagnosticTest computes q1Score–q4Score from answers

CALL 2: getStudyPlan(q1Score, q1LessonTitles, q2Score, ...)
  (Lesson titles come from getLessonsBySubject filtered per quarter)
  AI OUTPUT: StudyPlan JSON → saveStudyPlan(subjectId, plan)
```

### 7.4 AI Section Explanation — `LessonView.tsx` → `getAIExplanation`

```
USER ACTION: Taps "Explain" button after a section is read aloud.

LessonView.tsx collects:
  currentSection.content    → sectionContent
  profile.grade             → grade

CALLS: getAIExplanation(sectionContent, grade)

AI OUTPUT: Plain string (3–5 sentences, no markdown)
  → Passed to tts.ts → expo-speech reads it aloud
  → NOT saved to AsyncStorage
```

### 7.5 AI Tutor Chat — `AITutor.tsx` → `getAITutorResponse`

```
USER ACTION: Types and sends a message in the AI Tutor overlay.

AITutor.tsx collects:
  lessonTitle (prop from LessonView)  → passed as-is
  messages (component state)          → full ChatMessage[] for this lesson

On each send:
  1. User message appended to local state immediately (optimistic update)
  2. saveChatMessage(userMsg) persists the user turn
  3. History mapped to { role, content }[] and passed to:

CALLS: getAITutorResponse(lessonTitle, messages)

AI OUTPUT: Plain string (2–4 sentences)
  → Appended to messages state
  → saveChatMessage(tutorMsg) persists the reply
  → getChatHistory(lessonId) restores full thread on next open
```

### 7.6 Input → AI Summary Table

| Screen | User Action | Inputs to AI | AI Function Called |
|---|---|---|---|
| `LessonView.tsx` | Tap "Take Quiz" | lessonTitle, lessonContent, grade, country | `generateLessonQuiz` |
| `QuarterlyExam.tsx` | Tap "Start Exam" | subjectName, quarter, quarterTopic, grade, country | `generateQuarterlyExam` |
| `DiagnosticTest.tsx` | Tap "Start Diagnostic" | subjectName, quarterTopics[], grade, country | `generateDiagnosticQuestions` |
| `DiagnosticTest.tsx` | Complete diagnostic | q1–q4 scores, lesson title arrays | `getStudyPlan` |
| `LessonView.tsx` | Tap "Explain" on section | sectionContent, grade | `getAIExplanation` |
| `AITutor.tsx` | Send chat message | lessonTitle, full message history | `getAITutorResponse` |

---

## 8. Updating PocketClass_AIFeatures for Local AI Testing

`PocketClass_AIFeatures` is a standalone Node.js CLI sandbox — students never run it. Its sole purpose is letting developers **test and validate AI prompts on a desktop machine** before deploying them to the frontend app. Currently it connects to a local Ollama server via LangChain. This section updates it to connect to a local `llama.cpp` HTTP server instead, so you test against the exact same GGUF model that ships in the app.

### Why Keep This Directory

The utilities `safeInvoke.ts` and `aiRetryHandler.ts` implement retry-with-JSON-validation logic that the frontend currently lacks. Keeping this sandbox active means you can catch bad model outputs (malformed JSON, wrong field names, truncated arrays) on your desktop in seconds instead of discovering them on a student's device.

### Step 1 — Run a Local llama.cpp Server

Download the `llama-server` binary from the llama.cpp GitHub releases page. It is the HTTP server component of llama.cpp and loads the same `.gguf` files as `llama.rn`. Start it pointing at your model file. By default it listens on port 8080 and exposes a `/completion` endpoint that accepts plain JSON — no LangChain required.

### Step 2 — Rewrite `model/ModelClass.ts`

Replace the entire file. Remove all LangChain imports. Implement a plain-fetch client:

```typescript
// ─── NEW ModelClass.ts ────────────────────────────────────────────────────────

// ─── SERVER URL ───────────────────────────────────────────────────────────────
// Declare a private static baseUrl.
// Default to 'http://localhost:8080'.
// Read from process.env.LLAMA_URL if present so developers can override
// without editing source (useful for CI or remote test servers).

// ─── PROMPT TEMPLATES ─────────────────────────────────────────────────────────
// Copy the PROMPT_TEMPLATES object and buildPrompt constant verbatim from
// the frontend's llamaService.ts into this file.
// The templates must be identical — testing with a different format than
// the app uses will produce misleading results.

// ─── STOP TOKENS ──────────────────────────────────────────────────────────────
// Copy the STOP_TOKENS array from llamaService.ts verbatim.
// Same reason as above — tests must mirror production conditions exactly.

// ─── TEMPERATURE ──────────────────────────────────────────────────────────────
// Declare a private static temperature variable, initialised to 0.5.
// Keep the existing setTemperature() and getTemperature() static methods
// so the service files that call them do not need to change.

// ─── invoke() ─────────────────────────────────────────────────────────────────
// Write a public static async method called invoke(system: string, user: string)
// that returns Promise<string>. It should:
//   1. Call buildPrompt(system, user) to format the prompt string.
//   2. POST to ${baseUrl}/completion with a JSON body containing:
//        prompt      → the formatted prompt string
//        n_predict   → 1000
//        temperature → the current temperature value
//        stop        → STOP_TOKENS
//        stream      → false  (required — streaming response cannot be parsed as JSON)
//   3. Parse the response JSON. The llama.cpp server returns { content: "...", ... }
//      Return the content field as a string.

// ─── getInstance() SHIM (optional) ────────────────────────────────────────────
// The existing service files call ModelClass.getInstance() and pipe the result
// through LangChain chains: PromptTemplates.something.pipe(model).invoke({...})
// You have two options:
//
//   OPTION A — Refactor each service (recommended):
//     Remove LangChain chain calls. Build system and user strings manually
//     using template literals and call ModelClass.invoke(system, user) directly.
//     This matches how the frontend is structured and is cleaner long-term.
//
//   OPTION B — Compatibility shim (faster):
//     Keep getInstance() and make it return an object with an invoke() method
//     that wraps ModelClass.invoke(). This preserves all existing service code
//     with zero changes to the service files themselves.
```

### Step 3 — Update Each Service File

For each file in `PocketClass_AIFeatures/services/`, replace the LangChain chain invocation:

```typescript
// ─── IN EACH SERVICE FILE ─────────────────────────────────────────────────────

// FIND this pattern in each service:
//   const chain = PromptTemplates.someName.pipe(model);
//   const raw = await chain.invoke({ variable1: ..., variable2: ... });
//   return someParser(raw.content);

// REPLACE with (if choosing Option A from Step 2):
//   1. Look at the PromptTemplate's template string in promptTemplates.ts.
//      It contains the full prompt with {variable} placeholders.
//   2. Build the system and user strings manually using template literals,
//      substituting the same variables the chain.invoke() call was passing.
//   3. Call: const raw = await ModelClass.invoke(system, user);
//   4. Pass raw to the same parser as before (jsonParser, jsonToString, etc.)

// NOTE on plain-text services (AITutorService, AIExplanationService):
//   These return plain strings, not JSON. Their update is the simplest —
//   just replace chain.invoke() with ModelClass.invoke() and remove the
//   LangChain response unwrapping.

// NOTE on JSON services (LessonQuizService, QuarterlyExamService, etc.):
//   Keep the existing jsonParser() and safeInvoke() / aiRetryHandler() calls.
//   These are the most valuable parts of the sandbox — they catch malformed
//   model output before it reaches the frontend.
```

### Step 4 — Update `main.ts`

```typescript
// ─── UPDATE THE TEST RUNNER ───────────────────────────────────────────────────

// 1. Replace the startup message. Change:
//      "Model: gemma2:2b via Ollama"
//      "Make sure Ollama is running: ollama serve"
//    To:
//      "Model: [your GGUF filename]"
//      "Make sure llama-server is running:"
//      "  llama-server -m /path/to/your-model.gguf"

// 2. Add a line that prints ModelClass.baseUrl at startup so the developer
//    can confirm the test is hitting the right endpoint before any AI calls run.

// 3. Uncomment and run tests in this order (simplest output first):
//      1. testAIExplanation   — plain text, no JSON, easiest to validate
//      2. testAITutor         — plain text with conversation history
//      3. testStudyPlan       — compact JSON object (4 keys)
//      4. testDiagnosticQuiz  — JSON array, 5 questions per quarter call
//      5. testLessonQuiz      — JSON array of 10 questions with explanations
//      6. testLessonMaterial  — most complex JSON structure

// 4. For each test, verify these conditions manually before porting to frontend:
//      ✓ Output is not empty or whitespace-only
//      ✓ JSON services parse without throwing (jsonParser handles it cleanly)
//      ✓ All required schema fields are present (type, questionText, correctOption, etc.)
//      ✓ No markdown characters in plain-text outputs (no *, #, -, or backticks)
//      ✓ Difficulty values are exactly "easy", "medium", or "hard" — not capitalised
//      ✓ correctOption for multiple_choice is a number, not a string
//      ✓ how_to_get_high_scores in study plans contains exactly 5 numbered items
```

### Step 5 — Port Validated Improvements Back to the Frontend

After confirming a prompt produces correct output in the sandbox, copy the refined prompt strings into the corresponding function in `frontend/lib/quizService.ts`. This prompt-test-port cycle is the core purpose of the sandbox.

Also port `safeInvoke.ts` into the frontend:

```typescript
// ─── PORTING safeInvoke TO THE FRONTEND ──────────────────────────────────────

// 1. Copy PocketClass_AIFeatures/utils/safeInvoke.ts to frontend/lib/safeInvoke.ts.

// 2. Remove the LangChain-specific response unwrapping from the copied file.
//    In the sandbox version, the invokeFn returns a LangChain response object
//    and the function reads response.content. In the frontend version,
//    callLocalLlama already returns a plain string — no unwrapping needed.

// 3. In each function in quizService.ts that currently uses a bare try/catch,
//    replace the catch-and-fallback pattern with safeInvoke:
//
//    BEFORE (current frontend pattern):
//      try {
//        const raw = await callLocalLlama(system, user, { ... });
//        return parseAndValidate(raw);
//      } catch {
//        return getFallback();
//      }
//
//    AFTER (with safeInvoke):
//      return safeInvoke<QuizQuestion[]>(
//        () => callLocalLlama(system, user, { ... }).then(parseAndValidate),
//        (parsed) => Array.isArray(parsed) && parsed.length > 0,
//        3   // retry up to 3 times before giving up
//      ).catch(() => getFallback());
//
//    This gives each AI call three automatic retries on malformed JSON before
//    falling back to static data — making on-device AI significantly more
//    resilient to occasional bad model outputs without any UI impact.
```

### Updated AIFeatures Directory After Changes

```
PocketClass_AIFeatures/
├── model/
│   └── ModelClass.ts           ← REWRITE: plain fetch to llama.cpp server
├── services/
│   ├── LessonQuizService.ts    ← UPDATE: remove LangChain chains
│   ├── QuarterlyExamService.ts ← UPDATE: remove LangChain chains
│   ├── DiagnosticQuiz.ts       ← UPDATE: remove LangChain chains
│   ├── StudyPlanService.ts     ← UPDATE: remove LangChain chains
│   ├── AITutorService.ts       ← UPDATE: remove LangChain chains
│   ├── AIExplanationService.ts ← UPDATE: remove LangChain chains
│   └── LessonMaterialService.ts← UPDATE: remove LangChain chains
├── utils/
│   ├── safeInvoke.ts           ← UNCHANGED — also port a copy to frontend/lib/
│   ├── aiRetryHandler.ts       ← UNCHANGED
│   ├── jsonParser.ts           ← UNCHANGED — more robust than frontend's version
│   └── jsonToString.ts         ← UNCHANGED
├── templates/
│   └── promptTemplates.ts      ← UNCHANGED — reference for prompt refinement
├── main.ts                     ← UPDATE: new server note, correct test order
└── package.json                ← UPDATE: remove @langchain/* dependencies,
                                            keep zod, tsx, uuid
```

---

*End of PocketClass AI Integration Guide.*
*For questions about the codebase, refer to `frontend/lib/quizService.ts` (AI services), `frontend/lib/store.ts` (persistence), `frontend/lib/types.ts` (data shapes), and `PocketClass_AIFeatures/` (desktop testing sandbox).*
