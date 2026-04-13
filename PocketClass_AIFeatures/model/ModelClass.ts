import { getLlama, LlamaModel, LlamaContext, LlamaChatSession, Llama } from "node-llama-cpp";

export class ModelClass {
    private static instance: ModelClass | null = null;

    private temperature = 0.5;
    private llama: Llama | null = null;
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private session: LlamaChatSession | null = null;

    private constructor() {}

    private initPromise: Promise<void> | null = null;

    private async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            if (!this.model) {
                this.llama = await getLlama();
                
                this.model = await this.llama.loadModel({
                    modelPath: "./model/phi-3.5-mini-instruct.Q4_K_M.gguf",
                    gpuLayers: 0,
                    // ADD THIS LINE: It tells the engine how to handle the specific Phi-3 vocabulary
                    vocabularyType: "auto"
                });

                this.context = await this.model.createContext({
                    contextSize: 4096,
                });

                this.session = new LlamaChatSession({
                    contextSequence: this.context.getSequence(),
                    // Phi-3 fine-tunes often need a specific "System Prompt" wrapper 
                    // to avoid tokenizer errors
                    systemPrompt: "You are a helpful assistant." 
                });
            }
        })();

        return this.initPromise;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new ModelClass();
        }
        return this.instance;
    }

    static setTemperature(t: number) {
        this.getInstance().temperature = t;
    }

    static async invoke(prompt: string, temperature?: number) {
        const instance = this.getInstance();
        await instance.init();

        if (!instance.session) {
            throw new Error("Session failed to initialize.");
        }

        console.log(`\nAsking AI: "${prompt}"\n`);
        console.log("--- AI Response ---");

        // The AI will now print word-by-word!
        const finalResponse = await instance.session.prompt(prompt, {
            temperature: temperature ?? instance.temperature,
            maxTokens: 400,
            onTextChunk: (text) => {(process as any).stdout.write(text);}
        });
        
        console.log("\n-------------------\n");
        return finalResponse;
    }
}




// // You must install this via: npm install llama.rn
// import { initLlama, LlamaContext } from 'llama.rn';

// export class ModelClass {
//     private static instance: ModelClass | null = null;

//     private temperature = 0.5;
    
//     // llama.rn combines the model, session, and engine into a single "Context"
//     private context: LlamaContext | null = null;

//     private constructor() {}

//     private async init() {
//         if (!this.context) {
//             // Note: The path below MUST be an absolute path on the phone's file system.
//             // You cannot use relative paths like "./model/" on mobile.
//             const modelFilePath = "./model/poc"; 

//             this.context = await initLlama({
//                 model: modelFilePath,
//                 n_ctx: 4096,       // Context window size
//                 n_gpu_layers: 0,   // 0 = CPU only. (Some iPhones support >0 for Metal GPU)
//             });
//         }
//     }

//     static getInstance() {
//         if (!this.instance) {
//             this.instance = new ModelClass();
//         }
//         return this.instance;
//     }

//     static setTemperature(t: number) {
//         this.getInstance().temperature = t;
//     }

//     static async invoke(prompt: string, temperature?: number) {
//         const instance = this.getInstance();

//         await instance.init();

//         if (!instance.context) {
//             throw new Error("Session failed to initialize.");
//         }

//         // llama.rn uses .completion() instead of .prompt()
//         const response = await instance.context.completion({
//             prompt: prompt,
//             n_predict: 400, // This is what llama.rn calls maxTokens
//             temperature: temperature ?? instance.temperature,
//         });

//         // The text is nested inside the response object
//         return response.text; 
//     }
// }