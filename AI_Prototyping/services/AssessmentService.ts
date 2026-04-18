import * as fs from 'fs';
import * as path from 'path';

export class AssessmentService {
    private curriculumData: any;

    constructor() {
        const filePath = path.join(__dirname, '../data/g5_sci_q1.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        this.curriculumData = JSON.parse(rawData);
    }

    // Helper to get random items from an array
    private getRandomItems(arr: any[], count: number) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    public getQuizData(lessonId: string) {
        const lesson = this.curriculumData.quarters[0].lessons.find((l: any) => l.lesson_id === lessonId);
        if (!lesson) throw new Error("Lesson not found");
        
        // 10 items for a specific lesson
        return this.getRandomItems(lesson.concepts, 10);
    }

    public getQuarterlyExamData() {
        const lessons = this.curriculumData.quarters[0].lessons;
        let examConcepts: any[] = [];

        // 4 items per lesson * 10 lessons = 40 items
        lessons.forEach((lesson: any) => {
            const selectedConcepts = this.getRandomItems(lesson.concepts, 4);
            examConcepts = examConcepts.concat(selectedConcepts);
        });

        return examConcepts;
    }

    public getDiagnosticData() {
        const lessons = this.curriculumData.quarters[0].lessons;
        let diagnosticConcepts: any[] = [];

        // 1 item per lesson * 10 lessons = 10 items
        lessons.forEach((lesson: any) => {
            const selectedConcept = this.getRandomItems(lesson.concepts, 1);
            diagnosticConcepts = diagnosticConcepts.concat(selectedConcept);
        });

        return diagnosticConcepts;
    }
}