export interface AssessmentItem {
    item_number: number;
    concept_id: string;
    question: string;
    options: string[]; // Answer + Distractors, shuffled
    correct_answer: string;
    rationale: string;
    difficulty: string;
    blooms_taxonomy: string;
}

export interface AssessmentResponse {
    assessment_type: string;
    total_items: number;
    items: AssessmentItem[];
}