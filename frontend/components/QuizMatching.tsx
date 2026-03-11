import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { MatchingQuestion } from '../lib/types';

interface QuizMatchingProps {
  question: MatchingQuestion;
  onAnswer: (correct: boolean) => void;
}

// Color palette extracted from your Tailwind classes
const colors = {
  foreground: '#0f172a',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  blue500: '#3b82f6',
  blue300: '#93c5fd',
  blue50: '#eff6ff',
  blue700: '#1d4ed8',
  green500: '#22c55e',
  green50: '#f0fdf4',
  green700: '#15803d',
  green600: '#16a34a',
  red500: '#ef4444',
  red50: '#fef2f2',
  red700: '#b91c1c',
  red600: '#dc2626',
  transparent: 'transparent',
  white: '#ffffff',
};

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

  // Helper to determine styles for Left Column items
  const getLeftItemStyle = (index: number, paired?: number) => {
    if (selectedLeft === index) {
      return { 
        borderColor: colors.blue500, 
        backgroundColor: colors.blue50, 
        textColor: colors.blue700,
        pairTextColor: colors.gray500 
      };
    }
    if (paired !== undefined) {
      if (revealed) {
        if (question.correctPairs[index] === paired) {
          return { 
            borderColor: colors.green500, 
            backgroundColor: colors.green50, 
            textColor: colors.green700, 
            pairTextColor: colors.green600 
          };
        } else {
          return { 
            borderColor: colors.red500, 
            backgroundColor: colors.red50, 
            textColor: colors.red700, 
            pairTextColor: colors.red600 
          };
        }
      } else {
        return { 
          borderColor: colors.blue300, 
          backgroundColor: 'rgba(239, 246, 255, 0.5)', // blue-50/50
          textColor: colors.foreground,
          pairTextColor: colors.gray500
        };
      }
    }
    return { 
      borderColor: colors.gray200, 
      backgroundColor: colors.transparent, 
      textColor: colors.foreground,
      pairTextColor: colors.gray500
    };
  };

  // Helper to determine styles for Right Column items
  const getRightItemStyle = (index: number, used: boolean) => {
    if (used) {
      return { 
        borderColor: colors.blue300, 
        backgroundColor: 'rgba(239, 246, 255, 0.5)', // blue-50/50
        opacity: 0.6 
      };
    }
    if (selectedLeft === null) {
      return { 
        borderColor: colors.gray200, 
        backgroundColor: colors.transparent, 
        opacity: 0.6 
      };
    }
    return { 
      borderColor: colors.gray200, 
      backgroundColor: colors.transparent, 
      opacity: 1 
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>{question.instruction}</Text>
      
      {/* Two Columns */}
      <View style={styles.columnsContainer}>
        
        {/* Left Column */}
        <View style={styles.column}>
          {question.leftItems.map((item, i) => {
            const paired = getPairedRight(i);
            const dynamicStyles = getLeftItemStyle(i, paired);

            return (
              <Pressable
                key={i}
                onPress={() => !revealed && setSelectedLeft(i)}
                style={[
                  styles.itemBase, 
                  { 
                    borderColor: dynamicStyles.borderColor, 
                    backgroundColor: dynamicStyles.backgroundColor 
                  }
                ]}
              >
                <Text style={[styles.itemText, { color: dynamicStyles.textColor }]}>
                  {item}
                </Text>
                {paired !== undefined && (
                  <Text style={[styles.pairText, { color: dynamicStyles.pairTextColor }]}>
                    → {question.rightItems[paired]}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          {question.rightItems.map((item, i) => {
            const used = isRightUsed(i);
            const dynamicStyles = getRightItemStyle(i, used);

            return (
              <Pressable
                key={i}
                onPress={() => handleRightClick(i)}
                disabled={revealed || selectedLeft === null}
                style={[
                  styles.itemBase, 
                  { 
                    borderColor: dynamicStyles.borderColor, 
                    backgroundColor: dynamicStyles.backgroundColor,
                    opacity: dynamicStyles.opacity
                  }
                ]}
              >
                <Text style={styles.itemText}>{item}</Text>
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
          style={[
            styles.confirmButton,
            { 
              backgroundColor: pairs.size === question.leftItems.length 
                ? colors.blue500 
                : 'rgba(59, 130, 246, 0.5)' // blue-500/50
            }
          ]}
        >
          <Text style={styles.confirmButtonText}>Confirm Matches</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  itemBase: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  pairText: {
    fontSize: 12,
    marginTop: 4,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 18,
  },
});