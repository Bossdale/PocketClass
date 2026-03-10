import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Volume2, CheckCircle2, Star } from 'lucide-react-native';
import * as Speech from 'expo-speech'; // Use native text-to-speech!

import { getLessonById, completeLesson, getProfile, saveLessonQuizResult, getLessonQuizResults, generateId } from '../lib/store';
import { getCountryClass } from '../lib/types';
import { generateLessonQuiz, getAIExplanation } from '../lib/quizService';
import type { QuizQuestion, Profile } from '../lib/types';

// We will convert these in the final step!
import QuizRenderer from '../components/QuizRenderer';
import AITutor from '../components/AITutor';

export default function LessonView() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [mode, setMode] = useState<'content' | 'quiz' | 'complete'>('content');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [easyScore, setEasyScore] = useState(0);
  const [mediumScore, setMediumScore] = useState(0);
  const [hardScore, setHardScore] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'speaking' | 'loading'>('idle');

  const lesson = lessonId ? getLessonById(lessonId as string) : undefined;

  // Load the async profile
  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
    }
    load();
  }, []);

  if (!lesson || !profile || !lessonId) return <View className="flex-1 bg-background" />;
  const countryClass = getCountryClass(profile.country);

  const stripMarkdown = (text: string) =>
    text.replace(/^#{1,2}\s*/gm, '').replace(/\*\*/g, '').replace(/^>\s*/gm, '').replace(/^-\s*/gm, '').trim();

  const handleTTS = async () => {
    if (ttsState !== 'idle') {
      Speech.stop();
      setTtsState('idle');
      return;
    }
    
    const text = stripMarkdown(lesson.sections[currentSection].content);
    setTtsState('speaking');
    
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      onDone: async () => {
        setTtsState('loading');
        try {
          const explanation = await getAIExplanation(text, profile.grade);
          setTtsState('speaking');
          Speech.speak(explanation, {
            rate: 0.9,
            pitch: 1.0,
            onDone: () => setTtsState('idle'),
            onError: () => setTtsState('idle'),
          });
        } catch (e) {
          setTtsState('idle');
        }
      },
      onError: () => setTtsState('idle'),
    });
  };

  const startQuiz = async () => {
    setLoadingQuiz(true);
    setMode('quiz');
    const content = lesson.sections.map(s => s.content).join('\n');
    const qs = await generateLessonQuiz(lesson.title, content, profile.grade, profile.country);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setEasyScore(0);
    setMediumScore(0);
    setHardScore(0);
    setLoadingQuiz(false);
  };

  const handleAnswer = async (correct: boolean) => {
    let newScore = score;
    let newEasy = easyScore;
    let newMedium = mediumScore;
    let newHard = hardScore;

    if (correct) {
      newScore += 1;
      setScore(newScore);
      const q = questions[currentQ];
      if (q.difficulty === 'easy') { newEasy += 1; setEasyScore(newEasy); }
      else if (q.difficulty === 'medium') { newMedium += 1; setMediumScore(newMedium); }
      else { newHard += 1; setHardScore(newHard); }
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      // Quiz complete - Use async storage updates!
      const totalScore = Math.round(((correct ? score + 1 : score) / questions.length) * 100);
      const prevResults = await getLessonQuizResults(lessonId as string);
      
      await saveLessonQuizResult({
        id: generateId(),
        lessonId: lessonId as string,
        userId: profile.id,
        score: totalScore,
        totalQuestions: questions.length,
        easyScore: newEasy,
        mediumScore: newMedium,
        hardScore: newHard,
        completedAt: new Date().toISOString(),
        attemptNumber: prevResults.length + 1,
      });
      
      await completeLesson(lessonId as string, totalScore);
      setMode('complete');
    }
  };

  const totalScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const stars = totalScore >= 80 ? 3 : totalScore >= 50 ? 2 : 1;

  // Native Markdown Parser
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <Text key={i} className="text-2xl font-bold mb-3 mt-4 text-foreground">{line.substring(2)}</Text>;
      }
      if (line.startsWith('## ')) {
        return <Text key={i} className="text-xl font-semibold mt-4 mb-2 text-foreground">{line.substring(3)}</Text>;
      }
      if (line.startsWith('> ')) {
        return (
          <View key={i} className="border-l-4 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg py-3 my-3">
            <Text className="text-sm text-gray-700 dark:text-gray-300 italic">{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <View key={i} className="flex-row items-start my-1 pl-2">
            <Text className="text-foreground mr-2">•</Text>
            <Text className="text-sm text-foreground flex-1">{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.trim() === '') return <View key={i} className="h-2" />;
      
      return <Text key={i} className="text-sm text-foreground my-2 leading-relaxed">{line}</Text>;
    });
  };

  const getDifficultyBadge = () => {
    if (!questions[currentQ]) return null;
    const d = questions[currentQ].difficulty;
    const bg = d === 'easy' ? 'bg-green-100' : d === 'medium' ? 'bg-yellow-100' : 'bg-red-100';
    const text = d === 'easy' ? 'text-green-700' : d === 'medium' ? 'text-yellow-700' : 'text-red-700';
    return (
      <View className={`px-3 py-1 rounded-full ${bg}`}>
        <Text className={`text-xs font-medium ${text}`}>{d}</Text>
      </View>
    );
  };

  return (
    <View className={`flex-1 bg-background ${countryClass}`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 pt-10">
          <Pressable onPress={() => router.replace(`/subject-view?subjectId=${lesson.subjectId}`)} className="flex-row items-center gap-2 mb-4">
            <ArrowLeft size={20} color="#6b7280" />
            <Text className="text-sm text-gray-500">Back</Text>
          </Pressable>

          <Text className="text-2xl font-bold text-foreground mb-6">{lesson.title}</Text>

          {mode === 'content' && (
            <View>
              {/* Section progress */}
              <View className="flex-row gap-1 mb-6">
                {lesson.sections.map((_, i) => (
                  <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentSection ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </View>

              <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <Text className="text-xs text-gray-500 uppercase tracking-wider">
                    Section {currentSection + 1} of {lesson.sections.length}
                  </Text>
                  <Pressable
                    onPress={handleTTS}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${ttsState === 'speaking' ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    {ttsState === 'loading' ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Volume2 size={20} color={ttsState === 'speaking' ? '#3b82f6' : '#6b7280'} />
                    )}
                  </Pressable>
                </View>
                
                {renderContent(lesson.sections[currentSection].content)}
              </View>

              <View className="flex-row gap-3 mt-6">
                {currentSection > 0 && (
                  <Pressable
                    onPress={() => setCurrentSection(currentSection - 1)}
                    className="flex-1 py-4 rounded-xl bg-gray-200 dark:bg-gray-800 items-center"
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-semibold">← Previous</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    if (currentSection < lesson.sections.length - 1) setCurrentSection(currentSection + 1);
                    else startQuiz();
                  }}
                  className="flex-1 py-4 rounded-xl bg-blue-500 items-center"
                >
                  <Text className="text-white font-semibold">
                    {currentSection < lesson.sections.length - 1 ? 'Next Section →' : '🎯 Take Quiz'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'quiz' && (
            <View>
              {loadingQuiz ? (
                <View className="bg-white dark:bg-gray-800 p-8 rounded-2xl items-center shadow-sm">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-gray-500 mt-4 text-center">Generating adaptive quiz based on the lesson...</Text>
                </View>
              ) : questions.length > 0 && currentQ < questions.length ? (
                <View>
                  <View className="flex-row justify-center mb-4">{getDifficultyBadge()}</View>
                  <Text className="text-xs text-gray-500 text-center mb-4">
                    Question {currentQ + 1} of {questions.length}
                  </Text>
                  <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                    {/* Requires QuizRenderer to be converted! */}
                    <QuizRenderer question={questions[currentQ]} onAnswer={handleAnswer} />
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {mode === 'complete' && (
            <View className="bg-white dark:bg-gray-800 p-8 rounded-2xl items-center shadow-sm">
              <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4">
                <CheckCircle2 size={40} color="#22c55e" />
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">Lesson Complete! 🎉</Text>
              <Text className="text-4xl font-bold text-blue-500 mb-4">{totalScore}%</Text>
              
              <View className="flex-row justify-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                  <Star 
                    key={s} 
                    size={32} 
                    color={s <= stars ? "#eab308" : "#d1d5db"} 
                    fill={s <= stars ? "#eab308" : "transparent"} 
                  />
                ))}
              </View>
              
              <Pressable
                onPress={() => router.replace(`/subject-view?subjectId=${lesson.subjectId}`)}
                className="w-full py-4 rounded-xl bg-blue-500 items-center"
              >
                <Text className="text-white font-semibold text-lg">Continue Learning</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {mode !== 'complete' && (
        <View className="absolute bottom-4 right-4">
           {/* Requires AITutor to be converted! */}
          <AITutor lessonId={lessonId as string} lessonTitle={lesson.title} />
        </View>
      )}
    </View>
  );
}