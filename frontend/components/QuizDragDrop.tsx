import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

// Assuming this is your local import
import type { DragDropQuestion } from '@/lib/types';

interface QuizDragDropProps {
  question: DragDropQuestion;
  onAnswer: (correct: boolean) => void;
}

// Define our local Item type based on how we structure it in state
type ListItem = {
  id: string;
  text: string;
  originalIndex: number;
};

// Theme colors to match your web version
const colors = {
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  accent: '#f1f5f9',
  foreground: '#0f172a',
  border: '#e2e8f0',
  success: '#16a34a',
  destructive: '#dc2626',
};

const QuizDragDrop: React.FC<QuizDragDropProps> = ({ question, onAnswer }) => {
  const [items, setItems] = useState<ListItem[]>(
    question.items.map((item, i) => ({ id: `item-${i}`, text: item, originalIndex: i }))
  );
  const [revealed, setRevealed] = useState(false);

  const checkOrder = () => {
    const currentOrder = items.map(i => i.originalIndex);
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(question.correctOrder);
    
    setRevealed(true);
    setTimeout(() => onAnswer(isCorrect), 800);
  };

  const isCurrentlyCorrect = JSON.stringify(items.map(i => i.originalIndex)) === JSON.stringify(question.correctOrder);

  // Render function for the Draggable FlatList
  const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    return (
      // ScaleDecorator adds the "pop out" effect when dragging (like your web scale-105)
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag} // Drag starts when user long-presses the item
          disabled={revealed} // Disable dragging after checking answer
          style={[
            styles.sortableItem,
            isActive && styles.sortableItemActive,
          ]}
        >
          <Text style={styles.itemText}>{item.text}</Text>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>{question.instruction}</Text>
      
      {/* We use a wrapper View with a specific height or flex:1 
        so the FlatList has room to scroll and drag 
      */}
      <View style={styles.listContainer}>
        <DraggableFlatList
          data={items}
          onDragEnd={({ data }) => setItems(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          // containerStyle adds the space between items (like web space-y-2)
          contentContainerStyle={styles.flatListContent}
        />
      </View>

      {!revealed ? (
        <TouchableOpacity style={styles.checkButton} onPress={checkOrder}>
          <Text style={styles.checkButtonText}>Check Order</Text>
        </TouchableOpacity>
      ) : (
        <Text 
          style={[
            styles.feedbackText, 
            { color: isCurrentlyCorrect ? colors.success : colors.destructive }
          ]}
        >
          {isCurrentlyCorrect ? '✓ Correct!' : '✗ Not quite right'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the container can grow to fit the Draggable list
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  listContainer: {
    // If this list is inside a ScrollView, you might need a fixed height here
    // e.g., height: 300, depending on your parent layout.
    marginBottom: 16,
  },
  flatListContent: {
    gap: 8, // Requires React Native 0.71+ (replaces space-y-2)
    paddingBottom: 8, 
  },
  sortableItem: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortableItemActive: {
    // Styling applied when the item is picked up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  checkButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 16,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default QuizDragDrop;