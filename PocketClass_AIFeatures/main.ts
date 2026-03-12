import { LessonQuizService } from "./services/LessonQuizService";
import { LessonQuizInput } from "./types/input/LessonQuizInput";

async function main() {
  const lesson = new LessonQuizService();

  // const json = await lesson.generateQuiz(lessonQuizInput);
  // console.log(json);
}

main();