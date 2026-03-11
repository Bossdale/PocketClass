import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  LogOut, 
  Library, 
  Target, 
  Zap, 
  BookOpen, 
  BarChart3, 
  ClipboardCheck, 
  AlertTriangle, 
  Sparkles, 
  Trophy 
} from 'lucide-react-native';

import { 
  getProfile, getSubjectProgress, getDiagnosticResults, 
  getLessonQuizResults, getQuarterlyExamResults, getLessonsBySubject 
} from '../../lib/store';
import { SUBJECTS, QUARTER_TOPICS } from '../../lib/types';
import type { SubjectProgress, Profile, DiagnosticResult, LessonQuizResult, QuarterlyExamResult } from '../../lib/types';

import SubjectTile from '../../components/SubjectTile';
import ProgressRing from '../../components/ProgressRing';

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
  gray500: '#64748b',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  destructive: '#ef4444',
  destructiveLight: '#fee2e2',
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  transparent: 'transparent',
};

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const[activeTab, setActiveTab] = useState<'learn' | 'progress' | 'assess'>('learn');
  const[subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [assessSubject, setAssessSubject] = useState(SUBJECTS[0].id);

  const [diagResults, setDiagResults] = useState<DiagnosticResult[]>([]);
  const [quizResults, setQuizResults] = useState<LessonQuizResult[]>([]);
  const[examResults, setExamResults] = useState<QuarterlyExamResult[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userProfile = await getProfile();
        if (!userProfile) { 
            router.replace('/Onboarding'); 
            return; 
          }
        setProfile(userProfile);
        setSubjectProgress(await getSubjectProgress());
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

  // Upgraded Tabs with Lucide Icons instead of Emojis
  const tabs =[
    { id: 'learn' as const, label: 'Learn', icon: BookOpen },
    { id: 'progress' as const, label: 'Progress', icon: BarChart3 },
    { id: 'assess' as const, label: 'Assess', icon: ClipboardCheck },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{profile.name} 👋</Text>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => router.replace('/Onboarding')}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* Upgraded Vibrant Stats Boxes */}
        <View style={styles.statsContainer}>
          {[
            { icon: Library, value: `${completedLessons}/${totalLessons}`, label: 'LESSONS', color: '#3b82f6', bg: '#eff6ff' }, // Blue
            { icon: Target, value: `${avgMastery}%`, label: 'MASTERY', color: '#8b5cf6', bg: '#f5f3ff' }, // Violet
            { icon: Zap, value: '3 days', label: 'STREAK', color: '#f59e0b', bg: '#fffbeb' }, // Amber
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <View key={label} style={styles.statBox}>
              <View style={[styles.statIconWrapper, { backgroundColor: bg }]}>
                <Icon size={22} color={color} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
              >
                <View style={styles.tabContentRow}>
                  <Icon size={16} color={isActive ? colors.primary : colors.gray500} strokeWidth={isActive ? 2.5 : 2} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Tab Content */}
        {activeTab === 'learn' && (
          <View style={styles.learnStack}>
            {SUBJECTS.map((subject, i) => {
              const progress = subjectProgress.find(p => p.subjectId === subject.id) || {
                subjectId: subject.id, lessonsCompleted: 0, totalLessons: subject.totalLessons,
                masteryScore: 0, quarterProgress:[0, 0, 0, 0], diagnosticCompleted: false,
              };
              return (
                <View key={subject.id} style={styles.learnStackItem}>
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
    </View>
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
            <View style={styles.alertHeader}>
              <AlertTriangle size={18} color={colors.warning} strokeWidth={2.5} />
              <Text style={styles.warningTitle}>Focus Areas</Text>
            </View>
            {weakSubjects.map(p => {
              const subject = SUBJECTS.find(s => s.id === p.subjectId);
              return (
                <Text key={p.subjectId} style={styles.warningText}>
                  • {subject?.name} — {p.masteryScore}% mastery. Review weak quarters.
                </Text>
              );
            })}
          </View>
        ) : (
          <View style={styles.successBox}>
            <View style={styles.alertHeader}>
              <Sparkles size={18} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.successTitle}>Great Progress!</Text>
            </View>
            <Text style={styles.successText}>All subjects are on track. Keep it up!</Text>
          </View>
        )}
      </View>

      {/* Mastery Overview */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Target size={18} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>Mastery Overview</Text>
        </View>
        <View style={{ gap: 14 }}>
          {SUBJECTS.map(subject => {
            const progress = subjectProgress.find(p => p.subjectId === subject.id);
            const score = progress?.masteryScore || 0;
            return (
              <View key={subject.id} style={styles.masteryRow}>
                <Text style={styles.masterySubjectName} numberOfLines={1}>
                  {subject.name}
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
        <View style={styles.cardHeader}>
          <BarChart3 size={18} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>Quarterly Progress</Text>
        </View>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
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
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Diagnostic */}
      <View style={[styles.card, { marginBottom: 16 }]}>
        <View style={styles.diagHeader}>
          <View style={styles.diagIconBox}>
            <ClipboardCheck size={22} color={colors.primaryDark} strokeWidth={2.5} />
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
        <TouchableOpacity 
          onPress={() => router.push(`/DiagnosticTest?subjectId=${selectedSubject}`)} 
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{latestDiag ? 'Retake Diagnostic' : 'Take Diagnostic'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quarters */}
      {[1, 2, 3, 4].map(quarter => {
        const lessons = getLessonsBySubject(selectedSubject).filter(l => l.quarter === quarter && !l.isQuarterlyExam);
        const qExams = examResults.filter(r => r.quarter === quarter);
        const latestExam = qExams.length > 0 ? qExams[qExams.length - 1] : null;

        return (
          <View key={quarter} style={{ marginBottom: 24 }}>
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
                      <Text style={[styles.actionTextLink, { marginLeft: 12 }]}>{latest ? 'Retry' : 'Start'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Quarterly Exam Row - Upgraded Trophy Icon */}
              <View style={[styles.lessonRow, styles.examRow]}>
                <View style={styles.examIconBox}>
                  <Trophy size={18} color="#d97706" strokeWidth={2.5} />
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
                  <Text style={[styles.actionTextLink, { marginLeft: 12 }]}>{latestExam ? 'Retake' : 'Take Exam'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {/* Mastery Breakdown */}
      {currentProgress && (
        <View style={[styles.card, styles.masteryBreakdownCard]}>
          <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Subject Mastery</Text>
          <View style={styles.masteryPillsRow}>
            <View style={styles.masteryPill}><Text style={styles.masteryPillText}>Diagnostic 20%</Text></View>
            <View style={styles.masteryPill}><Text style={styles.masteryPillText}>Quizzes 40%</Text></View>
            <View style={styles.masteryPill}><Text style={styles.masteryPillText}>Exams 40%</Text></View>
          </View>
          <ProgressRing progress={currentProgress.masteryScore} size={88} strokeWidth={6}>
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
    paddingHorizontal: 20, 
    paddingBottom: 40, // Reduced from 120 since the bottom bar is now removed
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
    marginTop: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.gray500,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.destructiveLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Top Row
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.transparent,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  tabTextActive: {
    color: colors.primary,
  },

  // Learn Tab
  learnStack: {
    flexDirection: 'column',
    width: '100%',
  },
  learnStackItem: {
    width: '100%',
    marginBottom: 12,
  },

  // Progress Tab
  tabContentGap: {
    gap: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningBox: {
    backgroundColor: colors.warningLight,
    borderColor: '#fcd34d',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: colors.successLight,
    borderColor: '#6ee7b7',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064e3b',
  },
  successText: {
    fontSize: 14,
    color: '#064e3b',
    fontWeight: '500',
  },

  // General Card
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.foreground,
    width: 96,
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.gray100,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  masteryScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    width: 36,
    textAlign: 'right',
  },

  // Quarterly Progress Bars
  quarterlyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  quarterlyColumn: {
    alignItems: 'center',
    flex: 1,
  },
  verticalBarTrack: {
    height: 100,
    width: 36,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalBarFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  quarterlyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 10,
  },
  quarterlyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    marginTop: 2,
  },

  // Assess Tab
  pillContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  pillActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pillInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
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
    gap: 16,
  },
  diagIconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagTextContainer: {
    flex: 1,
  },
  diagTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  diagSubtitle: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  actionTextLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },

  // Lessons List
  quarterHeaderTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.gray500,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  lessonListCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
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
  lessonNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gray500,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  examRow: {
    backgroundColor: colors.orange50,
    borderBottomWidth: 0,
  },
  examIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e', // Dark orange text for exam
    flex: 1,
  },

  // Mastery Breakdown
  masteryBreakdownCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  masteryPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  masteryPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  masteryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressRingText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  masteryFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    marginTop: 12,
  },
});