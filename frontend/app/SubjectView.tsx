import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react-native';
import { 
  getLessonsBySubject, getLessonProgress, getSubjectProgress, 
  quarterlyExamUnlocked, getQuarterlyExamResults, getProfile 
} from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS, getCountryClass } from '../lib/types';
import type { Profile, Lesson, LessonProgress } from '../lib/types';

import ProgressRing from '../components/ProgressRing';

// Interface to hold our complex quarter data state
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

  // We must load all this data asynchronously now!
  useEffect(() => {
    async function loadSubjectData() {
      if (!subjectId) return;

      const p = await getProfile();
      setProfile(p);

      const lp = await getLessonProgress();
      const allLessons = getLessonsBySubject(subjectId);
      
      const qData: QuarterData[] = [];
      
      // Loop through the 4 quarters and build the async data
      for (const q of [1, 2, 3, 4]) {
        const qLessons = allLessons.filter(l => l.quarter === q && !l.isQuarterlyExam);
        const completed = qLessons.filter(l => lp.some(prog => prog.lessonId === l.id && prog.completed)).length;
        const pct = qLessons.length > 0 ? Math.round((completed / qLessons.length) * 100) : 0;
        
        // Await the storage calls
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
    return <View className="flex-1 bg-background" />;
  }

  const countryClass = getCountryClass(profile.country);

  return (
    <ScrollView className={`flex-1 bg-background ${countryClass}`} contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-4 pt-10">
        
        {/* Header */}
        <Pressable onPress={() => router.replace('/(tabs)')} className="flex-row items-center gap-2 mb-4">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="text-sm text-gray-500">Back</Text>
        </Pressable>

        <View className="flex-row items-center gap-4 mb-6">
          <Text className="text-5xl">{subject.emoji}</Text>
          <View>
            <Text className="text-2xl font-bold text-foreground">{subject.name}</Text>
            <Text className="text-sm text-gray-500">{subject.totalLessons} lessons · 4 quarters</Text>
          </View>
        </View>

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View className="gap-5">
            {quarterData.map(({ quarter, lessons, completed, total, pct, examUnlocked, latestExam, lessonProgress }) => (
              <View key={quarter} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                
                {/* Quarter Header */}
                <View className="p-4 flex-row items-center gap-4 border-b border-gray-100 dark:border-gray-700">
                  <ProgressRing progress={pct} size={48} strokeWidth={4}>
                    <Text className="text-xs font-bold text-foreground">{pct}%</Text>
                  </ProgressRing>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground text-lg">Quarter {quarter}</Text>
                    <Text className="text-xs text-gray-500">{QUARTER_TOPICS[subjectId]?.[quarter - 1]}</Text>
                    <Text className="text-xs text-blue-500 mt-1">{completed}/{total} lessons</Text>
                  </View>
                  {pct === 100 && <CheckCircle2 size={24} color="#22c55e" />}
                </View>

                {/* Lesson List */}
                <View>
                  {lessons.map(lesson => {
                    const lp = lessonProgress.find(p => p.lessonId === lesson.id);
                    const isCompleted = lp?.completed;
                    
                    return (
                      <Pressable
                        key={lesson.id}
                        onPress={() => router.push(`/LessonView?lessonId=${lesson.id}`)}
                        className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
                      >
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          isCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {isCompleted ? (
                            <Text className="text-green-600 dark:text-green-400 font-bold">✓</Text>
                          ) : (
                            <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">{lesson.order}</Text>
                          )}
                        </View>
                        <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                          {lesson.title.split(' — ')[1] || lesson.title}
                        </Text>
                        {lp?.quizScore !== undefined && (
                          <Text className="text-xs text-gray-500">{lp.quizScore}%</Text>
                        )}
                      </Pressable>
                    );
                  })}

                  {/* Quarterly Exam Row */}
                  <Pressable
                    onPress={() => examUnlocked && router.push(`/QuarterlyExam?subjectId=${subjectId}&quarter=${quarter}`)}
                    disabled={!examUnlocked}
                    className={`flex-row items-center gap-3 px-4 py-4 ${
                      examUnlocked ? 'bg-orange-50 dark:bg-orange-900/20 active:bg-orange-100' : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <View className="w-8 h-8 rounded-lg bg-orange-200 dark:bg-orange-900/50 items-center justify-center">
                      <Text>🏆</Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground flex-1">Quarter {quarter} Exam</Text>
                    
                    {latestExam ? (
                      <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {Math.round((latestExam.score / latestExam.totalQuestions) * 100)}%
                        </Text>
                      </View>
                    ) : examUnlocked ? (
                      <Text className="text-xs text-orange-600 font-medium">Take Exam</Text>
                    ) : (
                      <Lock size={16} color="#9ca3af" />
                    )}
                  </Pressable>

                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}