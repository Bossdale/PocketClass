import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

import type { 
  QuizQuestion, 
  MultipleChoiceQuestion, 
  TrueFalseQuestion, 
  FillBlankQuestion 
} from '@/lib/types';
import QuizDragDrop from './QuizDragDrop';
import QuizMatching from './QuizMatching';

interface QuizRendererProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
}

const colors = {
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  success: '#16a34a',
  successLight: 'rgba(22, 163, 74, 0.1)',
  destructive: '#dc2626',
  destructiveLight: 'rgba(220, 38, 38, 0.1)',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  slate50: '#f8fafc',
  slate200: '#e2e8f0',
  slate700: '#334155',
  transparent: 'transparent',
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Shared Explanation Block ────────────────────────────────────────────────
function ExplanationBlock({ explanation, isCorrect }: { explanation?: string; isCorrect: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (!explanation) return null;

  const accentColor  = isCorrect ? colors.success     : colors.destructive;
  const accentBg     = isCorrect ? colors.successLight : colors.destructiveLight;
  const accentBorder = isCorrect ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  return (
    <View style={expStyles.wrapper}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.75}
        style={[expStyles.pill, { backgroundColor: accentBg }]}
      >
        <Text style={[expStyles.pillIcon]}>💡</Text>
        <Text style={[expStyles.pillLabel, { color: accentColor }]}>Explanation</Text>
        <Text style={[expStyles.pillChevron, { color: accentColor }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[expStyles.body, { borderColor: accentBorder }]}>
          <Text style={expStyles.bodyText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Next Button ─────────────────────────────────────────────────────────────
function NextButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={nextStyles.button} onPress={onPress} activeOpacity={0.85}>
      <Text style={nextStyles.label}>Next →</Text>
    </TouchableOpacity>
  );
}

// ─── Quiz Renderer Router ─────────────────────────────────────────────────────
const QuizRenderer = ({ question, onAnswer }: QuizRendererProps) => {
  switch (question.type) {
    case 'multiple_choice':
      return <MCRenderer question={question} onAnswer={onAnswer} />;
    case 'true_false':
      return <TFRenderer question={question} onAnswer={onAnswer} />;
    case 'fill_blank':
      return <FBRenderer question={question} onAnswer={onAnswer} />;
    case 'drag_drop':
      return <QuizDragDrop question={question} onAnswer={onAnswer} />;
    case 'matching':
      return <QuizMatching question={question} onAnswer={onAnswer} />;
    default:
      return null;
  }
};

// ─── Multiple Choice ──────────────────────────────────────────────────────────
function MCRenderer({ question, onAnswer }: { question: MultipleChoiceQuestion; onAnswer: (c: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correct = selected === question.correctOption;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  };

  const getOptionStyle = (idx: number) => {
    if (!revealed) return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 1 };
    if (idx === question.correctOption) return { borderColor: colors.success, backgroundColor: colors.successLight, color: colors.success, opacity: 1 };
    if (idx === selected)               return { borderColor: colors.destructive, backgroundColor: colors.destructiveLight, color: colors.destructive, opacity: 1 };
    return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 0.4 };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.optionsList}>
        {question.options.map((opt, i) => {
          const s = getOptionStyle(i);
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => handleSelect(i)}
              style={[styles.optionButton, { borderColor: s.borderColor, backgroundColor: s.backgroundColor, opacity: s.opacity }]}
            >
              <Text style={[styles.optionText, { color: s.color }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {revealed && (
        <>
          <ExplanationBlock explanation={question.explanation} isCorrect={correct} />
          <NextButton onPress={() => onAnswer(correct)} />
        </>
      )}
    </View>
  );
}

// ─── True / False ─────────────────────────────────────────────────────────────
function TFRenderer({ question, onAnswer }: { question: TrueFalseQuestion; onAnswer: (c: boolean) => void }) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correct = selected === question.correctAnswer;

  const handleSelect = (val: boolean) => {
    if (revealed) return;
    setSelected(val);
    setRevealed(true);
  };

  const getBtnStyle = (val: boolean) => {
    if (!revealed) return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 1 };
    if (val === question.correctAnswer) return { borderColor: colors.success, backgroundColor: colors.successLight, color: colors.success, opacity: 1 };
    if (val === selected)               return { borderColor: colors.destructive, backgroundColor: colors.destructiveLight, color: colors.destructive, opacity: 1 };
    return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 0.4 };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.tfGrid}>
        {([true, false] as boolean[]).map(val => {
          const s = getBtnStyle(val);
          return (
            <TouchableOpacity
              key={String(val)}
              activeOpacity={0.7}
              onPress={() => handleSelect(val)}
              style={[styles.optionButton, styles.tfButton, { borderColor: s.borderColor, backgroundColor: s.backgroundColor, opacity: s.opacity }]}
            >
              <Text style={[styles.tfText, { color: s.color }]}>{val ? 'True' : 'False'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {revealed && (
        <>
          <ExplanationBlock explanation={question.explanation} isCorrect={correct} />
          <NextButton onPress={() => onAnswer(correct)} />
        </>
      )}
    </View>
  );
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────
function FBRenderer({ question, onAnswer }: { question: FillBlankQuestion; onAnswer: (c: boolean) => void }) {
  const [answer, setAnswer]     = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();

  const handleSubmit = () => {
    if (revealed || !answer.trim()) return;
    setRevealed(true);
  };

  const parts = question.questionText.split('___');

  let inputColor  = colors.primary;
  let inputBorder = colors.primary;
  if (revealed) {
    inputColor  = isCorrect ? colors.success     : colors.destructive;
    inputBorder = isCorrect ? colors.success     : colors.destructive;
  }

  return (
    <View style={styles.container}>
      <View style={styles.fbSentenceContainer}>
        <Text style={styles.questionText}>{parts[0]}</Text>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          editable={!revealed}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.fbInput, { color: inputColor, borderBottomColor: inputBorder }]}
        />
        {parts[1] ? <Text style={styles.questionText}>{parts[1]}</Text> : null}
      </View>

      {revealed && !isCorrect && (
        <Text style={styles.correctAnswerText}>✓ Correct answer: {question.correctAnswer}</Text>
      )}

      {question.hint && !revealed && (
        <TouchableOpacity onPress={() => setShowHint(!showHint)} style={styles.hintButton}>
          <Text style={styles.hintText}>💡 {showHint ? question.hint : 'Show hint'}</Text>
        </TouchableOpacity>
      )}

      {!revealed && (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!answer.trim()}
          style={[styles.submitButton, !answer.trim() && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}

      {revealed && (
        <>
          <ExplanationBlock explanation={question.explanation} isCorrect={isCorrect} />
          <NextButton onPress={() => onAnswer(isCorrect)} />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsList: {
    gap: 8,
  },
  optionButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '400',
  },
  tfGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  tfButton: {
    flex: 1,
    alignItems: 'center',
  },
  tfText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fbSentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  fbInput: {
    borderBottomWidth: 2,
    minWidth: 100,
    paddingVertical: 0,
    paddingHorizontal: 4,
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  correctAnswerText: {
    fontSize: 14,
    color: colors.success,
    marginBottom: 8,
    fontWeight: '500',
  },
  hintButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 12,
    color: colors.primary,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.3,
  },
  submitButtonText: {
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 16,
  },
});

const expStyles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillChevron: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.slate50,
  },
  bodyText: {
    fontSize: 14,
    color: colors.slate700,
    lineHeight: 22,
  },
});

const nextStyles = StyleSheet.create({
  button: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default QuizRenderer;