import { LessonQuizService } from "./services/LessonQuizService"; // Adjust the path if needed
import { LessonQuizInput } from "./types/input/LessonQuizInput";

async function main() {
  const quizService = new LessonQuizService();

  const lessonQuizInput: LessonQuizInput = {
  grade: 8,
  country: 'Philippines',
  difficulty: 'medium',
  question_number: 3,
  questions: [
    {
      question: "What is the first part of the digestive system where food is broken down by chewing and saliva?",
      answer: "Mouth"
    },
    {
      question: "Which organ produces bile that helps digest fats?",
      answer: "Liver"
    },
    {
      question: "What is the main function of the small intestine in digestion?",
      answer: "Absorption of nutrients"
    }
  ]
};

// Usage example
  const json = await quizService.generateQuiz(lessonQuizInput);
  console.log(json);
}

main();