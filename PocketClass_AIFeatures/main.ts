import { MOCK_EXAM_INPUTS } from './mock/mockQuarterlyExam';
import {QuarterlyExamService} from './services/QuarterlyExamService'
import type { QuarterlyExamQuestion } from './types/outputs/QuarterlyExamOutput';
import type { LessonQuizInput } from './types/input/LessonQuizInput';
import type { SimpleExamInput } from './services/QuarterlyExamService';

const service = new QuarterlyExamService();
export async function main(){
  
  const mockSimpleExamInput: SimpleExamInput = {
  subjectName: 'Biology',
  quarter: 1,
  lessonTitle: 'Digestive System',
  grade: 8,
  country: 'indonesia',
  difficulty: 'medium', // can be 'easy', 'medium', or 'hard'
  questions: [
  { "question": "What is the stomach's main job in digestion?", "answer": "Breaks down food with acid and enzymes" },
  { "question": "Which organ absorbs most nutrients from food?", "answer": "Small intestine" },
  { "question": "Saliva contains enzymes that begin the breakdown of starch.", "answer": "True" },
  { "question": "The large intestine is the main site for nutrient absorption.", "answer": "False" },
  { "question": "Name the muscular action that pushes food through the digestive tract.", "answer": "Peristalsis" },
  { "question": "Which organ produces bile to help digest fats?", "answer": "Liver" },
  { "question": "Where is bile stored before being released into the small intestine?", "answer": "Gallbladder" },
  { "question": "Which enzyme in the stomach starts breaking down proteins?", "answer": "Pepsin" },
  { "question": "The digestive process starts in the mouth.", "answer": "True" },
  { "question": "Name the small, rounded mass of food formed by the tongue to facilitate swallowing.", "answer": "Bolus" }
  ]
};
// Usage example
  const json = await service.generateExam(mockSimpleExamInput)
  console.log(json);
}
    
// Call the function to actually execute the code
main().catch(console.error);


//   const lessonQuizInput: LessonQuizInput = {
//   grade: 8,
//   country: 'Philippines',
//   difficulty: 'medium',
//   question_number: 3,
//   questions: [
//     {
//       question: "What is the first part of the digestive system where food is broken down by chewing and saliva?",
//       answer: "Mouth"
//     },
//     {
//       question: "Which organ produces bile that helps digest fats?",
//       answer: "Liver"
//     },
//     {
//       question: "What is the main function of the small intestine in digestion?",
//       answer: "Absorption of nutrients"
//     }
//   ]
// };