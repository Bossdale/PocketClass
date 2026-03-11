import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, BookOpen } from 'lucide-react-native';
import type { DiagnosticResult } from '@/lib/types';

interface DiagnosticResultCardProps {
  result: DiagnosticResult;
}

// Define our base theme colors to match your web version
const colors = {
  primary: '#2563eb',       // Blue
  success: '#16a34a',       // Green
  warning: '#f59e0b',       // Amber/Yellow
  destructive: '#dc2626',   // Red
  foreground: '#0f172a',    // Dark Slate
  mutedForeground: '#64748b',// Light Slate
  background: '#ffffff',
  border: '#e2e8f0',
};

const DiagnosticResultCard: React.FC<DiagnosticResultCardProps> = ({ result }) => {
  const scores = [result.q1Score, result.q2Score, result.q3Score, result.q4Score];
  const overall = result.overallScore;
  const weakQuarters = scores
    .map((s, i) => ({ quarter: i + 1, score: s }))
    .filter(q => q.score < 60);

  // Replaced Tailwind dynamic classes with React Native style objects
  const getScoreStyle = (score: number) => {
    if (score >= 80) return { 
      borderColor: 'rgba(22, 163, 74, 0.3)', 
      backgroundColor: 'rgba(22, 163, 74, 0.1)', 
      textColor: colors.success 
    };
    if (score >= 60) return { 
      borderColor: 'rgba(37, 99, 235, 0.3)', 
      backgroundColor: 'rgba(37, 99, 235, 0.1)', 
      textColor: colors.primary 
    };
    if (score >= 40) return { 
      borderColor: 'rgba(245, 158, 11, 0.3)', 
      backgroundColor: 'rgba(245, 158, 11, 0.1)', 
      textColor: colors.warning 
    };
    return { 
      borderColor: 'rgba(220, 38, 38, 0.3)', 
      backgroundColor: 'rgba(220, 38, 38, 0.1)', 
      textColor: colors.destructive 
    };
  };

  const getDotColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.destructive;
  };

  const getEmoji = () => {
    if (overall >= 70) return { emoji: '🎉', text: 'Great Job!', bgColor: 'rgba(22, 163, 74, 0.2)' };
    if (overall >= 40) return { emoji: '📖', text: 'Good Start!', bgColor: 'rgba(245, 158, 11, 0.2)' };
    return { emoji: '🚀', text: "Let's Learn!", bgColor: 'rgba(37, 99, 235, 0.2)' };
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
    <View style={styles.container}>
      
      {/* Score Header */}
      <View style={styles.headerCard}>
        <View style={[styles.emojiCircle, { backgroundColor: info.bgColor }]}>
          <Text style={styles.emojiText}>{info.emoji}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{info.text}</Text>
        <Text style={styles.headerScore}>{overall}%</Text>
        <Text style={styles.headerLabel}>Overall Score</Text>
      </View>

      {/* Quarter Scores Grid (Flexbox implementation) */}
      <View style={styles.gridContainer}>
        {scores.map((score, i) => {
          const dynamicStyles = getScoreStyle(score);
          return (
            <View 
              key={i} 
              style={[
                styles.quarterCard, 
                { 
                  borderColor: dynamicStyles.borderColor, 
                  backgroundColor: dynamicStyles.backgroundColor 
                }
              ]}
            >
              <Text style={styles.quarterLabel}>Q{i + 1}</Text>
              <Text style={[styles.quarterScore, { color: dynamicStyles.textColor }]}>
                {score}%
              </Text>
              <View style={[styles.dot, { backgroundColor: getDotColor(score) }]} />
            </View>
          );
        })}
      </View>

      {/* Weak Quarters */}
      {weakQuarters.length > 0 && (
        <View style={styles.weakQuartersContainer}>
          {weakQuarters.map(q => (
            <View key={q.quarter} style={styles.weakPill}>
              <AlertTriangle size={12} color={colors.warning} />
              <Text style={styles.weakPillText}>
                Q{q.quarter} needs work
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Study Plan */}
      <View style={styles.studyPlanCard}>
        <View style={styles.studyPlanHeader}>
          <BookOpen size={16} color={colors.primary} />
          <Text style={styles.studyPlanTitle}>📋 Study Plan</Text>
        </View>
        <Text style={styles.studyPlanText}>{getStudyPlan()}</Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16, // Requires React Native 0.71+, replaces space-y-4
  },
  
  // Header Card
  headerCard: {
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiText: {
    fontSize: 28,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  headerScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Grid (using Flexbox)
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quarterCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  quarterLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  quarterScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },

  // Weak Quarters Pill
  weakQuartersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // warning/20
    borderColor: 'rgba(245, 158, 11, 0.3)', // warning/30
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  weakPillText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },

  // Study Plan Card
  studyPlanCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  studyPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  studyPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  studyPlanText: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});

export default DiagnosticResultCard;