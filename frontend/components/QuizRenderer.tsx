import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import type { QuizQuestion, MultipleChoiceQuestion, TrueFalseQuestion, FillBlankQuestion } from '../lib/types';
import QuizDragDrop from './QuizDragDrop';
import QuizMatching from './QuizMatching';

interface QuizRendererProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
}

export default function QuizRenderer({ question, onAnswer }: QuizRendererProps) {
  switch (question.type) {
    case 'multiple_choice':
      return <MCRenderer question={question as MultipleChoiceQuestion} onAnswer={onAnswer} />;
    case 'true_false':
      return <TFRenderer question={question as TrueFalseQuestion} onAnswer={onAnswer} />;
    case 'fill_blank':
      return <FBRenderer question={question as FillBlankQuestion} onAnswer={onAnswer} />;
    case 'drag_drop':
      return <QuizDragDrop question={question} onAnswer={onAnswer} />;
    case 'matching':
      return <QuizMatching question={question} onAnswer={onAnswer} />;
    default:
      return null;
  }
}

// --- SUB-COMPONENTS --- //

function MCRenderer({ question, onAnswer }: { question: MultipleChoiceQuestion; onAnswer: (c: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === question.correctOption;
    setTimeout(() => onAnswer(correct), 1200);
  };

  const getOptionStyles = (idx: number) => {
    if (!revealed) return { border: 'border-gray-200 dark:border-gray-700', bg: 'bg-transparent', text: 'text-foreground' };
    if (idx === question.correctOption) return { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
    if (idx === selected) return { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' };
    return { border: 'border-gray-200 dark:border-gray-700', bg: 'bg-transparent', text: 'text-gray-400' };
  };

  return (
    <View>
      <Text className="text-base font-semibold text-foreground mb-4">{question.questionText}</Text>
      <View className="gap-3">
        {question.options.map((opt, i) => {
          const styles = getOptionStyles(i);
          return (
            <Pressable
              key={i}
              onPress={() => handleSelect(i)}
              className={`w-full p-4 rounded-xl border-2 ${styles.border} ${styles.bg}`}
            >
              <Text className={`text-sm ${styles.text}`}>{opt}</Text>
            </Pressable>
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
    setTimeout(() => onAnswer(val === question.correctAnswer), 1200);
  };

  const getBtnStyles = (val: boolean) => {
    if (!revealed) return { border: 'border-gray-200 dark:border-gray-700', bg: 'bg-transparent', text: 'text-foreground' };
    if (val === question.correctAnswer) return { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
    if (val === selected) return { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' };
    return { border: 'border-gray-200 dark:border-gray-700', bg: 'bg-transparent', text: 'text-gray-400' };
  };

  return (
    <View>
      <Text className="text-base font-semibold text-foreground mb-4">{question.questionText}</Text>
      <View className="flex-row gap-3">
        {[true, false].map(val => {
          const styles = getBtnStyles(val);
          return (
            <Pressable
              key={String(val)}
              onPress={() => handleSelect(val)}
              className={`flex-1 p-4 rounded-xl border-2 items-center justify-center ${styles.border} ${styles.bg}`}
            >
              <Text className={`text-sm font-medium ${styles.text}`}>
                {val ? 'True' : 'False'}
              </Text>
            </Pressable>
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
    setTimeout(() => onAnswer(isCorrect), 1200);
  };

  // Split text at ___
  const parts = question.questionText.split('___');

  return (
    <View>
      <View className="flex-row flex-wrap items-center mb-6">
        {parts[0] ? <Text className="text-base font-semibold text-foreground">{parts[0]}</Text> : null}
        
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          editable={!revealed}
          placeholder="..."
          placeholderTextColor="#9ca3af"
          className={`border-b-2 w-32 px-2 pb-1 mx-2 text-center text-base font-medium ${
            revealed 
              ? (isCorrect ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-red-500 text-red-600 dark:text-red-400') 
              : 'border-blue-500 text-blue-600 dark:text-blue-400'
          }`}
          onSubmitEditing={handleSubmit}
        />
        
        {parts[1] ? <Text className="text-base font-semibold text-foreground">{parts[1]}</Text> : null}
      </View>

      {revealed && !isCorrect && (
        <Text className="text-sm text-green-600 dark:text-green-400 mb-4 font-medium">
          Correct answer: {question.correctAnswer}
        </Text>
      )}

      {question.hint && !revealed && (
        <Pressable onPress={() => setShowHint(!showHint)} className="mb-4">
          <Text className="text-sm text-blue-500">
            💡 {showHint ? question.hint : 'Show hint'}
          </Text>
        </Pressable>
      )}

      {!revealed && (
        <Pressable
          onPress={handleSubmit}
          disabled={!answer.trim()}
          className={`w-full py-4 rounded-xl items-center mt-2 ${
            answer.trim() ? 'bg-blue-500' : 'bg-blue-500/50'
          }`}
        >
          <Text className="text-white font-semibold text-lg">Submit</Text>
        </Pressable>
      )}
    </View>
  );
}