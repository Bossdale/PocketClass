// frontend/services/AssessmentService.ts
import { 
    getQuizDataForLesson, 
    getQuarterlyExamData, 
    getDiagnosticData 
} from '../../lib/database';

export class AssessmentService {
    
    public getQuizData(lessonId: string) {
        const quizConcepts = getQuizDataForLesson(lessonId);
        if (!quizConcepts || quizConcepts.length === 0) {
            throw new Error(`No concepts found for quiz in lesson: ${lessonId}`);
        }
        return quizConcepts;
    }

    public getQuarterlyExamData(quarterId: string = 'Q1') {
        const examConcepts = getQuarterlyExamData(quarterId);
        if (!examConcepts || examConcepts.length === 0) {
            throw new Error(`No concepts found for quarterly exam in quarter: ${quarterId}`);
        }
        return examConcepts;
    }

    public getDiagnosticData(quarterId: string = 'Q1') {
        const diagnosticConcepts = getDiagnosticData(quarterId);
        if (!diagnosticConcepts || diagnosticConcepts.length === 0) {
            throw new Error(`No concepts found for diagnostic exam in quarter: ${quarterId}`);
        }
        return diagnosticConcepts;
    }
}