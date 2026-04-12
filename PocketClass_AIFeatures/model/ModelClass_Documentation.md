# ModelClass Documentation

**File:** `ModelClass.ts`  
**Purpose:** Loads and runs a local AI language model (LLM) on-device using a single, reusable instance.

---

## Libraries Used

### `node-llama-cpp`

```ts
import { getLlama, LlamaModel, LlamaContext, LlamaChatSession, Llama } from "node-llama-cpp";
```

This is the core library that makes everything work. Here's what each import does:

| Import | What it does |
|---|---|
| `getLlama` | Bootstraps the Llama engine — think of it as "starting up" the AI runtime |
| `Llama` | The type for the engine instance returned by `getLlama()` |
| `LlamaModel` | Represents the actual AI model file loaded into memory (the `.gguf` file) |
| `LlamaContext` | A context window — this is the memory buffer the model uses to read and generate text |
| `LlamaChatSession` | A chat session built on top of the context; manages conversation history and handles prompting |

**Why `node-llama-cpp`?**  
It is a Node.js binding for `llama.cpp`, which is a highly optimized C++ runtime for running local LLMs. This means the AI runs **entirely on your machine** — no internet, no API keys, no cloud costs.

---

## The Model File

```ts
modelPath: "./model/phi-3-mini-4k-instruct.F16.gguf"
```

The model being used is **Phi-3 Mini**, a small but capable language model made by Microsoft. The `.gguf` format is a standard packaging format for quantized local models. `F16` means it uses 16-bit floating point precision — a balance between speed and quality.

---

## Why the Code Is Structured This Way

### Singleton Pattern

```ts
private static instance: ModelClass | null = null;
private constructor() {}

static getInstance() {
    if (!this.instance) {
        this.instance = new ModelClass();
    }
    return this.instance;
}
```

The class uses a **Singleton design pattern**. This means only **one instance** of `ModelClass` can ever exist at a time.

**Why?** Loading a language model is expensive — it takes several seconds and consumes a significant chunk of RAM. If we allowed multiple instances, every part of the app that needs the AI would reload the model from scratch each time, wasting memory and causing slowdowns. By using a singleton, the model loads **once** and stays in memory for the entire app lifecycle.

The `private constructor()` prevents anyone from doing `new ModelClass()` directly, forcing all access to go through `getInstance()`.

---

### Lazy Initialization

```ts
private async init() {
    if (!this.model) {
        this.llama = await getLlama();
        this.model = await this.llama.loadModel({ ... });
        this.context = await this.model.createContext({ ... });
        this.session = new LlamaChatSession({ ... });
    }
}
```

The model is **not loaded when the class is first created** — it only loads when `init()` is called for the first time (which happens inside `invoke()`). The `if (!this.model)` guard ensures this setup only runs **once**, even if `invoke()` is called many times.

**Why?** This is called lazy initialization — we delay the expensive work until it's actually needed. It avoids slowing down app startup if the AI isn't immediately required.

---

### The Initialization Chain

```ts
this.llama   = await getLlama();
this.model   = await this.llama.loadModel({ modelPath: "...", gpuLayers: 0 });
this.context = await this.model.createContext({ contextSize: 4096 });
this.session = new LlamaChatSession({ contextSequence: this.context.getSequence() });
```

Each step depends on the previous one — this is intentional:

1. **`getLlama()`** — Starts the C++ Llama engine.
2. **`loadModel()`** — Loads the `.gguf` model file into memory. `gpuLayers: 0` means the CPU handles all computation (no GPU needed).
3. **`createContext()`** — Allocates a context window. `contextSize: 4096` means the model can "remember" up to 4096 tokens (roughly ~3000 words) at a time.
4. **`LlamaChatSession`** — Wraps the context to enable back-and-forth conversation, keeping track of chat history automatically.

---

### The `invoke()` Method

```ts
static async invoke(prompt: string, temperature?: number) {
    const instance = this.getInstance();
    await instance.init();

    const finalResponse = await instance.session.prompt(prompt, {
        temperature: temperature ?? instance.temperature,
        maxTokens: 400,
        onTextChunk: (text) => { (process as any).stdout.write(text); }
    });

    return finalResponse;
}
```

This is the main method your app calls to talk to the AI. Key things to note:

- **`temperature`** — Controls how creative/random the AI's response is. `0.0` = very predictable, `1.0` = very random. Default is `0.5` (balanced).
- **`maxTokens: 400`** — Caps the response length to avoid runaway outputs.
- **`onTextChunk`** — This is a streaming callback. Instead of waiting for the full response, it prints each word/token to the console **as it is generated** in real time, like watching someone type.

---

### `setTemperature()`

```ts
static setTemperature(t: number) {
    this.getInstance().temperature = t;
}
```

A simple utility to change the AI's creativity level at runtime without re-invoking the model.

---

## The Commented-Out Section (`llama.rn`)

At the bottom of the file is an alternative implementation using `llama.rn` — a library designed for **React Native (mobile apps)** instead of Node.js.

The structure is nearly identical by design, because the same singleton and lazy-init patterns apply. The key differences are:

| | `node-llama-cpp` (current) | `llama.rn` (mobile alternative) |
|---|---|---|
| **Platform** | Node.js (desktop/server) | React Native (iOS/Android) |
| **Engine init** | `getLlama()` + `loadModel()` | Single `initLlama()` call |
| **Prompting** | `session.prompt()` | `context.completion()` |
| **Model path** | Relative (`./model/...`) | Must be absolute device path |
| **Streaming** | `onTextChunk` callback | Not shown (not supported the same way) |

This was kept as a reference in case the project needs to be ported to mobile in the future.

---

## Summary

```
ModelClass (Singleton)
│
├── getInstance()       → always returns the same object
├── init()              → loads the model once, lazily
├── invoke(prompt)      → sends a prompt, streams + returns the response
└── setTemperature(t)   → adjusts AI creativity at runtime
```

The design prioritizes **efficiency** (load once, reuse forever) and **simplicity** (one static method to call the AI from anywhere in the codebase).
