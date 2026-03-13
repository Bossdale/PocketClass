
import { ModelClass }           from './model/ModelClass';
import { DiagnosticQuiz }       from './services/DiagnosticQuiz';
import { StudyPlanService }     from './services/StudyPlanService';
import { LessonMaterialService} from './services/LessonMaterialService';
import { LessonQuizService }    from './services/LessonQuizService';
import { AITutorService }       from './services/AITutorService';
import { AIExplanationService } from './services/AIExplanationService';
 
import type { DiagnosticQuizInput }      from './types/input/diagnosticQuizInput';
import type { diagnosticScoreInterface } from './types/input/diagnosticScoreInterface';
import type { LessonMaterialInput }      from './types/input/LessonMaterialInput';
import type { LessonQuizInput }          from './types/input/LessonQuizInput';

import type { TutorChatInput }           from './types/input/TutorChatInput';

function section(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

async function run<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  console.log(`\n⏳ ${label}...`);
  try {
    const result = await fn();
    console.log(`✅ Done: ${label}`);
    return result;
  } catch (err) {
    console.error(`❌ Failed: ${label}`);
    console.error('   →', (err as Error).message);
    return null;
  }
}

async function testAIExplanation() {
  section('TEST 7 — AIExplanationService');

  const svc = new AIExplanationService();

  const sectionText = 'The small intestine absorbs most nutrients into the bloodstream. ' +
    'It is about 6 metres long and lined with tiny finger-like projections ' +
    'called villi that increase the surface area for absorption.';

  // Grade 7 — simpler language expected
  console.log('\n📥 Input text:', sectionText);
  console.log('\n▶ Testing Grade 7...');

  const g7 = await run('AIExplanationService.getExplanation (Grade 7)', () =>
    svc.getExplanation({ text: sectionText, grade: 7 })
  );

  if (g7) {
    console.log(`\n▶ Grade 7 result:\n   "${g7}"`);
    console.log(`▶ Is plain text (no markdown): ${!/[*#[\]`]/.test(g7) ? '✅' : '❌'}`);
    console.log(`▶ Not empty: ${g7.length > 20 ? '✅' : '❌'}`);
  }

  // Grade 12 — more technical language expected
  console.log('\n▶ Testing Grade 12...');

  const g12 = await run('AIExplanationService.getExplanation (Grade 12)', () =>
    svc.getExplanation({ text: sectionText, grade: 12 })
  );

  if (g12) {
    console.log(`\n▶ Grade 12 result:\n   "${g12}"`);
    console.log(`▶ Is plain text (no markdown): ${!/[*#[\]`]/.test(g12) ? '✅' : '❌'}`);
  }
}


async function main() {
  const lesson = new LessonQuizService();

  // const json = await lesson.generateQuiz(lessonQuizInput);
  // console.log(json);

  console.log('\n🚀 PocketClass AI Module — CLI Test Runner');
  console.log('Model: gemma2:2b via Ollama');
  console.log('Make sure Ollama is running:  ollama serve\n');

  const start = Date.now();

  // await testModelClass();
  // await testDiagnosticQuiz();
  // await testStudyPlan();
  // await testLessonMaterial();
  // await testLessonQuiz();
  // await testAITutor();
   await testAIExplanation();
 
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ All tests complete — ${elapsed}s`);
  console.log('═'.repeat(60) + '\n');

}

// if (require.main === module) {
//   runTests();
// }