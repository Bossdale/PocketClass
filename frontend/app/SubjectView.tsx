import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react-native';

import { 
  getLessonsBySubject, getLessonProgress, 
  quarterlyExamUnlocked, getQuarterlyExamResults, getProfile 
} from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS } from '../lib/types';
import type { Profile, Lesson, LessonProgress } from '../lib/types';

import ProgressRing from '../components/ProgressRing';

const colors = {
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#2563eb',
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray700: '#374151',
  success: '#22c55e',
  successLight: '#dcfce7',
  successDark: '#15803d',
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  orange600: '#ea580c',
};

interface QuarterData {
  quarter: number;
  lessons: Lesson[];
  completed: number;
  total: number;
  pct: number;
  examUnlocked: boolean;
  latestExam: any;
  lessonProgress: LessonProgress[];
}

export default function SubjectView() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  
  const subject = SUBJECTS.find(s => s.id === subjectId);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);

  useEffect(() => {
    async function loadSubjectData() {
      if (!subjectId) return;
      const p = await getProfile();
      setProfile(p);

      const lp = await getLessonProgress();
      const allLessons = getLessonsBySubject(subjectId);
      
      const qData: QuarterData[] = [];
      
      for (const q of [1, 2, 3, 4]) {
        const qLessons = allLessons.filter(l => l.quarter === q && !l.isQuarterlyExam);
        const completed = qLessons.filter(l => lp.some(prog => prog.lessonId === l.id && prog.completed)).length;
        const pct = qLessons.length > 0 ? Math.round((completed / qLessons.length) * 100) : 0;
        
        const examUnlocked = await quarterlyExamUnlocked(subjectId, q);
        const examResults = await getQuarterlyExamResults(subjectId, q);
        const latestExam = examResults.length > 0 ? examResults[examResults.length - 1] : null;

        qData.push({ 
          quarter: q, 
          lessons: qLessons, 
          completed, 
          total: qLessons.length, 
          pct, 
          examUnlocked, 
          latestExam,
          lessonProgress: lp
        });
      }

      setQuarterData(qData);
      setLoading(false);
    }
    loadSubjectData();
  }, [subjectId]);

  if (!subject || !subjectId || !profile) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Navigation */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <ArrowLeft size={20} color={colors.mutedForeground} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{subject.emoji}</Text>
        <View>
          <Text style={styles.headerTitle}>{subject.name}</Text>
          <Text style={styles.headerSubtitle}>{subject.totalLessons} lessons · 4 quarters</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.quarterGap}>
          {quarterData.map(({ quarter, lessons, completed, total, pct, examUnlocked, latestExam, lessonProgress }) => (
            <View key={quarter} style={styles.quarterCard}>
              
              {/* Quarter Header */}
              <View style={styles.quarterHeader}>
                <ProgressRing progress={pct} size={48} strokeWidth={4}>
                  <Text style={styles.pctText}>{pct}%</Text>
                </ProgressRing>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.quarterTitle}>Quarter {quarter}</Text>
                  <Text style={styles.topicText}>{QUARTER_TOPICS[subjectId]?.[quarter - 1]}</Text>
                  <Text style={styles.lessonCountText}>{completed}/{total} lessons</Text>
                </View>
                {pct === 100 && <CheckCircle2 size={24} color={colors.success} />}
              </View>

              {/* Lesson List */}
              <View>
                {lessons.map(lesson => {
                  const lp = lessonProgress.find(p => p.lessonId === lesson.id);
                  const isCompleted = lp?.completed;
                  
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      onPress={() => router.push(`/LessonView?lessonId=${lesson.id}`)}
                      style={styles.lessonRow}
                    >
                      <View style={[
                        styles.lessonIconBox,
                        { backgroundColor: isCompleted ? colors.successLight : colors.primaryLight }
                      ]}>
                        {isCompleted ? (
                          <Text style={styles.checkMark}>✓</Text>
                        ) : (
                          <Text style={styles.lessonOrder}>{lesson.order}</Text>
                        )}
                      </View>
                      <Text style={styles.lessonTitleText} numberOfLines={1}>
                        {lesson.title.split(' — ')[1] || lesson.title}
                      </Text>
                      {lp?.quizScore !== undefined && (
                        <Text style={styles.lessonScoreText}>{lp.quizScore}%</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Quarterly Exam Row */}
                <TouchableOpacity
                  onPress={() => examUnlocked && router.push(`/QuarterlyExam?subjectId=${subjectId}&quarter=${quarter}`)}
                  disabled={!examUnlocked}
                  style={[
                    styles.examRow,
                    examUnlocked ? styles.examRowUnlocked : styles.examRowLocked
                  ]}
                >
                  <View style={styles.examIconBox}>
                    <Text>🏆</Text>
                  </View>
                  <Text style={styles.examTitleText}>Quarter {quarter} Exam</Text>
                  
                  {latestExam ? (
                    <View style={styles.examScoreBadge}>
                      <Text style={styles.examScoreText}>
                        {Math.round((latestExam.score / latestExam.totalQuestions) * 100)}%
                      </Text>
                    </View>
                  ) : examUnlocked ? (
                    <Text style={styles.takeExamText}>Take Exam</Text>
                  ) : (
                    <Lock size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>

              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerEmoji: {
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  loadingWrapper: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quarterGap: {
    gap: 20,
  },
  quarterCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  quarterHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  pctText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerTextContainer: {
    flex: 1,
  },
  quarterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  topicText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  lessonCountText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  lessonIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.successDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  lessonOrder: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  lessonTitleText: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  lessonScoreText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  examRowUnlocked: {
    backgroundColor: colors.orange50,
  },
  examRowLocked: {
    backgroundColor: colors.gray50,
    opacity: 0.6,
  },
  examIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.orange200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  examScoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  examScoreText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  takeExamText: {
    fontSize: 12,
    color: colors.orange600,
    fontWeight: '500',
  },
});