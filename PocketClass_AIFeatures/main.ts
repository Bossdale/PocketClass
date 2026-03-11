import { getStudyTips } from "./features/getStudyTips";
import { diagnosticScoreInterface } from "./types/input/diagnosticScoreInterface";

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

  const json = await getStudyTips(mockDiagnosticData);
  console.log(json);
}

main();
