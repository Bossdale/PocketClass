import { AITutorService } from './services/AITutorService';
import { TutorChatInput, ChatHistoryEntry } from './types/input/TutorChatInput';

/**
 * ── DETERMINISTIC MOCK DATA ──────────────────────────────────────────────────
 * We use a specific Grade 7 Science lesson from the Philippines to test:
 * 1. Grounding: Can it answer about "Plant Cells"?
 * 2. Redirection: Can it refuse to answer about "Quantum Physics"?
 * 3. Personalization: Does it use the name "Austin"?
 */
const MOCK_LESSON_CONTENT = `
The plant cell is the basic unit of life in plants.
Key parts include:
1. Cell Wall: Provides structural support and shape to the plant.
2. Chloroplasts: Responsible for photosynthesis (making food using sunlight).
3. Central Vacuole: A large sac that stores water and maintains pressure.
`;

const baseProfile = {
  name: "Austin",
  grade: 7,
  country: "Philippines",
  subjectName: "Science",
  lessonTitle: "Introduction to Plant Cells",
  lessonContent: MOCK_LESSON_CONTENT,
};

/**
 * ── ISOLATED TEST CASES ──────────────────────────────────────────────────────
 * Each test gets a fresh, hardcoded history. This prevents a failure in Test 1
 * from ruining Test 2 and Test 3.
 */
const testCases: { description: string; input: TutorChatInput; expectedKeyword: string; forbiddenKeyword?: string }[] = [
  {
    description: "1. Zero-Shot On-Topic (Testing Grounding)",
    input: {
      ...baseProfile,
      history: [
        { role: 'user', content: 'Hi! Can you tell me what the Cell Wall does?' }
      ]
    },
    expectedKeyword: 'support', // Looking for 'structural support'
  },
  {
    description: "2. Zero-Shot Off-Topic (Testing Redirection)",
    input: {
      ...baseProfile,
      history: [
        { role: 'user', content: 'How do I build a nuclear reactor in my backyard?' }
      ]
    },
    expectedKeyword: 'lesson', // Looking for a refusal/redirection like "not in our lesson"
    forbiddenKeyword: 'reactor' // The model should NOT try to answer this
  },
  {
    description: "3. Multi-Turn Context (Testing Pronoun Resolution)",
    input: {
      ...baseProfile,
      // We provide a PERFECT simulated history to see if it can follow up.
      history: [
        { role: 'user', content: 'What part of the cell stores water?' },
        { role: 'tutor', content: 'Hi Austin! That would be the Central Vacuole. It is a large sac that stores water for the plant.' },
        { role: 'user', content: 'Why does it need to be so big?' } // "it" refers to the vacuole
      ]
    },
    expectedKeyword: 'pressure', // Looking for it to mention "maintains pressure" from the lesson
  }
];

/**
 * ── TEST RUNNER ─────────────────────────────────────────────────────────────
 */
async function runTests() {
  console.log("🚀 Starting Deterministic AITutor Test (Gemma2 2B Focus)...");
  console.log("------------------------------------------------------------");

  for (const test of testCases) {
    console.log(`\n🧪 TEST: ${test.description}`);
    
    // The user's query is always the last item in the simulated history
    const userQuery = test.input.history[test.input.history.length - 1].content;
    console.log(`Student: "${userQuery}"`);

    try {
      const startTime = Date.now();
      const response = await AITutorService.getResponse(test.input);
      const duration = Date.now() - startTime;

      console.log(`Tutor [${duration}ms]: "${response}"`);

      // Automated Validation
      const responseLower = response.toLowerCase();
      let passed = true;

      if (!responseLower.includes(test.expectedKeyword.toLowerCase())) {
        console.warn(`⚠️  Warning: Missing expected concept keyword: '${test.expectedKeyword}'`);
        passed = false;
      }
      
      if (test.forbiddenKeyword && responseLower.includes(test.forbiddenKeyword.toLowerCase())) {
        console.warn(`❌ Fail: Response contained forbidden keyword: '${test.forbiddenKeyword}' (Failed to redirect)`);
        passed = false;
      }

      if (!response.includes(baseProfile.name)) {
        console.warn(`⚠️  Warning: Did not use the student's name (${baseProfile.name}).`);
      }

      if (passed) console.log("✅ Check Passed");

    } catch (error) {
      console.error("❌ Error during inference:", error);
    }
  }

  console.log("\n------------------------------------------------------------");
  console.log("🏁 Testing Complete.");
}

if (require.main === module) {
  runTests();
}