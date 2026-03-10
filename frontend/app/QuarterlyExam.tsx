import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react-native';
import { getProfile, saveQuarterlyExamResult, getQuarterlyExamResults, generateId } from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS, getCountryClass } from '../lib/types';
import { generateQuarterlyExam } from '../lib/quizService';
import type { QuizQuestion, Profile } from '../lib/types';

// We will convert this component soon!
import QuizRenderer from '../components/QuizRenderer';

export default function QuarterlyExam() {
  const { subjectId, quarter: quarterStr } = useLocalSearchParams<{ subjectId: string; quarter: string }>();
  const router = useRouter();
  
  const quarter = parseInt(quarterStr || '1');
  const subject = SUBJECTS.find(s => s.id === subjectId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'intro' | 'exam' | 'complete'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [easyScore, setEasyScore] = useState(0);
  const [mediumScore, setMediumScore] = useState(0);
  const [hardScore, setHardScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Load the profile asynchronously
  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
    }
    load();
  }, []);

  if (!subject || !subjectId || !profile) return <View className="flex-1 bg-background" />;
  
  const countryClass = getCountryClass(profile.country);
  const topic = QUARTER_TOPICS[subjectId]?.[quarter - 1] || '';

  const startExam = async () => {
    setLoading(true);
    setMode('exam');
    const qs = await generateQuarterlyExam(subject.name, quarter, topic, profile.grade, profile.country);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setEasyScore(0);
    setMediumScore(0);
    setHardScore(0);
    setLoading(false);
  };

  // 2. Make handleAnswer async to wait for mobile storage saves
  const handleAnswer = async (correct: boolean) => {
    let newScore = score;
    let newEasy = easyScore;
    let newMedium = mediumScore;
    let newHard = hardScore;

    const q = questions[currentQ];
    if (correct) {
      newScore += 1;
      setScore(newScore);
      if (q.difficulty === 'easy') { newEasy += 1; setEasyScore(newEasy); }
      else if (q.difficulty === 'medium') { newMedium += 1; setMediumScore(newMedium); }
      else { newHard += 1; setHardScore(newHard); }
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      // Exam Complete! Save to AsyncStorage
      const finalScore = correct ? score + 1 : score;
      
      const prevResults = await getQuarterlyExamResults(subjectId as string, quarter);
      
      await saveQuarterlyExamResult({
        id: generateId(),
        userId: profile.id,
        subjectId: subjectId as string,
        quarter,
        score: finalScore,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
        attemptNumber: prevResults.length + 1,
      });
      
      setScore(finalScore);
      setMode('complete');
    }
  };

  const totalPct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const stars = totalPct >= 80 ? 3 : totalPct >= 50 ? 2 : 1;

  return (
    <ScrollView className={`flex-1 bg-background ${countryClass}`} contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-4 pt-10">
        <Pressable onPress={() => router.replace(`/subject-view?subjectId=${subjectId}`)} className="flex-row items-center gap-2 mb-4">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="text-sm text-gray-500">Back</Text>
        </Pressable>

        <View className="flex-row items-center gap-3 mb-6">
          <Text className="text-3xl">{subject.emoji}</Text>
          <View>
            <Text className="text-xl font-bold text-foreground">{subject.name} — Q{quarter} Exam</Text>
            <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full px-3 py-1 self-start mt-1">
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">Quarter {quarter} Exam</Text>
            </View>
          </View>
        </View>

        {mode === 'intro' && (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center shadow-sm">
            <View className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mb-4">
              <Text className="text-2xl">🏆</Text>
            </View>
            <Text className="text-xl font-bold text-foreground mb-2">Quarter {quarter} Exam</Text>
            <Text className="text-sm text-gray-500 text-center mb-4">
              Test your knowledge of all lessons in this quarter
            </Text>
            <View className="flex-row justify-center gap-2 mb-6 flex-wrap">
              <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                 <Text className="text-gray-500 text-xs">15 Questions</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                 <Text className="text-gray-500 text-xs">Mixed Types</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                 <Text className="text-gray-500 text-xs">All Levels</Text>
              </View>
            </View>
            <Pressable onPress={startExam} className="w-full py-4 rounded-xl bg-blue-500 items-center">
              <Text className="text-white font-semibold text-lg">Start Exam</Text>
            </Pressable>
          </View>
        )}

        {mode === 'exam' && (
          <View>
            {loading ? (
              <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center justify-center shadow-sm">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-gray-500">Generating Exam...</Text>
              </View>
            ) : questions.length > 0 && currentQ < questions.length ? (
              <View>
                {/* Progress bar */}
                <View className="flex-row gap-1 mb-4">
                  {questions.map((_, i) => (
                    <View key={i} className={`h-1.5 flex-1 rounded-full ${
                      i === currentQ ? 'bg-blue-500' : i < currentQ ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  ))}
                </View>

                <View className="flex-row justify-center mb-4">
                  {(() => {
                    const d = questions[currentQ].difficulty;
                    const bg = d === 'easy' ? 'bg-green-100' : d === 'medium' ? 'bg-yellow-100' : 'bg-red-100';
                    const textC = d === 'easy' ? 'text-green-700' : d === 'medium' ? 'text-yellow-700' : 'text-red-700';
                    return (
                      <View className={`px-3 py-1 rounded-full ${bg}`}>
                        <Text className={`text-xs font-medium ${textC}`}>{d}</Text>
                      </View>
                    );
                  })()}
                </View>

                <Text className="text-xs text-gray-500 text-center mb-4">
                  Question {currentQ + 1} of {questions.length}
                </Text>

                <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                  {/* Needs to be converted in the components folder! */}
                  <QuizRenderer question={questions[currentQ]} onAnswer={handleAnswer} />
                </View>
              </View>
            ) : null}
          </View>
        )}

        {mode === 'complete' && (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center shadow-sm">
            <View className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mb-3">
              <Text className="text-2xl">🏆</Text>
            </View>
            <Text className="text-xl font-bold text-foreground mb-2">Quarter {quarter} Exam Complete!</Text>
            <Text className="text-4xl font-bold text-blue-500 mb-3">{totalPct}%</Text>
            
            <View className="flex-row justify-center gap-1 mb-4">
              {[1, 2, 3].map(s => (
                <Star key={s} size={28} color={s <= stars ? "#eab308" : "#d1d5db"} fill={s <= stars ? "#eab308" : "transparent"} />
              ))}
            </View>
            
            <View className="flex-row justify-center gap-3 mb-6">
              <View className="bg-green-100 px-3 py-1 rounded-full">
                 <Text className="text-green-700 text-xs font-medium">Easy: {easyScore}</Text>
              </View>
              <View className="bg-yellow-100 px-3 py-1 rounded-full">
                 <Text className="text-yellow-700 text-xs font-medium">Med: {mediumScore}</Text>
              </View>
              <View className="bg-red-100 px-3 py-1 rounded-full">
                 <Text className="text-red-700 text-xs font-medium">Hard: {hardScore}</Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => router.replace(`/subject-view?subjectId=${subjectId}`)}
              className="w-full py-4 rounded-xl bg-blue-500 items-center mb-3"
            >
              <Text className="text-white font-semibold">Back to Subject</Text>
            </Pressable>
            <Pressable onPress={startExam} className="py-2">
              <Text className="text-sm text-blue-500 font-medium">Retake Exam</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}