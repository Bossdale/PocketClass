import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Trophy, Flame, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { 
  getProfile, getSubjectProgress, getDiagnosticResults, 
  getLessonQuizResults, getQuarterlyExamResults, getLessonsBySubject 
} from '../../lib/store';
import { SUBJECTS, getCountryClass, QUARTER_TOPICS } from '../../lib/types';
import type { SubjectProgress, Profile, DiagnosticResult, LessonQuizResult, QuarterlyExamResult } from '../../lib/types';

import SubjectTile from '../../components/SubjectTile';
import ProgressRing from '../../components/ProgressRing';

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
      const userProfile = await getProfile();
      if (!userProfile) { 
        router.replace('/'); 
        return; 
      }
      setProfile(userProfile);
      
      const sp = await getSubjectProgress();
      setSubjectProgress(sp);
      
      // Load Assessment Data based on selected subject
      setDiagResults(await getDiagnosticResults(assessSubject));
      setQuizResults(await getLessonQuizResults());
      setExamResults(await getQuarterlyExamResults(assessSubject));

      setLoading(false);
    }
    loadDashboardData();
  }, [assessSubject]);

  if (loading || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const countryClass = getCountryClass(profile.country);
  const totalLessons = subjectProgress.reduce((s, p) => s + p.totalLessons, 0);
  const completedLessons = subjectProgress.reduce((s, p) => s + p.lessonsCompleted, 0);
  const avgMastery = subjectProgress.length > 0 ? Math.round(subjectProgress.reduce((s, p) => s + p.masteryScore, 0) / subjectProgress.length) : 0;

  const tabs = [
    { id: 'learn' as const, label: '📚 Learn' },
    { id: 'progress' as const, label: '📊 Progress' },
    { id: 'assess' as const, label: '📝 Assess' },
  ];

  return (
    <ScrollView className={`flex-1 bg-background ${countryClass}`} contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-4 pt-6">
        
        {/* Header */}
        <View className="flex-row items-start justify-between mb-6">
          <View>
            <Text className="text-xs text-gray-500 uppercase tracking-wider">Welcome back</Text>
            <Text className="text-2xl font-bold text-foreground">{profile.name} 👋</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between gap-3 mb-6">
          {[
            { icon: BookOpen, value: `${completedLessons}/${totalLessons}`, label: 'LESSONS' },
            { icon: TrendingUp, value: `${avgMastery}%`, label: 'MASTERY' },
            { icon: Flame, value: '3 days', label: 'STREAK' },
          ].map(({ icon: Icon, value, label }) => (
            <View key={label} className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 items-center shadow-sm">
              <Icon size={20} color="#3b82f6" className="mb-1" />
              <Text className="text-lg font-bold text-foreground">{value}</Text>
              <Text className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-gray-900 rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === tab.id ? 'bg-blue-500 shadow-sm' : 'bg-transparent'
              }`}
            >
              <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'learn' && (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {SUBJECTS.map((subject, i) => {
              const progress = subjectProgress.find(p => p.subjectId === subject.id) || {
                subjectId: subject.id, lessonsCompleted: 0, totalLessons: subject.totalLessons,
                masteryScore: 0, quarterProgress: [0, 0, 0, 0], diagnosticCompleted: false,
              };
              return (
                <View key={subject.id} className="w-[48%]">
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
      </View>
    </ScrollView>
  );
}

// --- SUB-COMPONENTS --- //

function ProgressTab({ subjectProgress }: { subjectProgress: SubjectProgress[] }) {
  const weakSubjects = subjectProgress.filter(p => p.masteryScore < 50 && p.diagnosticCompleted);

  return (
    <View className="gap-4">
      {/* Focus Areas */}
      <View>
        {weakSubjects.length > 0 ? (
          <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 p-4 rounded-xl">
            <Text className="text-sm font-semibold text-foreground mb-2">⚠️ Focus Areas</Text>
            {weakSubjects.map(p => {
              const subject = SUBJECTS.find(s => s.id === p.subjectId);
              return (
                <Text key={p.subjectId} className="text-sm text-gray-600">
                  ⚠️ {subject?.emoji} {subject?.name} — {p.masteryScore}% mastery. Review weak quarters.
                </Text>
              );
            })}
          </View>
        ) : (
          <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 p-4 rounded-xl">
            <Text className="text-sm font-semibold text-foreground">🌟 Great Progress!</Text>
            <Text className="text-sm text-gray-600">All subjects are on track. Keep it up!</Text>
          </View>
        )}
      </View>

      {/* Mastery Overview */}
      <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
        <View className="flex-row items-center gap-2 mb-4">
          <TrendingUp size={16} color="#3b82f6" />
          <Text className="text-sm font-semibold text-foreground">Mastery Overview</Text>
        </View>
        <View className="gap-3">
          {SUBJECTS.map(subject => {
            const progress = subjectProgress.find(p => p.subjectId === subject.id);
            const score = progress?.masteryScore || 0;
            return (
              <View key={subject.id} className="flex-row items-center gap-3">
                <Text className="text-sm w-24" numberOfLines={1}>{subject.emoji} {subject.name}</Text>
                <View className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View className="h-full bg-blue-500 rounded-full" style={{ width: `${score}%` }} />
                </View>
                <Text className="text-xs font-medium text-foreground w-8 text-right">{score}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quarterly Progress */}
      <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
        <Text className="text-sm font-semibold text-foreground mb-4">Quarterly Progress</Text>
        <View className="flex-row justify-between">
          {[0, 1, 2, 3].map(qi => {
            const avg = subjectProgress.length > 0
              ? Math.round(subjectProgress.reduce((s, p) => s + (p.quarterProgress[qi] || 0), 0) / subjectProgress.length)
              : 0;
            return (
              <View key={qi} className="items-center flex-1">
                <View className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden w-8 justify-end">
                  <View className="bg-blue-500 rounded-lg w-full" style={{ height: `${avg}%` }} />
                </View>
                <Text className="text-xs font-medium text-foreground mt-2">Q{qi + 1}</Text>
                <Text className="text-xs text-gray-500">{avg}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function AssessTab({ 
  selectedSubject, 
  onSelectSubject, 
  diagResults, 
  quizResults, 
  examResults, 
  subjectProgress 
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
  const subject = SUBJECTS.find(s => s.id === selectedSubject);

  const getScoreBg = (score: number) => score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-blue-100' : score >= 40 ? 'bg-yellow-100' : 'bg-red-100';
  const getScoreText = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <View>
      {/* Subject selector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {SUBJECTS.map(s => (
            <Pressable
              key={s.id}
              onPress={() => onSelectSubject(s.id)}
              className={`rounded-full px-4 py-2 ${
                selectedSubject === s.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            >
              <Text className={`text-xs font-medium ${selectedSubject === s.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {s.emoji} {s.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Diagnostic */}
      <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center">
            <BookOpen size={20} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Diagnostic Test</Text>
            <Text className="text-xs text-gray-500">
              {latestDiag ? `Attempt #${latestDiag.attemptNumber} · ${new Date(latestDiag.completedAt).toLocaleDateString()}` : 'Not taken yet'}
            </Text>
          </View>
          {latestDiag && (
            <View className={`px-2 py-1 rounded-full ${getScoreBg(latestDiag.overallScore)}`}>
              <Text className={`text-xs font-medium ${getScoreText(latestDiag.overallScore)}`}>{latestDiag.overallScore}%</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => router.push(`/diagnostic-test?subjectId=${selectedSubject}`)} className="mt-3">
          <Text className="text-xs text-blue-500 font-medium">{latestDiag ? 'Retake' : 'Take Test'}</Text>
        </Pressable>
      </View>

      {/* Quarters */}
      {[1, 2, 3, 4].map(quarter => {
        const lessons = getLessonsBySubject(selectedSubject).filter(l => l.quarter === quarter && !l.isQuarterlyExam);
        const qExams = examResults.filter(r => r.quarter === quarter);
        const latestExam = qExams.length > 0 ? qExams[qExams.length - 1] : null;

        return (
          <View key={quarter} className="mb-5">
            <Text className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2 mt-2">
              Quarter {quarter}
            </Text>
            
            <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
              {lessons.map((lesson, li) => {
                const lessonResults = quizResults.filter(r => r.lessonId === lesson.id);
                const latest = lessonResults.length > 0 ? lessonResults[lessonResults.length - 1] : null;
                return (
                  <View key={lesson.id} className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <View className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 items-center justify-center">
                      <Text className="text-xs font-bold text-gray-500">{li + 1}</Text>
                    </View>
                    <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                      {lesson.title.split(' — ')[1] || lesson.title}
                    </Text>
                    
                    {latest && (
                      <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-0.5 rounded-full ${getScoreBg(latest.score)}`}>
                          <Text className={`text-xs font-medium ${getScoreText(latest.score)}`}>{latest.score}%</Text>
                        </View>
                      </View>
                    )}
                    
                    <Pressable onPress={() => router.push(`/lesson-view?lessonId=${lesson.id}`)}>
                      <Text className="text-xs text-blue-500 ml-2">{latest ? 'Retry' : 'Start'}</Text>
                    </Pressable>
                  </View>
                );
              })}

              {/* Quarterly Exam Row */}
              <View className="flex-row items-center gap-2 px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10">
                <View className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 items-center justify-center">
                  <Text>🏆</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground flex-1">Quarter {quarter} Exam</Text>
                
                {latestExam && (
                  <View className={`px-2 py-0.5 rounded-full ${getScoreBg(Math.round((latestExam.score / latestExam.totalQuestions) * 100))}`}>
                    <Text className={`text-xs font-medium ${getScoreText(Math.round((latestExam.score / latestExam.totalQuestions) * 100))}`}>
                      {Math.round((latestExam.score / latestExam.totalQuestions) * 100)}%
                    </Text>
                  </View>
                )}
                
                <Pressable onPress={() => router.push(`/exam?subjectId=${selectedSubject}&quarter=${quarter}`)}>
                  <Text className="text-xs text-blue-500 ml-2">{latestExam ? 'Retake' : 'Take Exam'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}

      {/* Mastery Breakdown */}
      {currentProgress && (
        <View className="bg-white dark:bg-gray-800 p-5 mt-2 mb-8 rounded-2xl shadow-sm items-center">
          <Text className="text-sm font-semibold text-foreground mb-3">Subject Mastery</Text>
          <View className="flex-row justify-center gap-2 mb-4">
            <Text className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Diagnostic 20%</Text>
            <Text className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Quizzes 40%</Text>
            <Text className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Exams 40%</Text>
          </View>
          <ProgressRing progress={currentProgress.masteryScore} size={80} strokeWidth={6}>
            <Text className="text-2xl font-bold text-blue-500">{currentProgress.masteryScore}%</Text>
          </ProgressRing>
          <Text className="text-xs text-gray-500 mt-2">Overall Mastery</Text>
        </View>
      )}
    </View>
  );
}