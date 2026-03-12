import { getStudyTips } from "./features/getStudyTips";
import { diagnosticScoreInterface } from "./types/input/diagnosticScoreInterface";
import { DiagnosticQuizInput } from "./types/input/diagnosticQuizInput"
import { QuarterlyExamInput } from "./types/input/quarterlyExamInput"
import {DiagnosticQuiz} from "./services/DiagnosticQuiz"
import {QuarterlyExamService} from "./services/QuarterlyExamService"
async function main() {
  // const mockDiagnosticData: diagnosticScoreInterface = {
  //   quarter1_score: 42,
  //   quarter1_lessons: ["Algebra Basics, Variables, Linear Equations"],

  //   quarter2_score: 68,
  //   quarter2_lessons: ["Fractions, Ratios, Proportions"],

  //   quarter3_score: 85,
  //   quarter3_lessons: ["Triangles", "Angles", "Geometry Basics"],

  //   quarter4_score: 55,
  //   quarter4_lessons: ["Mean, Median, Mode", "Basic Statistics"],
  // };

  // const json = await getStudyTips(mockDiagnosticData);
  // console.log(json);


  const mockQuarterlyExamInput: QuarterlyExamInput = {
  subjectName: "Science",
  quarter: 1,
  topic: "Matter: Its Properties and Changes",
  grade: 5,
  country: "Philippines",
  lessons: [
    {
      title: "Lesson 1: Properties of Materials",
      content: "Matter has physical properties like hardness, malleability, and porosity. Hardness is measured by the Mohs Scale. Porosity is the ability to absorb liquid."
    },
    {
      title: "Lesson 2: Oxidation and Rusting",
      content: "Oxidation is a chemical change. Rusting of iron occurs when exposed to oxygen and moisture. Galvanization involves coating iron with zinc to prevent rust."
    },
    {
      title: "Lesson 3: Phase Changes and Heat",
      content: "Sublimation is a solid turning directly into gas. Condensation is gas turning into liquid. These changes are physical and caused by temperature shifts."
    },
    {
      title: "Lesson 4: Waste Management and 5Rs",
      content: "The 5Rs are Reduce, Reuse, Recycle, Repair, and Recover. Recycling involves breaking down materials to create new products. Recovering collects energy from waste."
    },
    {
      title: "Lesson 5: Environmental Protection (RA 9003)",
      content: "The Ecological Solid Waste Management Act (RA 9003) regulates waste in the Philippines. It aims to reduce leachate—toxic liquid from landfills."
    }
  ]
};

  const json = await QuarterlyExamService.generateExam(mockQuarterlyExamInput);
  console.log(json);

}

main();

