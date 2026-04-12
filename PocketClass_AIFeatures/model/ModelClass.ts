import { getLlama, LlamaModel, LlamaContext, LlamaChatSession, Llama } from "node-llama-cpp";

export class ModelClass {
    private static instance: ModelClass | null = null;

    private temperature = 0.5;
    private llama: Llama | null = null;
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private session: LlamaChatSession | null = null;

    private constructor() {}

    private async init() {
        if (!this.model) {
            this.llama = await getLlama();
            this.model = await this.llama.loadModel({
                modelPath: "./phi-3-mini-4k-instruct.F16.gguf",
            });

            this.context = await this.model.createContext({
                contextSize: 4096,
            });

            this.session = new LlamaChatSession({
                contextSequence: this.context.getSequence()
            });
        }
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

        return await instance.session.prompt(prompt, {
            temperature: temperature ?? instance.temperature,
            maxTokens: 400,
        });
    }
}