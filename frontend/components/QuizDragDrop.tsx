import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import type { DragDropQuestion } from '../lib/types';

interface QuizDragDropProps {
  question: DragDropQuestion;
  onAnswer: (correct: boolean) => void;
}

export default function QuizDragDrop({ question, onAnswer }: QuizDragDropProps) {
  // Initialize items with their original index so we can check the order later
  const [items, setItems] = useState(
    question.items.map((item, i) => ({ id: `item-${i}`, text: item, originalIndex: i }))
  );
  const [revealed, setRevealed] = useState(false);

  // Mobile-friendly sorting function using Up/Down arrows
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) {
      return; // Can't move up if at top, can't move down if at bottom
    }

    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the items
    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    setItems(newItems);
  };

  const checkOrder = () => {
    const currentOrder = items.map(i => i.originalIndex);
    const correct = JSON.stringify(currentOrder) === JSON.stringify(question.correctOrder);
    setRevealed(true);
    
    // Wait a second before moving to the next question
    setTimeout(() => onAnswer(correct), 1200);
  };

  const isCorrect = JSON.stringify(items.map(i => i.originalIndex)) === JSON.stringify(question.correctOrder);

  return (
    <View className="gap-4">
      <Text className="text-base font-semibold text-foreground mb-2">
        {question.instruction}
      </Text>
      
      <View className="gap-2 mb-4">
        {items.map((item, index) => (
          <View 
            key={item.id} 
            className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 flex-row items-center justify-between"
          >
            <Text className="text-sm font-medium text-foreground flex-1 pr-4">
              {item.text}
            </Text>
            
            {/* Control Arrows */}
            {!revealed && (
              <View className="flex-row gap-2">
                <Pressable 
                  onPress={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className={`p-2 rounded-lg ${index === 0 ? 'opacity-30' : 'bg-gray-200 dark:bg-gray-700 active:bg-gray-300'}`}
                >
                  <ArrowUp size={16} color="#4b5563" />
                </Pressable>
                
                <Pressable 
                  onPress={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className={`p-2 rounded-lg ${index === items.length - 1 ? 'opacity-30' : 'bg-gray-200 dark:bg-gray-700 active:bg-gray-300'}`}
                >
                  <ArrowDown size={16} color="#4b5563" />
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>

      {!revealed && (
        <Pressable 
          onPress={checkOrder} 
          className="w-full py-4 rounded-xl bg-blue-500 items-center"
        >
          <Text className="text-white font-semibold text-lg">Check Order</Text>
        </Pressable>
      )}

      {revealed && (
        <View className={`py-3 rounded-xl items-center ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          <Text className={`text-sm font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite right'}
          </Text>
        </View>
      )}
    </View>
  );
}