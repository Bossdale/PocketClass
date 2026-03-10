import { View, Text } from 'react-native';
import { AlertTriangle, BookOpen } from 'lucide-react-native';
import type { DiagnosticResult } from '../lib/types';

interface DiagnosticResultCardProps {
  result: DiagnosticResult;
}

export default function DiagnosticResultCard({ result }: DiagnosticResultCardProps) {
  const scores = [result.q1Score, result.q2Score, result.q3Score, result.q4Score];
  const overall = result.overallScore;
  const weakQuarters = scores.map((s, i) => ({ quarter: i + 1, score: s })).filter(q => q.score < 60);

  // Split out styles so we can apply text colors directly to <Text> components
  const getScoreStyles = (score: number) => {
    if (score >= 80) return { border: 'border-green-500/30', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
    if (score >= 60) return { border: 'border-blue-500/30', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
    if (score >= 40) return { border: 'border-yellow-500/30', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' };
    return { border: 'border-red-500/30', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
  };

  const getEmoji = () => {
    if (overall >= 70) return { emoji: '🎉', text: 'Great Job!', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (overall >= 40) return { emoji: '📖', text: 'Good Start!', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { emoji: '🚀', text: "Let's Learn!", bg: 'bg-blue-100 dark:bg-blue-900/30' };
  };

  const getStudyPlan = () => {
    const weakest = scores.indexOf(Math.min(...scores)) + 1;
    if (overall >= 80) return 'Excellent foundation! Focus on advanced topics and challenge yourself with harder problems.';
    if (overall >= 60) return `Good progress! Consider reviewing Quarter ${weakest} to strengthen your understanding.`;
    if (overall >= 40) return `Start with Quarter ${weakest} fundamentals and build up from there.`;
    return 'Begin with Quarter 1 basics and take it one step at a time. You\'ve got this!';
  };

  const info = getEmoji();

  return (
    <View className="gap-4">
      {/* Score Header */}
      <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm items-center border border-gray-100 dark:border-gray-800">
        <View className={`w-16 h-16 rounded-full ${info.bg} items-center justify-center mb-3`}>
          <Text className="text-2xl">{info.emoji}</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground mb-1">{info.text}</Text>
        <Text className="text-3xl font-bold text-blue-500">{overall}%</Text>
        <Text className="text-xs text-gray-500 uppercase tracking-wider mt-1">Overall Score</Text>
      </View>

      {/* Quarter Scores Grid */}
      <View className="flex-row justify-between gap-2">
        {scores.map((score, i) => {
          const styles = getScoreStyles(score);
          return (
            <View key={i} className={`flex-1 p-3 items-center rounded-xl border-2 ${styles.bg} ${styles.border}`}>
              <Text className="text-xs text-gray-500 mb-1">Q{i + 1}</Text>
              <Text className={`text-lg font-bold ${styles.text}`}>{score}%</Text>
              <View className={`w-2 h-2 rounded-full mt-2 ${styles.dot}`} />
            </View>
          );
        })}
      </View>

      {/* Weak Quarters */}
      {weakQuarters.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {weakQuarters.map(q => (
            <View key={q.quarter} className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-900/50 rounded-full px-3 py-1 flex-row items-center gap-1">
              <AlertTriangle size={12} color="#eab308" />
              <Text className="text-xs text-yellow-700 dark:text-yellow-500 font-medium">
                Q{q.quarter} needs work
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Study Plan */}
      <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-2 mb-2">
          <BookOpen size={16} color="#3b82f6" />
          <Text className="text-sm font-semibold text-foreground">📋 Study Plan</Text>
        </View>
        <Text className="text-sm text-gray-500 leading-relaxed">{getStudyPlan()}</Text>
      </View>
    </View>
  );
}