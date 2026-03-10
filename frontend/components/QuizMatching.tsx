import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { MatchingQuestion } from '../lib/types';

interface QuizMatchingProps {
  question: MatchingQuestion;
  onAnswer: (correct: boolean) => void;
}

export default function QuizMatching({ question, onAnswer }: QuizMatchingProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Map<number, number>>(new Map());
  const [revealed, setRevealed] = useState(false);

  const handleRightClick = (rightIdx: number) => {
    if (revealed || selectedLeft === null) return;
    const newPairs = new Map(pairs);
    
    // Remove any existing pair using this right item
    for (const [k, v] of newPairs) {
      if (v === rightIdx) newPairs.delete(k);
    }
    
    newPairs.set(selectedLeft, rightIdx);
    setPairs(newPairs);
    setSelectedLeft(null);
  };

  const checkAnswer = () => {
    if (pairs.size !== question.leftItems.length) return;
    const correct = question.correctPairs.every((rightIdx, leftIdx) => pairs.get(leftIdx) === rightIdx);
    setRevealed(true);
    setTimeout(() => onAnswer(correct), 1200); // Gives them a second to see the right/wrong colors
  };

  const isRightUsed = (idx: number) => Array.from(pairs.values()).includes(idx);
  const getPairedRight = (leftIdx: number) => pairs.get(leftIdx);

  return (
    <View className="gap-4">
      <Text className="text-base font-semibold text-foreground mb-4">{question.instruction}</Text>
      
      {/* Two Columns using Flexbox instead of Grid */}
      <View className="flex-row gap-3 mb-4">
        
        {/* Left Column */}
        <View className="flex-1 gap-2">
          {question.leftItems.map((item, i) => {
            const paired = getPairedRight(i);
            
            // Determine styling based on state
            let borderClass = 'border-gray-200 dark:border-gray-700';
            let bgClass = 'bg-transparent';
            let textClass = 'text-foreground';
            let pairTextClass = 'text-gray-500';

            if (selectedLeft === i) {
              borderClass = 'border-blue-500';
              bgClass = 'bg-blue-50 dark:bg-blue-900/20';
              textClass = 'text-blue-700 dark:text-blue-400';
            } else if (paired !== undefined) {
              if (revealed) {
                if (question.correctPairs[i] === paired) {
                  borderClass = 'border-green-500';
                  bgClass = 'bg-green-50 dark:bg-green-900/20';
                  textClass = 'text-green-700 dark:text-green-400';
                  pairTextClass = 'text-green-600 dark:text-green-500';
                } else {
                  borderClass = 'border-red-500';
                  bgClass = 'bg-red-50 dark:bg-red-900/20';
                  textClass = 'text-red-700 dark:text-red-400';
                  pairTextClass = 'text-red-600 dark:text-red-500';
                }
              } else {
                borderClass = 'border-blue-300 dark:border-blue-700';
                bgClass = 'bg-blue-50/50 dark:bg-blue-900/10';
              }
            }

            return (
              <Pressable
                key={i}
                onPress={() => !revealed && setSelectedLeft(i)}
                className={`w-full p-3 rounded-xl border-2 ${borderClass} ${bgClass}`}
              >
                <Text className={`text-sm font-medium ${textClass}`}>{item}</Text>
                {paired !== undefined && (
                  <Text className={`text-xs mt-1 ${pairTextClass}`}>
                    → {question.rightItems[paired]}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Right Column */}
        <View className="flex-1 gap-2">
          {question.rightItems.map((item, i) => {
            const used = isRightUsed(i);
            
            let borderClass = 'border-gray-200 dark:border-gray-700';
            let bgClass = 'bg-transparent';
            let opacityClass = 'opacity-100';

            if (used) {
              borderClass = 'border-blue-300 dark:border-blue-700';
              bgClass = 'bg-blue-50/50 dark:bg-blue-900/10';
              opacityClass = 'opacity-60';
            } else if (selectedLeft === null) {
              opacityClass = 'opacity-60';
            }

            return (
              <Pressable
                key={i}
                onPress={() => handleRightClick(i)}
                disabled={revealed || selectedLeft === null}
                className={`w-full p-3 rounded-xl border-2 ${borderClass} ${bgClass} ${opacityClass}`}
              >
                <Text className="text-sm font-medium text-foreground">{item}</Text>
              </Pressable>
            );
          })}
        </View>
        
      </View>

      {/* Confirm Button */}
      {!revealed && (
        <Pressable
          onPress={checkAnswer}
          disabled={pairs.size !== question.leftItems.length}
          className={`w-full py-4 rounded-xl items-center ${
            pairs.size === question.leftItems.length ? 'bg-blue-500' : 'bg-blue-500/50'
          }`}
        >
          <Text className="text-white font-semibold text-lg">Confirm Matches</Text>
        </Pressable>
      )}
    </View>
  );
}