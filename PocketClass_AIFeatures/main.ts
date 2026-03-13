import { LessonQuizService } from "./services/LessonQuizService"; // Adjust the path if needed
import { LessonQuizInput } from "./types/input/LessonQuizInput";

async function main() {

    const quizService = new LessonQuizService();

    const mockInput: LessonQuizInput = {
        grade: 7,
        country: "Philippines",
        difficulty: "easy", 
        question_number: 1,
        questions: [
            {
                question: "What do you call an animal that eats only plants?", 
                answer: "Herbivore"
            }
        ] as any 
    };
    
    const generatedQuestion = await quizService.generateQuiz(mockInput);
    console.log(JSON.stringify(generatedQuestion, null, 2));
}

main();