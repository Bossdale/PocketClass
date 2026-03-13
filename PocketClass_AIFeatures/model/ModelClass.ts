import { ChatOllama } from '@langchain/ollama'
declare const process: any;

export class ModelClass {
    private static instance: ModelClass | null = null;
    private temperature: number;
    private model: ChatOllama;

    // TODO: Replace the fallback IP with your Mac's actual local Wi-Fi IP address.
    // Expo will prioritize the .env variable if you set one up.
    // If you used the bypass method:
    // private static baseUrl = "http://192.168.77.78:11434";
    // private static baseUrl = "http://localhost:11434";
    private static baseUrl = 
  typeof process !== 'undefined' && process.env?.OLLAMA_URL 
    ? process.env.OLLAMA_URL 
    : "http://192.168.77.78:11434";

    private constructor(temperature: number){
        this.temperature = temperature;
        this.model = new ChatOllama({
            baseUrl: ModelClass.baseUrl,
            model: "gemma2:2b", 
            temperature: this.temperature
        });
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
                baseUrl: ModelClass.baseUrl,
                model: "gemma2:2b", 
                temperature: temp 
            });
        } else {
            this.instance = new ModelClass(temp);
        }
    }

    public static getTemperature(): number | null {
        return this.instance ? this.instance.temperature : null;
    }
}