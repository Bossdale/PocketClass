import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withTiming, 
  Easing, 
  withRepeat, 
  withSequence 
} from 'react-native-reanimated';

import ProgressRing from './ProgressRing';
import type { Subject, SubjectProgress } from '@/lib/types';

interface SubjectTileProps {
  subject: Subject;
  progress: SubjectProgress;
  index: number;
}

// Wrap TouchableOpacity to allow Reanimated styles
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const colors = {
  primary: '#2563eb',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  background: '#ffffff',
  border: '#e2e8f0',
};

const SubjectTile: React.FC<SubjectTileProps> = ({ subject, progress, index }) => {
  const router = useRouter();

  // --- Entrance Animation (Fade In & Slide Up) ---
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Staggered animation based on the item's index (index * 100ms)
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      index * 100, 
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // --- Button Pulse Animation ---
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    if (!progress.diagnosticCompleted) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.7, { duration: 1000 })
        ),
        -1, // Infinite loop
        true // Reverse direction
      );
    }
  }, [progress.diagnosticCompleted]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

 // --- Handlers ---
  const handleClick = () => {
    if (progress.diagnosticCompleted) {
      // Change from /subject/${id} to /SubjectView?subjectId=${id}
      router.push({
        pathname: "/SubjectView",
        params: { subjectId: subject.id }
      });
    }
  };

  const handleDiagnostic = () => {
    // Change from /diagnostic/${id} to /DiagnosticTest?subjectId=${id}
    router.push({
      pathname: "/DiagnosticTest",
      params: { subjectId: subject.id }
    });
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPress={handleClick}
      style={[styles.card, entranceStyle]}
    >
      {/* Progress Ring wrapping the Emoji */}
      <ProgressRing progress={progress.masteryScore} size={72} strokeWidth={5}>
        <Text style={styles.emoji}>{subject.emoji}</Text>
      </ProgressRing>

      {/* Text Info */}
      <Text style={styles.subjectName}>{subject.name}</Text>
      <Text style={styles.lessonCount}>
        {progress.lessonsCompleted}/{progress.totalLessons} lessons
      </Text>

      {/* Diagnostic Button (Only shows if not completed) */}
      {!progress.diagnosticCompleted && (
        <Animated.View style={[styles.buttonWrapper, pulseStyle]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDiagnostic}
            style={styles.diagnosticButton}
          >
            <Text style={styles.diagnosticButtonText}>Take Diagnostic</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12, // Requires RN 0.71+
    
    // Glass/Solid Card styling equivalent
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3, // For Android shadow
  },
  emoji: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  lessonCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  
  // Diagnostic Button
  buttonWrapper: {
    width: '100%',
    marginTop: 4,
  },
  diagnosticButton: {
    width: '100%',
    backgroundColor: 'rgba(37, 99, 235, 0.2)', // primary/20
    borderColor: 'rgba(37, 99, 235, 0.3)',     // border-primary/30
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SubjectTile;