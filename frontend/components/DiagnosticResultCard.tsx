import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react-native';
import type { DiagnosticResult, StudyPlan } from '@/lib/types';

interface DiagnosticResultCardProps {
  result: DiagnosticResult;
  studyPlan?: StudyPlan | null;
}

const colors = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  successLight: '#dcfce7',
  successDark: '#15803d',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#b45309',
  destructive: '#dc2626',
  destructiveLight: '#fee2e2',
  destructiveDark: '#b91c1c',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  background: '#ffffff',
  border: '#e2e8f0',
  gray50: '#f8fafc',
};

const DiagnosticResultCard: React.FC<DiagnosticResultCardProps> = ({ result, studyPlan }) => {
  const [expandedQuarter, setExpandedQuarter] = useState<number | null>(null);

  const scores = [result.q1Score, result.q2Score, result.q3Score, result.q4Score];
  const overall = result.overallScore;
  const weakQuarters = scores
    .map((s, i) => ({ quarter: i + 1, score: s }))
    .filter(q => q.score < 60);

  const getScoreStyle = (score: number) => {
    if (score >= 80) return {
      borderColor: 'rgba(22, 163, 74, 0.3)',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      textColor: colors.success,
    };
    if (score >= 60) return {
      borderColor: 'rgba(37, 99, 235, 0.3)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      textColor: colors.primary,
    };
    if (score >= 40) return {
      borderColor: 'rgba(245, 158, 11, 0.3)',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      textColor: colors.warning,
    };
    return {
      borderColor: 'rgba(220, 38, 38, 0.3)',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      textColor: colors.destructive,
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

  // Fallback summary used only when AI study plan is not available
  const getFallbackSummary = () => {
    const weakest = scores.indexOf(Math.min(...scores)) + 1;
    if (overall >= 80) return 'Excellent foundation! Focus on advanced topics and challenge yourself with harder problems.';
    if (overall >= 60) return `Good progress! Consider reviewing Quarter ${weakest} to strengthen your understanding.`;
    if (overall >= 40) return `Start with Quarter ${weakest} fundamentals and build up from there.`;
    return "Begin with Quarter 1 basics and take it one step at a time. You've got this!";
  };

  const quarterKeys = ['quarter1', 'quarter2', 'quarter3', 'quarter4'] as const;

  const info = getEmoji();

  return (
    <View style={styles.container}>

      {/* ── Score Header ──────────────────────────────────────────────────── */}
      <View style={styles.headerCard}>
        <View style={[styles.emojiCircle, { backgroundColor: info.bgColor }]}>
          <Text style={styles.emojiText}>{info.emoji}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{info.text}</Text>
        <Text style={styles.headerScore}>{overall}%</Text>
        <Text style={styles.headerLabel}>Overall Score</Text>
      </View>

      {/* ── Quarter Scores Grid ───────────────────────────────────────────── */}
      <View style={styles.gridContainer}>
        {scores.map((score, i) => {
          const s = getScoreStyle(score);
          return (
            <View
              key={i}
              style={[styles.quarterCard, { borderColor: s.borderColor, backgroundColor: s.backgroundColor }]}
            >
              <Text style={styles.quarterLabel}>Q{i + 1}</Text>
              <Text style={[styles.quarterScore, { color: s.textColor }]}>{score}%</Text>
              <View style={[styles.dot, { backgroundColor: getDotColor(score) }]} />
            </View>
          );
        })}
      </View>

      {/* ── Weak Quarter Pills ────────────────────────────────────────────── */}
      {weakQuarters.length > 0 && (
        <View style={styles.weakQuartersContainer}>
          {weakQuarters.map(q => (
            <View key={q.quarter} style={styles.weakPill}>
              <AlertTriangle size={12} color={colors.warning} />
              <Text style={styles.weakPillText}>Q{q.quarter} needs work</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── AI Study Plan (per quarter) ───────────────────────────────────── */}
      <View style={styles.studyPlanCard}>
        <View style={styles.studyPlanHeader}>
          <BookOpen size={16} color={colors.primary} />
          <Text style={styles.studyPlanTitle}>📋 Your Personalized Study Plan</Text>
        </View>

        {studyPlan ? (
          // AI-generated plan — one collapsible row per quarter
          <View style={styles.quarterPlanList}>
            {quarterKeys.map((key, i) => {
              const qPlan = (studyPlan as any)[key];
              const qScore = scores[i];
              const isExpanded = expandedQuarter === i + 1;
              const needsReview = qPlan.is_need_review;

              const pillBg  = needsReview ? colors.warningLight  : colors.successLight;
              const pillText= needsReview ? colors.warningDark   : colors.successDark;
              const pillLabel = needsReview ? '⚠️ Needs Review'  : '✅ On Track';

              return (
                <View key={key} style={styles.quarterPlanRow}>
                  {/* Row Header — always visible */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.quarterPlanRowHeader}
                    onPress={() => setExpandedQuarter(isExpanded ? null : i + 1)}
                  >
                    <View style={styles.quarterPlanRowLeft}>
                      <View style={[styles.qBadge, { backgroundColor: getScoreStyle(qScore).backgroundColor }]}>
                        <Text style={[styles.qBadgeText, { color: getScoreStyle(qScore).textColor }]}>
                          Q{i + 1}
                        </Text>
                      </View>
                      <View style={styles.quarterPlanRowMeta}>
                        <Text style={styles.quarterPlanRowScore}>{qScore}%</Text>
                        <View style={[styles.reviewPill, { backgroundColor: pillBg }]}>
                          <Text style={[styles.reviewPillText, { color: pillText }]}>{pillLabel}</Text>
                        </View>
                      </View>
                    </View>
                    {isExpanded
                      ? <ChevronUp size={16} color={colors.mutedForeground} />
                      : <ChevronDown size={16} color={colors.mutedForeground} />
                    }
                  </TouchableOpacity>

                  {/* Expanded Tips */}
                  {isExpanded && (
                    <View style={styles.quarterPlanBody}>
                      {/* Lessons covered */}
                      {qPlan.lessons ? (
                        <View style={styles.lessonsRow}>
                          <Text style={styles.lessonsLabel}>Lessons:</Text>
                          <Text style={styles.lessonsValue}>{qPlan.lessons}</Text>
                        </View>
                      ) : null}

                      {/* Tips — split numbered list into individual rows */}
                      <Text style={styles.tipsHeading}>How to get high scores:</Text>
                      {qPlan.how_to_get_high_scores
                        .split(/\d+\.\s+/)
                        .filter((t: string) => t.trim().length > 0)
                        .map((tip: string, idx: number) => (
                          <View key={idx} style={styles.tipRow}>
                            <View style={styles.tipNumberBadge}>
                              <Text style={styles.tipNumber}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.tipText}>{tip.trim()}</Text>
                          </View>
                        ))
                      }
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          // Fallback — AI plan not yet available
          <Text style={styles.studyPlanText}>{getFallbackSummary()}</Text>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // ── Header Card ────────────────────────────────────────────────────────────
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

  // ── Quarter Grid ───────────────────────────────────────────────────────────
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

  // ── Weak Quarters ──────────────────────────────────────────────────────────
  weakQuartersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
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

  // ── Study Plan Card ────────────────────────────────────────────────────────
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
    marginBottom: 12,
    gap: 8,
  },
  studyPlanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  studyPlanText: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },

  // ── Quarter Plan List (AI) ─────────────────────────────────────────────────
  quarterPlanList: {
    gap: 8,
  },
  quarterPlanRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quarterPlanRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.gray50,
  },
  quarterPlanRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  qBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quarterPlanRowMeta: {
    gap: 4,
  },
  quarterPlanRowScore: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  reviewPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  reviewPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Expanded Body ──────────────────────────────────────────────────────────
  quarterPlanBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: colors.background,
    gap: 10,
  },
  lessonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  lessonsValue: {
    fontSize: 12,
    color: colors.mutedForeground,
    flex: 1,
  },
  tipsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  tipNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tipText: {
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 20,
    flex: 1,
  },
});

export default DiagnosticResultCard;