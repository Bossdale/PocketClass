import { getStudyTips } from "../frontend/ai_engine/features/getStudyTips";
import { diagnosticScoreInterface } from "./types/input/diagnosticScoreInterface";
import { generateFocusArea } from "../frontend/ai_engine/features/generateFocusArea"; 
import { FocusAreaRequest } from "./types/input/focusAreaRequestInterface";

async function main() {
  const mockDiagnosticData: diagnosticScoreInterface = {
    quarter1_score: 42,
    quarter1_lessons: ["Algebra Basics, Variables, Linear Equations"],

    quarter2_score: 68,
    quarter2_lessons: ["Fractions, Ratios, Proportions"],

    quarter3_score: 85,
    quarter3_lessons: ["Triangles", "Angles", "Geometry Basics"],

    quarter4_score: 55,
    quarter4_lessons: ["Mean, Median, Mode", "Basic Statistics"],
  };

  const mockFocusAreaData: FocusAreaRequest = {
        subject_name: "Mathematics",
        subject_mastery: 35,
        lesson_title: "Linear Equations",
        lesson_score: 50,
        lesson_content: "Understanding constant rates of change, solving for unknown variables, and graphing straight lines using y = mx + b."
    };


  const focusAreaPlan = await generateFocusArea(mockFocusAreaData);
  console.log(focusAreaPlan);
  // const json = await getStudyTips(mockDiagnosticData);
  // console.log(json);
}

main();
