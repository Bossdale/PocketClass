import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

// Assuming these are your local imports
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

// Common color palette for consistency
const colors = {
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  success: '#16a34a',
  destructive: '#dc2626',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  transparent: 'transparent',
};

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

function MCRenderer({ question, onAnswer }: { question: MultipleChoiceQuestion; onAnswer: (c: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === question.correctOption;
    setTimeout(() => onAnswer(correct), 800);
  };

  const getOptionStyle = (idx: number) => {
    if (!revealed) return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 1 };
    if (idx === question.correctOption) return { borderColor: colors.success, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: colors.success, opacity: 1 };
    if (idx === selected) return { borderColor: colors.destructive, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: colors.destructive, opacity: 1 };
    return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 0.5 };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.questionText}</Text>
      <View style={styles.optionsList}>
        {question.options.map((opt, i) => {
          const dynamicStyle = getOptionStyle(i);
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => handleSelect(i)}
              style={[
                styles.optionButton, 
                { 
                  borderColor: dynamicStyle.borderColor, 
                  backgroundColor: dynamicStyle.backgroundColor,
                  opacity: dynamicStyle.opacity 
                }
              ]}
            >
              <Text style={[styles.optionText, { color: dynamicStyle.color }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TFRenderer({ question, onAnswer }: { question: TrueFalseQuestion; onAnswer: (c: boolean) => void }) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (val: boolean) => {
    if (revealed) return;
    setSelected(val);
    setRevealed(true);
    setTimeout(() => onAnswer(val === question.correctAnswer), 800);
  };

  const getBtnStyle = (val: boolean) => {
    if (!revealed) return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 1 };
    if (val === question.correctAnswer) return { borderColor: colors.success, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: colors.success, opacity: 1 };
    if (val === selected) return { borderColor: colors.destructive, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: colors.destructive, opacity: 1 };
    return { borderColor: colors.border, backgroundColor: colors.transparent, color: colors.foreground, opacity: 0.5 };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.questionText}</Text>
      <View style={styles.tfGrid}>
        {[true, false].map(val => {
          const dynamicStyle = getBtnStyle(val);
          return (
            <TouchableOpacity
              key={String(val)}
              activeOpacity={0.7}
              onPress={() => handleSelect(val)}
              style={[
                styles.optionButton, 
                styles.tfButton,
                { 
                  borderColor: dynamicStyle.borderColor, 
                  backgroundColor: dynamicStyle.backgroundColor,
                  opacity: dynamicStyle.opacity
                }
              ]}
            >
              <Text style={[styles.tfText, { color: dynamicStyle.color }]}>
                {val ? 'True' : 'False'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FBRenderer({ question, onAnswer }: { question: FillBlankQuestion; onAnswer: (c: boolean) => void }) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();

  const handleSubmit = () => {
    if (revealed || !answer.trim()) return;
    setRevealed(true);
    setTimeout(() => onAnswer(isCorrect), 800);
  };

  // Split text at ___
  const parts = question.questionText.split('___');

  // Determine input styling
  let inputColor = colors.primary;
  let inputBorder = colors.primary;
  if (revealed) {
    inputColor = isCorrect ? colors.success : colors.destructive;
    inputBorder = isCorrect ? colors.success : colors.destructive;
  }

  return (
    <View style={styles.container}>
      
      {/* Inline Text & Input Simulation */}
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
          style={[
            styles.fbInput, 
            { color: inputColor, borderBottomColor: inputBorder }
          ]}
        />
        <Text style={styles.questionText}>{parts[1]}</Text>
      </View>

      {revealed && !isCorrect && (
        <Text style={styles.correctAnswerText}>Correct answer: {question.correctAnswer}</Text>
      )}

      {question.hint && !revealed && (
        <TouchableOpacity onPress={() => setShowHint(!showHint)} style={styles.hintButton}>
          <Text style={styles.hintText}>
            💡 {showHint ? question.hint : 'Show hint'}
          </Text>
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
    </View>
  );
}

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
  
  // Options (Multiple Choice & True/False)
  optionsList: {
    gap: 8, // Requires React Native 0.71+
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
    flex: 1, // Makes the True and False buttons take equal width side-by-side
    alignItems: 'center',
  },
  tfText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Fill in the Blank
  fbSentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allows the sentence to wrap to the next line naturally
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

export default QuizRenderer;