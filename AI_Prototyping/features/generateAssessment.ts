// import { ModelClass } from '../model/ModelClass';
// import { assessmentPromptTemplate } from '../templates/promptTemplates_testing';
// import { AssessmentService } from '../services/AssessmentService';

// export async function generateAssessment(type: 'quiz' | 'quarterly' | 'diagnostic', targetLessonId?: string) {
//     const service = new AssessmentService();
//     let extractedData;
//     let itemCount = 0;

//     // 1. Extract the exact data needed based on rules
//     switch (type) {
//         case 'quiz':
//             if (!targetLessonId) throw new Error("Lesson ID required for quizzes");
//             extractedData = service.getQuizData(targetLessonId);
//             itemCount = 10;
//             break;
//         case 'quarterly':
//             extractedData = service.getQuarterlyExamData();
//             itemCount = 40;
//             break;
//         case 'diagnostic':
//             extractedData = service.getDiagnosticData();
//             itemCount = 10;
//             break;
//     }

//     // 2. Format the prompt
//     let prompt = assessmentPromptTemplate
//         .replace(/{assessment_type}/g, type)
//         .replace(/{item_count}/g, itemCount.toString())
//         .replace('{curriculum_data}', JSON.stringify(extractedData, null, 2));

//     // 3. Call the AI Model
//     // Grab the ChatOllama instance from your Singleton
//     const model = ModelClass.getInstance(); 
    
//     try {
//         console.log(`Generating ${type} assessment (${itemCount} items) using gemma:2b...`);
        
//         // LangChain uses .invoke() to send the prompt
//         const aiMessage = await model.invoke(prompt); 
        
//         // Extract the raw string from the AIMessage object
//         const responseText = aiMessage.content as string;
        
//         // 4. Safely clean and parse the JSON
//         // Local LLMs often wrap output in markdown. We strip that out before parsing.
//         // (Alternatively, you can pass responseText to your utils/jsonParser.ts if you have logic there)
//         const jsonMatch = responseText.match(/\{[\s\S]*\}/);

//         if (!jsonMatch) {
//             throw new Error("No JSON object found in the AI response.");
//         }

//         const cleanJson = jsonMatch[0];
//         const parsedResponse = JSON.parse(cleanJson);
//         return parsedResponse;
        
//     } catch (error) {
//         console.error("Error generating assessment:", error);
//         return null;
//     }
// }

import { ModelClass } from '../model/ModelClass';
import { singleQuestionPromptTemplate } from '../templates/promptTemplates_testing';
import { AssessmentService } from '../services/AssessmentService';

async function generateSingleQuestion(concept: any, itemNumber: number) {
    const model = ModelClass.getInstance();
    
    // 1. Let TypeScript do the mapping math
    const templates = concept.question_generation.templates;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Figure out if it uses {noun_phrase} or {verb_phrase}
    const variableKey = Object.keys(concept.question_generation.variables)[0]; 
    const variablesArray = concept.question_generation.variables[variableKey];
    const randomVariable = variablesArray[Math.floor(Math.random() * variablesArray.length)];

    // Build the raw base question
    const baseQuestion = randomTemplate.replace(`{${variableKey}}`, randomVariable);

    // 2. Feed the mapped string to the AI for paraphrasing
    const prompt = singleQuestionPromptTemplate
        .replace('{concept_name}', concept.concept_name)
        .replace('{base_question}', baseQuestion);

    try {
        const aiMessage = await model.invoke(prompt);
        const responseText = aiMessage.content as string;
        
        // Parse the tiny JSON output
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) throw new Error("No JSON found in response.");
        const aiOutput = JSON.parse(jsonMatch[0]);

        // 3. Let TypeScript securely shuffle the options
        const rawOptions = [concept.answer, ...concept.distractors];
        const shuffledOptions = rawOptions.sort(() => 0.5 - Math.random());

        // 4. Assemble the final perfect object
        return {
            item_number: itemNumber,
            concept_id: concept.concept_id,
            question: aiOutput.paraphrased_question, // AI's creative text
            options: shuffledOptions,                // TypeScript's perfect shuffle
            correct_answer: concept.answer,          // 100% accurate from JSON
            rationale: concept.rationale,            // 100% accurate from JSON
            difficulty: concept.difficulty,
            blooms_taxonomy: concept.metadata.blooms_taxonomy
        };

    } catch (error) {
        console.error(`Error generating item ${itemNumber}:`, error);
        return null; 
    }
}

// (Keep your generateAssessmentStream function exactly as it is below this)
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
            extractedConcepts = service.getDiagnosticData(); // Try letting it pull all 10 now!
            break;
    }

    for (let i = 0; i < extractedConcepts.length; i++) {
        const generatedQuestion = await generateSingleQuestion(extractedConcepts[i], i + 1);
        yield generatedQuestion; 
    }
}