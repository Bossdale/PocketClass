export const singleQuestionPromptTemplate = `
You are a technical Science Editor. 

TASK:
Paraphrase the "BASE QUESTION" provided below. 

STRICT RULES:
1. Keep the scientific meaning exactly the same as the BASE QUESTION.
2. Do not add any extra information, analogies, or outside context.
3. Ensure the question structure leads directly to a single noun/term answer.
4. If the BASE QUESTION does not mention "volume" or "space," your version must not mention them either.
5. Output ONLY a valid JSON object. No other text.

INPUT:
Concept: {concept_name}
BASE QUESTION: {base_question}

OUTPUT SCHEMA:
{
  "paraphrased_question": "Your restructured version here"
}
`;