import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useDiagnostic } from '../hooks/use-diagnostic';
import { saveDiagnosticResult, getProfile, getDiagnosticResults, generateId } from '../lib/store';
import { SUBJECTS, QUARTER_TOPICS, getCountryClass } from '../lib/types';
import DiagnosticResultCard from '../components/DiagnosticResultCard';
import type { Profile, DiagnosticResult } from '../lib/types';

export default function DiagnosticTest() {
  // Expo router uses useLocalSearchParams instead of useParams
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [finalResult, setFinalResult] = useState<DiagnosticResult | null>(null);

  const subject = SUBJECTS.find(s => s.id === subjectId);

  // 1. Load the async profile
  useEffect(() => {
    async function loadProfile() {
      const p = await getProfile();
      setProfile(p);
    }
    loadProfile();
  }, []);

  const {
    questions, loading, currentIndex, answers, showQuarterIntro,
    currentQuarter, isCompleted, answerQuestion, beginQuarter, getQuarterScores,
  } = useDiagnostic(subjectId || '', subject?.name || '');

  // 2. Handle the completion asynchronously!
  useEffect(() => {
    async function processResults() {
      // If test is done, we have a profile, and we haven't saved yet
      if (isCompleted && profile && !finalResult && subjectId) {
        const scores = getQuarterScores();
        const overall = Math.round((scores.q1 + scores.q2 + scores.q3 + scores.q4) / 4);
        
        // Wait for mobile storage to get previous results
        const prevResults = await getDiagnosticResults(subjectId);
        
        const result: DiagnosticResult = {
          id: generateId(),
          userId: profile.id,
          subjectId,
          q1Score: scores.q1,
          q2Score: scores.q2,
          q3Score: scores.q3,
          q4Score: scores.q4,
          overallScore: overall,
          completedAt: new Date().toISOString(),
          attemptNumber: prevResults.length + 1,
        };
        
        // Wait for mobile storage to save
        await saveDiagnosticResult(result);
        setFinalResult(result); // This triggers the UI to show the final card
      }
    }
    processResults();
  }, [isCompleted, profile, finalResult, subjectId]);

  if (!subject || !subjectId || !profile) return <View className="flex-1 bg-background" />;

  const countryClass = getCountryClass(profile.country);
  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView className={`flex-1 bg-background ${countryClass}`} contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-4 pt-10">
        
        <Pressable onPress={() => router.replace('/(tabs)')} className="flex-row items-center gap-2 mb-6">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="text-sm text-gray-500">Back</Text>
        </Pressable>

        <View className="flex-row items-center gap-4 mb-6">
          <Text className="text-4xl">{subject.emoji}</Text>
          <View>
            <Text className="text-xl font-bold text-foreground">{subject.name}</Text>
            <Text className="text-sm text-gray-500">Diagnostic Test</Text>
          </View>
        </View>

        {loading && (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center justify-center shadow-sm">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {!loading && !isCompleted && (
          <View>
            {/* Progress bar */}
            <View className="flex-row gap-1 mb-6">
              {questions.map((q, i) => {
                let bgColor = 'bg-gray-200 dark:bg-gray-700';
                if (i === currentIndex) bgColor = 'bg-blue-500';
                else if (i < currentIndex) {
                  bgColor = answers[i] === q.correctOption ? 'bg-green-500' : 'bg-red-500';
                }
                return <View key={i} className={`h-2 flex-1 rounded-full ${bgColor}`} />;
              })}
            </View>

            {showQuarterIntro ? (
              <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center shadow-sm">
                <Text className="text-2xl font-bold text-foreground mb-2">Quarter {currentQuarter}</Text>
                <Text className="text-gray-500 text-center mb-6">
                  {QUARTER_TOPICS[subjectId]?.[currentQuarter - 1]}
                </Text>
                <Pressable 
                  onPress={beginQuarter} 
                  className="px-8 py-3 rounded-xl bg-blue-500"
                >
                  <Text className="text-white font-semibold">Begin</Text>
                </Pressable>
              </View>
            ) : currentQuestion ? (
              <View>
                <View className="items-center mb-4">
                  <View className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Q{((currentIndex % 5) + 1)} of 5 — Quarter {currentQuarter}
                    </Text>
                  </View>
                </View>

                <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                  <Text className="text-base font-semibold text-foreground mb-4">
                    {currentQuestion.questionText}
                  </Text>
                  <View className="gap-3">
                    {currentQuestion.options.map((opt, i) => {
                      const answered = answers[currentIndex] !== null;
                      const isSelected = answers[currentIndex] === i;
                      const isCorrect = i === currentQuestion.correctOption;
                      
                      let borderClass = 'border-gray-200 dark:border-gray-700';
                      let bgClass = 'bg-transparent';
                      let textClass = 'text-foreground';

                      if (answered) {
                        if (isCorrect) {
                          borderClass = 'border-green-500';
                          bgClass = 'bg-green-50 dark:bg-green-900/20';
                          textClass = 'text-green-700 dark:text-green-400';
                        } else if (isSelected) {
                          borderClass = 'border-red-500';
                          bgClass = 'bg-red-50 dark:bg-red-900/20';
                          textClass = 'text-red-700 dark:text-red-400';
                        } else {
                          textClass = 'text-gray-400';
                        }
                      } else {
                        borderClass = 'border-gray-200 dark:border-gray-700';
                      }

                      return (
                        <Pressable
                          key={i}
                          onPress={() => !answered && answerQuestion(i)}
                          className={`w-full p-4 rounded-xl border-2 ${borderClass} ${bgClass}`}
                        >
                          <Text className={`text-sm ${textClass}`}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Completion State */}
        {isCompleted && finalResult && (
          <View>
            {/* This will render once you convert the DiagnosticResultCard! */}
            <DiagnosticResultCard result={finalResult} />
            
            <Pressable
              onPress={() => router.replace(`/subject-view?subjectId=${subjectId}`)}
              className="w-full mt-6 py-4 rounded-xl bg-blue-500 items-center"
            >
              <Text className="text-white font-semibold text-lg">
                Start Learning {subject.name}
              </Text>
            </Pressable>
          </View>
        )}

        {isCompleted && !finalResult && (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-2xl items-center justify-center shadow-sm">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Saving your results...</Text>
          </View>
        )}
        
      </View>
    </ScrollView>
  );
}