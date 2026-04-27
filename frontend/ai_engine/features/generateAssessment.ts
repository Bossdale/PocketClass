import { ModelClass } from '../model/ModelClass';
import { singleQuestionPromptTemplate } from '../templates/promptTemplates_testing';
import { AssessmentService } from '../services/AssessmentService';

async function generateSingleQuestion(concept: any, itemNumber: number) {
    // 1. Prepare your variables (Your logic here was perfect)
    const templates = concept.question_generation.templates;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const variableKey = Object.keys(concept.question_generation.variables)[0]; 
    const variablesArray = concept.question_generation.variables[variableKey];
    const randomVariable = variablesArray[Math.floor(Math.random() * variablesArray.length)];
    const baseQuestion = randomTemplate.replace(`{${variableKey}}`, randomVariable);

    const prompt = singleQuestionPromptTemplate
        .replace('{concept_name}', concept.concept_name)
        .replace('{base_question}', baseQuestion);

    try {
        // 2. Direct Fetch Call (Bypasses the library bug)
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma:2b",
                prompt: prompt,
                stream: false, 
                format: "json" 
            })
        });

        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        
        const data = await response.json();
        const aiOutput = JSON.parse(data.response);

        // 3. Shuffling (Your logic remains the same)
        const rawOptions = [concept.answer, ...concept.distractors];
        const shuffledOptions = rawOptions.sort(() => 0.5 - Math.random());

        return {
            item_number: itemNumber,
            concept_id: concept.concept_id,
            question: aiOutput.paraphrased_question,
            options: shuffledOptions,
            correct_answer: concept.answer,
            rationale: concept.rationale,
            difficulty: concept.difficulty,
            blooms_taxonomy: concept.metadata.blooms_taxonomy
        };

    } catch (error) {
        console.error(`Error generating item ${itemNumber}:`, error);
        return null; 
    }
}

export async function* generateAssessmentStream(type: 'quiz' | 'quarterly' | 'diagnostic', targetLessonId?: string) {
    const service = new AssessmentService();
    let extractedConcepts: any[] = [];

    switch (type) {
        case 'quiz':
            if (!targetLessonId) throw new Error("Lesson ID required");
            extractedConcepts = service.getQuizData(targetLessonId);
            break;
        case 'quarterly':
            extractedConcepts = service.getQuarterlyExamData();
            break;
        case 'diagnostic':
            extractedConcepts = service.getDiagnosticData('Q1'); 
            break;
    }

    for (let i = 0; i < extractedConcepts.length; i++) {
        const generatedQuestion = await generateSingleQuestion(extractedConcepts[i], i + 1);
        yield generatedQuestion; 
    }
}