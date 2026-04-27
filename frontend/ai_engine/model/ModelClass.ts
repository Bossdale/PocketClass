import { ChatOllama } from '@langchain/ollama'

export class ModelClass {
    private static instance: ModelClass | null = null;
    private temperature : number;
    private model: ChatOllama;

    private constructor(temperature: number){
        this.temperature = temperature
        this.model = new ChatOllama({
            model: "gemma:2b", 
            temperature: this.temperature,
            baseUrl: "http://localhost:11434",
            streaming: false,
        })
    }

    public static getInstance(): ChatOllama {
        if (this.instance === null) {
            this.instance = new ModelClass(0.5);
        }
        return this.instance.model;
    }

    public static setTemperature(temp: number) {
        if (this.instance) {
            this.instance.temperature = temp;
            this.instance.model = new ChatOllama({ 
                model: "gemma:2b", 
                temperature: temp,
                baseUrl: "http://localhost:11434" 
            });
        } else {
            this.instance = new ModelClass(temp);
        }
    }

    public static getTemperature(): number | null {
        return this.instance ? this.instance.temperature : null;
    }
}