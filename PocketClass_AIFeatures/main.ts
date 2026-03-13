import { LessonQuizService } from "./services/LessonQuizService";
import { LessonQuizInput } from "./types/input/LessonQuizInput";

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
  // await testAIExplanation();
 
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ All tests complete — ${elapsed}s`);
  console.log('═'.repeat(60) + '\n');

}

main();