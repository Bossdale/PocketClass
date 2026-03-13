import { MOCK_EXAM_INPUTS } from './mock/mockQuarterlyExam';
import {QuarterlyExamService} from './services/QuarterlyExamService'
import type { QuarterlyExamQuestion } from './types/outputs/QuarterlyExamOutput';

const service = new QuarterlyExamService();
 
export async function main(){
  const five = await service.generateExam(MOCK_EXAM_INPUTS[0]);

      const all: QuarterlyExamQuestion[] = [];
      for (const input of MOCK_EXAM_INPUTS) {
        const questions = await service.generateExam(input);
        all.push(...questions);
      }
      console.log(`Total: ${all.length} questions`);  // → 25
  
  // ✅ Add this to print the full 25-question array beautifully formatted
  console.log(JSON.stringify(all, null, 2));
    
}
    
// Call the function to actually execute the code
main().catch(console.error);