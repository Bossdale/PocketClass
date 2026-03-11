import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Trophy, Flame, TrendingUp, AlertTriangle } from 'lucide-react-native';

// Assuming these are your local imports
import { 
  getProfile, getSubjectProgress, getDiagnosticResults, 
  getLessonQuizResults, getQuarterlyExamResults, getLessonsBySubject 
} from '../../lib/store';
import { SUBJECTS, QUARTER_TOPICS } from '../../lib/types';
// Note: getCountryClass typically returns a Tailwind string, so it's omitted from RN styling
import type { SubjectProgress, Profile, DiagnosticResult, LessonQuizResult, QuarterlyExamResult } from '../../lib/types';

import SubjectTile from '../../components/SubjectTile';
import ProgressRing from '../../components/ProgressRing';

// Color Palette replacing Tailwind variables
const colors = {
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#2563eb',
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  background: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#ca8a04',
  warningLight: '#fef9c3',
  destructive: '#dc2626',
  destructiveLight: '#fee2e2',
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  transparent: 'transparent',
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'learn' | 'progress' | 'assess'>('learn');
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [assessSubject, setAssessSubject] = useState(SUBJECTS[0].id);

  // Async Data States for Assess Tab
  const [diagResults, setDiagResults] = useState<DiagnosticResult[]>([]);
  const [quizResults, setQuizResults] = useState<LessonQuizResult[]>([]);
  const [examResults, setExamResults] = useState<QuarterlyExamResult[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userProfile = await getProfile();
        if (!userProfile) { 
            router.replace('/Onboarding'); 
            return; 
          }
        setProfile(userProfile);
        
        const sp = await getSubjectProgress();
        setSubjectProgress(sp);
        
        // Load Assessment Data based on selected subject
        setDiagResults(await getDiagnosticResults(assessSubject));
        setQuizResults(await getLessonQuizResults());
        setExamResults(await getQuarterlyExamResults(assessSubject));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [assessSubject]);

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalLessons = subjectProgress.reduce((s, p) => s + p.totalLessons, 0);
  const completedLessons = subjectProgress.reduce((s, p) => s + p.lessonsCompleted, 0);
  const avgMastery = subjectProgress.length > 0 
    ? Math.round(subjectProgress.reduce((s, p) => s + p.masteryScore, 0) / subjectProgress.length) 
    : 0;

  const tabs = [
    { id: 'learn' as const, label: '📚 Learn' },
    { id: 'progress' as const, label: '📊 Progress' },
    { id: 'assess' as const, label: '📝 Assess' },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.nameText}>{profile.name} 👋</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {[
            { icon: BookOpen, value: `${completedLessons}/${totalLessons}`, label: 'LESSONS' },
            { icon: TrendingUp, value: `${avgMastery}%`, label: 'MASTERY' },
            { icon: Flame, value: '3 days', label: 'STREAK' },
          ].map(({ icon: Icon, value, label }) => (
            <View key={label} style={styles.statBox}>
              <Icon size={20} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'learn' && (
          <View style={styles.learnGrid}>
            {SUBJECTS.map((subject, i) => {
              const progress = subjectProgress.find(p => p.subjectId === subject.id) || {
                subjectId: subject.id, lessonsCompleted: 0, totalLessons: subject.totalLessons,
                masteryScore: 0, quarterProgress: [0, 0, 0, 0], diagnosticCompleted: false,
              };
              return (
                <View key={subject.id} style={styles.learnGridItem}>
                  <SubjectTile subject={subject} progress={progress} index={i} />
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'progress' && <ProgressTab subjectProgress={subjectProgress} />}
        
        {activeTab === 'assess' && (
          <AssessTab 
            selectedSubject={assessSubject} 
            onSelectSubject={setAssessSubject}
            diagResults={diagResults}
            quizResults={quizResults}
            examResults={examResults}
            subjectProgress={subjectProgress}
          />
        )}
    </ScrollView>
  );
}

// --- SUB-COMPONENTS --- //

function ProgressTab({ subjectProgress }: { subjectProgress: SubjectProgress[] }) {
  const weakSubjects = subjectProgress.filter(p => p.masteryScore < 50 && p.diagnosticCompleted);

  return (
    <View style={styles.tabContentGap}>
      {/* Focus Areas */}
      <View>
        {weakSubjects.length > 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Focus Areas</Text>
            {weakSubjects.map(p => {
              const subject = SUBJECTS.find(s => s.id === p.subjectId);
              return (
                <Text key={p.subjectId} style={styles.warningText}>
                  ⚠️ {subject?.emoji} {subject?.name} — {p.masteryScore}% mastery. Review weak quarters.
                </Text>
              );
            })}
          </View>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>🌟 Great Progress!</Text>
            <Text style={styles.successText}>All subjects are on track. Keep it up!</Text>
          </View>
        )}
      </View>

      {/* Mastery Overview */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>Mastery Overview</Text>
        </View>
        <View style={{ gap: 12 }}>
          {SUBJECTS.map(subject => {
            const progress = subjectProgress.find(p => p.subjectId === subject.id);
            const score = progress?.masteryScore || 0;
            return (
              <View key={subject.id} style={styles.masteryRow}>
                <Text style={styles.masterySubjectName} numberOfLines={1}>
                  {subject.emoji} {subject.name}
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${score}%` }]} />
                </View>
                <Text style={styles.masteryScoreText}>{score}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quarterly Progress */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Quarterly Progress</Text>
        <View style={styles.quarterlyGrid}>
          {[0, 1, 2, 3].map(qi => {
            const avg = subjectProgress.length > 0
              ? Math.round(subjectProgress.reduce((s, p) => s + (p.quarterProgress[qi] || 0), 0) / subjectProgress.length)
              : 0;
            return (
              <View key={qi} style={styles.quarterlyColumn}>
                <View style={styles.verticalBarTrack}>
                  <View style={[styles.verticalBarFill, { height: `${avg}%` }]} />
                </View>
                <Text style={styles.quarterlyLabel}>Q{qi + 1}</Text>
                <Text style={styles.quarterlyValue}>{avg}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function AssessTab({ 
  selectedSubject, onSelectSubject, diagResults, quizResults, examResults, subjectProgress 
}: {
  selectedSubject: string;
  onSelectSubject: (id: string) => void;
  diagResults: DiagnosticResult[];
  quizResults: LessonQuizResult[];
  examResults: QuarterlyExamResult[];
  subjectProgress: SubjectProgress[];
}) {
  const router = useRouter();
  const latestDiag = diagResults.length > 0 ? diagResults[diagResults.length - 1] : null;
  const currentProgress = subjectProgress.find(p => p.subjectId === selectedSubject);

  const getScoreStyle = (score: number) => {
    if (score >= 80) return { bg: colors.successLight, text: colors.success };
    if (score >= 60) return { bg: colors.primaryLight, text: colors.primaryDark };
    if (score >= 40) return { bg: colors.warningLight, text: colors.warning };
    return { bg: colors.destructiveLight, text: colors.destructive };
  };

  return (
    <View>
      {/* Subject selector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={styles.pillContainer}>
          {SUBJECTS.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => onSelectSubject(s.id)}
              style={[
                styles.pill,
                selectedSubject === s.id ? styles.pillActive : styles.pillInactive
              ]}
            >
              <Text style={[
                styles.pillText,
                selectedSubject === s.id ? styles.pillTextActive : styles.pillTextInactive
              ]}>
                {s.emoji} {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Diagnostic */}
      <View style={[styles.card, { marginBottom: 16 }]}>
        <View style={styles.diagHeader}>
          <View style={styles.diagIcon}>
            <BookOpen size={20} color={colors.primary} />
          </View>
          <View style={styles.diagTextContainer}>
            <Text style={styles.diagTitle}>Diagnostic Test</Text>
            <Text style={styles.diagSubtitle}>
              {latestDiag ? `Attempt #${latestDiag.attemptNumber} · ${new Date(latestDiag.completedAt).toLocaleDateString()}` : 'Not taken yet'}
            </Text>
          </View>
          {latestDiag && (() => {
            const scoreStyle = getScoreStyle(latestDiag.overallScore);
            return (
              <View style={[styles.scoreBadge, { backgroundColor: scoreStyle.bg }]}>
                <Text style={[styles.scoreBadgeText, { color: scoreStyle.text }]}>{latestDiag.overallScore}%</Text>
              </View>
            );
          })()}
        </View>
        <TouchableOpacity onPress={() => router.push(`/DiagnosticTest?subjectId=${selectedSubject}`)} style={{ marginTop: 12 }}>
          <Text style={styles.actionText}>{latestDiag ? 'Retake' : 'Take Test'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quarters */}
      {[1, 2, 3, 4].map(quarter => {
        const lessons = getLessonsBySubject(selectedSubject).filter(l => l.quarter === quarter && !l.isQuarterlyExam);
        const qExams = examResults.filter(r => r.quarter === quarter);
        const latestExam = qExams.length > 0 ? qExams[qExams.length - 1] : null;

        return (
          <View key={quarter} style={{ marginBottom: 20 }}>
            <Text style={styles.quarterHeaderTitle}>Quarter {quarter}</Text>
            
            <View style={styles.lessonListCard}>
              {lessons.map((lesson, li) => {
                const lessonResults = quizResults.filter(r => r.lessonId === lesson.id);
                const latest = lessonResults.length > 0 ? lessonResults[lessonResults.length - 1] : null;
                return (
                  <View key={lesson.id} style={styles.lessonRow}>
                    <View style={styles.lessonNumber}>
                      <Text style={styles.lessonNumberText}>{li + 1}</Text>
                    </View>
                    <Text style={styles.lessonTitle} numberOfLines={1}>
                      {lesson.title.split(' — ')[1] || lesson.title}
                    </Text>
                    
                    {latest && (() => {
                      const scoreStyle = getScoreStyle(latest.score);
                      return (
                        <View style={[styles.scoreBadge, { backgroundColor: scoreStyle.bg }]}>
                          <Text style={[styles.scoreBadgeText, { color: scoreStyle.text }]}>{latest.score}%</Text>
                        </View>
                      );
                    })()}
                    
                    <TouchableOpacity onPress={() => router.push(`/LessonView?lessonId=${lesson.id}`)}>
                      <Text style={[styles.actionText, { marginLeft: 8 }]}>{latest ? 'Retry' : 'Start'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Quarterly Exam Row */}
              <View style={[styles.lessonRow, styles.examRow]}>
                <View style={styles.examIcon}>
                  <Text>🏆</Text>
                </View>
                <Text style={styles.examTitle}>Quarter {quarter} Exam</Text>
                
                {latestExam && (() => {
                  const score = Math.round((latestExam.score / latestExam.totalQuestions) * 100);
                  const scoreStyle = getScoreStyle(score);
                  return (
                    <View style={[styles.scoreBadge, { backgroundColor: scoreStyle.bg }]}>
                      <Text style={[styles.scoreBadgeText, { color: scoreStyle.text }]}>{score}%</Text>
                    </View>
                  );
                })()}
                
                <TouchableOpacity onPress={() => router.push(`/QuarterlyExam?subjectId=${selectedSubject}&quarter=${quarter}`)}>
                  <Text style={[styles.actionText, { marginLeft: 8 }]}>{latestExam ? 'Retake' : 'Take Exam'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {/* Mastery Breakdown */}
      {currentProgress && (
        <View style={[styles.card, styles.masteryBreakdownCard]}>
          <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Subject Mastery</Text>
          <View style={styles.masteryPillsRow}>
            <Text style={styles.masteryPill}>Diagnostic 20%</Text>
            <Text style={styles.masteryPill}>Quizzes 40%</Text>
            <Text style={styles.masteryPill}>Exams 40%</Text>
          </View>
          <ProgressRing progress={currentProgress.masteryScore} size={80} strokeWidth={6}>
            <Text style={styles.progressRingText}>{currentProgress.masteryScore}%</Text>
          </ProgressRing>
          <Text style={styles.masteryFooterText}>Overall Mastery</Text>
        </View>
      )}
    </View>
  );
}

// --- STYLES --- //

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },

  // Stats Top Row
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 10,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.transparent,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray500,
  },
  tabTextActive: {
    color: colors.white,
  },

  // Learn Tab
  learnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  learnGridItem: {
    width: '48%',
  },

  // Progress Tab
  tabContentGap: {
    gap: 16,
  },
  warningBox: {
    backgroundColor: colors.orange50,
    borderColor: colors.orange200,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 4,
  },
  successBox: {
    backgroundColor: colors.successLight,
    borderColor: '#bbf7d0',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: colors.gray500,
  },

  // General Card
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },

  // Mastery Overview Bars
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterySubjectName: {
    fontSize: 14,
    width: 96,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  masteryScoreText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.foreground,
    width: 32,
    textAlign: 'right',
  },

  // Quarterly Progress Bars
  quarterlyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quarterlyColumn: {
    alignItems: 'center',
    flex: 1,
  },
  verticalBarTrack: {
    height: 96,
    width: 32,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalBarFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  quarterlyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.foreground,
    marginTop: 8,
  },
  quarterlyValue: {
    fontSize: 12,
    color: colors.gray500,
  },

  // Assess Tab
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.gray200,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.white,
  },
  pillTextInactive: {
    color: colors.gray500,
  },
  diagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagTextContainer: {
    flex: 1,
  },
  diagTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  diagSubtitle: {
    fontSize: 12,
    color: colors.gray500,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },

  // Lessons List
  quarterHeaderTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.gray500,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  lessonListCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  lessonNumber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray500,
  },
  lessonTitle: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  examRow: {
    backgroundColor: 'rgba(255, 247, 237, 0.5)', // orange50/50
    borderBottomWidth: 0,
  },
  examIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },

  // Mastery Breakdown
  masteryBreakdownCard: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  masteryPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  masteryPill: {
    fontSize: 10,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  progressRingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  masteryFooterText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 8,
  },
});