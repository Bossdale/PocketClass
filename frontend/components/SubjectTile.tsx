import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressRing from './ProgressRing';
import type { Subject, SubjectProgress } from '../lib/types';

interface SubjectTileProps {
  subject: Subject;
  progress: SubjectProgress;
  index: number;
}

export default function SubjectTile({ subject, progress, index }: SubjectTileProps) {
  const router = useRouter();

  const handlePress = () => {
    // Only navigate to the subject view if they've finished the diagnostic test
    if (progress.diagnosticCompleted) {
      router.push(`/subject-view?subjectId=${subject.id}`);
    }
  };

  const handleDiagnostic = () => {
    // In React Native, nested Pressables handle their own events natively, 
    // so we don't need a strict e.stopPropagation() like on the web!
    router.push(`/diagnostic-test?subjectId=${subject.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`bg-white dark:bg-gray-800 p-4 rounded-2xl items-center shadow-sm border border-gray-100 dark:border-gray-800 ${
        !progress.diagnosticCompleted ? 'opacity-90' : ''
      }`}
    >
      <View className="mb-3">
        <ProgressRing progress={progress.masteryScore} size={72} strokeWidth={5}>
          <Text className="text-3xl">{subject.emoji}</Text>
        </ProgressRing>
      </View>
      
      <Text className="text-sm font-semibold text-foreground text-center" numberOfLines={1}>
        {subject.name}
      </Text>
      
      <Text className="text-xs text-gray-500 mt-1">
        {progress.lessonsCompleted}/{progress.totalLessons} lessons
      </Text>
      
      {!progress.diagnosticCompleted && (
        <Pressable
          onPress={handleDiagnostic}
          className="w-full mt-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 rounded-lg py-2 items-center active:bg-blue-200 dark:active:bg-blue-900/50"
        >
          <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Take Diagnostic
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}