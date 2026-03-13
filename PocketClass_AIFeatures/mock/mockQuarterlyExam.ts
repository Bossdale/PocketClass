/**
 * mockQuarterlyExam.ts
 *
 * Mock QuarterlyExamInput objects for testing QuarterlyExamService.
 */

import type { QuarterlyExamInput } from '../types/input/quarterlyExamInput';

// =============================================================================
// Lesson 0 — Properties of Materials  (lessonIndex 0, EVEN → drag_drop)
// =============================================================================
const lesson0: QuarterlyExamInput = {
  subjectName: 'Science',
  quarter:     1,
  lessonTitle: 'Properties of Materials',
  lessonIndex: 0,
  grade:       7,
  country:     'malaysia',

  mcqSeeds: [
    {
      question: 'Which specific property describes how easily a material allows an electrical current to flow through it?',
      answer:   'Electrical conductivity',
      options:  ['Electrical conductivity', 'Hardness', 'Density', 'Transparency'],
    },
    {
      question: 'When a geologist tests a mineral by trying to scratch it with a fingernail, which property are they testing?',
      answer:   'Hardness',
      options:  ['Hardness', 'Malleability', 'Solubility', 'Electrical conductivity'],
    },
  ],

  tfSeeds: [
    {
      question: 'Density is defined as the amount of mass contained in a given volume of a material.',
      answer:   'true',
    },
  ],

  fbSeeds: [
    {
      question: 'The physical property that allows a metal like gold to be hammered into very thin sheets is called ___.',
      answer:   'Malleability',
    },
  ],

  dragDropSeed: {
    instruction:  'Arrange the steps of a material investigation in the correct scientific order.',
    items:        ['Record the results', 'Observe the material', 'Draw a conclusion', 'Measure its properties'],
    correctOrder: [1, 3, 0, 2],
  },
};

// =============================================================================
// Lesson 1 — Metals and Non-Metals  (lessonIndex 1, ODD → matching)
// =============================================================================
const lesson1: QuarterlyExamInput = {
  subjectName: 'Science',
  quarter:     1,
  lessonTitle: 'Metals and Non-Metals',
  lessonIndex: 1,
  grade:       7,
  country:     'malaysia',

  mcqSeeds: [
    {
      question: 'What is a common physical characteristic shared by almost all metals?',
      answer:   'They are good conductors of heat',
      options:  ['They are good conductors of heat', 'They are brittle at room temperature', 'They do not reflect light', 'They are poor conductors of electricity'],
    },
    {
      question: 'Which of these elements exhibits properties of both metals and non-metals (a metalloid)?',
      answer:   'Silicon',
      options:  ['Silicon', 'Copper', 'Sulfur', 'Nitrogen'],
    },
  ],

  tfSeeds: [
    {
      question: 'Non-metals, such as sulfur and phosphorus, are excellent conductors of electricity.',
      answer:   'false',
    },
  ],

  fbSeeds: [
    {
      question: 'Copper is used for electrical wiring because it possesses high ___, meaning it can be easily drawn into thin wires.',
      answer:   'ductility',
    },
  ],

  matchingSeed: {
    instruction:  'Match each metal to its primary industrial use.',
    leftItems:    ['Copper', 'Aluminium', 'Iron'],
    rightItems:   ['Making lightweight aircraft bodies', 'Manufacturing electrical wiring', 'Constructing sturdy bridges'],
    correctPairs: [1, 0, 2],
  },
};

// =============================================================================
// Lesson 2 — Physical and Chemical Changes  (lessonIndex 2, EVEN → drag_drop)
// =============================================================================
const lesson2: QuarterlyExamInput = {
  subjectName: 'Science',
  quarter:     1,
  lessonTitle: 'Physical and Chemical Changes',
  lessonIndex: 2,
  grade:       7,
  country:     'malaysia',

  mcqSeeds: [
    {
      question: 'Which of the following scenarios describes a physical change rather than a chemical change?',
      answer:   'Ice melting into water',
      options:  ['Ice melting into water', 'Iron rusting over time', 'Wood burning in a fire', 'Milk souring in the fridge'],
    },
    {
      question: 'During a combustion reaction, what new substance is formed when magnesium ribbon burns in oxygen?',
      answer:   'Magnesium oxide',
      options:  ['Magnesium oxide', 'Magnesium chloride', 'Magnesium sulfate', 'Magnesium hydroxide'],
    },
  ],

  tfSeeds: [
    {
      question: 'A chemical change always results in the formation of one or more entirely new substances.',
      answer:   'true',
    },
  ],

  fbSeeds: [
    {
      question: 'When an iron nail is left outside and turns reddish-brown, a ___ change has occurred.',
      answer:   'chemical',
    },
  ],

  dragDropSeed: {
    instruction:  'Arrange the stages of a combustion (burning) reaction in the correct order.',
    items:        ['New substance is formed', 'Fuel is ignited', 'Heat and light are released', 'Fuel reacts with oxygen'],
    correctOrder: [1, 3, 2, 0],
  },
};

// =============================================================================
// Lesson 3 — Mixtures and Solutions  (lessonIndex 3, ODD → matching)
// =============================================================================
const lesson3: QuarterlyExamInput = {
  subjectName: 'Science',
  quarter:     1,
  lessonTitle: 'Mixtures and Solutions',
  lessonIndex: 3,
  grade:       7,
  country:     'malaysia',

  mcqSeeds: [
    {
      question: 'Which physical separation method is most appropriate for removing solid sand particles from liquid water?',
      answer:   'Filtration',
      options:  ['Filtration', 'Distillation', 'Evaporation', 'Chromatography'],
    },
    {
      question: 'When sugar is stirred into water until it disappears, the sugar is acting as the:',
      answer:   'solute',
      options:  ['solute', 'solvent', 'mixture', 'suspension'],
    },
  ],

  tfSeeds: [
    {
      question: 'A solution is classified as a heterogeneous mixture because the solute is unevenly distributed.',
      answer:   'false',
    },
  ],

  fbSeeds: [
    {
      question: 'To recover salt from seawater, you can use the process of ___, which leaves the salt behind as the water turns to gas.',
      answer:   'evaporation',
    },
  ],

  matchingSeed: {
    instruction:  'Match the separation technique to the specific mixture it is best suited to separate.',
    leftItems:    ['Filtration', 'Evaporation', 'Distillation', 'Chromatography'],
    rightItems:   ['Separating different colored dyes in ink', 'Obtaining solid salt from saltwater', 'Separating large sand particles from water', 'Separating pure liquid water from saltwater'],
    correctPairs: [2, 1, 3, 0],
  },
};

// =============================================================================
// Lesson 4 — Elements, Compounds and Mixtures  (lessonIndex 4, EVEN → drag_drop)
// =============================================================================
const lesson4: QuarterlyExamInput = {
  subjectName: 'Science',
  quarter:     1,
  lessonTitle: 'Elements, Compounds and Mixtures',
  lessonIndex: 4,
  grade:       7,
  country:     'malaysia',

  mcqSeeds: [
    {
      question: 'What is the fundamental, smallest particle of an element that still retains the chemical properties of that element?',
      answer:   'An atom',
      options:  ['An atom', 'A molecule', 'A compound', 'An ion'],
    },
    {
      question: 'Which of the following substances is classified as a chemical compound rather than an element or mixture?',
      answer:   'Water (H₂O)',
      options:  ['Water (H₂O)', 'Oxygen gas (O₂)', 'A mixture of salt and pepper', 'Nitrogen gas (N₂)'],
    },
  ],

  tfSeeds: [
    {
      question: 'A chemical compound can be easily separated back into its original elements using a physical filter.',
      answer:   'false',
    },
  ],

  fbSeeds: [
    {
      question: 'When two or more distinct elements are chemically bonded together in a fixed ratio, they form a pure substance known as a ___.',
      answer:   'compound',
    },
  ],

  dragDropSeed: {
    instruction:  'Arrange these categories of matter from the most basic to the most complex.',
    items:        ['Mixture', 'Element', 'Solution', 'Compound'],
    correctOrder: [1, 3, 0, 2],
  },
};

export const MOCK_EXAM_INPUTS: QuarterlyExamInput[] = [
  lesson0,
  lesson1,
  lesson2,
  lesson3,
  lesson4,
];