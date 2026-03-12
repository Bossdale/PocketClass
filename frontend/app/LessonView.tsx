import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Volume2, CheckCircle2, Star } from 'lucide-react-native';
import { speak, stopSpeaking } from '../lib/tts';

import { getLessonById, completeLesson, getProfile, saveLessonQuizResult, getLessonQuizResults, generateId } from '../lib/store';
import { generateLessonQuiz, getAIExplanation } from '../lib/quizService';
import type { QuizQuestion, Profile } from '../lib/types';

import QuizRenderer from '../components/QuizRenderer';
import AITutor from '../components/AITutor';

const colors = {
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  foreground: '#111827',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  green100: '#dcfce7',
  green500: '#22c55e',
  green700: '#15803d',
  yellow100: '#fef9c3',
  yellow500: '#eab308',
  yellow700: '#a16207',
  red100: '#fee2e2',
  red700: '#b91c1c',
  success: '#16a34a',
};

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
  const[hardScore, setHardScore] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [ttsState, setTtsState] = useState<'idle' | 'speaking' | 'loading'>('idle');

  const lesson = lessonId ? getLessonById(lessonId as string) : undefined;

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
    }
    load();
    return () => {
      stopSpeaking();
    };
  },[]);

  if (!lesson || !profile || !lessonId) return <View style={styles.container} />;

  const stripMarkdown = (text: string) =>
    text.replace(/^#{1,2}\s*/gm, '').replace(/\*\*/g, '').replace(/^>\s*/gm, '').replace(/^-\s*/gm, '').trim();

  const handleTTS = async () => {
  if (ttsState !== 'idle') {
    stopSpeaking();
    setTtsState('idle');
    return;
  }

  const text = stripMarkdown(lesson.sections[currentSection].content);
  setTtsState('speaking');

  speak(text, {
    onDone: () => {
      const fetchExplanation = async () => {
        setTtsState('loading');
        try {
          const explanation = await getAIExplanation(text, profile.grade);
          setTtsState('speaking');
          speak(explanation, {
            onDone: () => setTtsState('idle'),
            onError: () => setTtsState('idle'),
          });
        } catch {
          setTtsState('idle');
        }
      };
      fetchExplanation();
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

  // Native Markdown Parser using StyleSheet
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <Text key={i} style={styles.markdownH1}>{line.substring(2)}</Text>;
      }
      if (line.startsWith('## ')) {
        return <Text key={i} style={styles.markdownH2}>{line.substring(3)}</Text>;
      }
      if (line.startsWith('> ')) {
        return (
          <View key={i} style={styles.markdownBlockquote}>
            <Text style={styles.markdownBlockquoteText}>{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <View key={i} style={styles.markdownListItem}>
            <Text style={styles.markdownListBullet}>•</Text>
            <Text style={styles.markdownListText}>{line.substring(2)}</Text>
          </View>
        );
      }
      if (line.trim() === '') return <View key={i} style={styles.markdownSpacer} />;
      
      return <Text key={i} style={styles.markdownParagraph}>{line}</Text>;
    });
  };

  const getDifficultyBadge = () => {
    if (!questions[currentQ]) return null;
    const d = questions[currentQ].difficulty;
    
    let bg = colors.green100;
    let text = colors.green700;
    if (d === 'medium') { bg = colors.yellow100; text = colors.yellow700; }
    if (d === 'hard') { bg = colors.red100; text = colors.red700; }

    return (
      <View style={[styles.difficultyBadge, { backgroundColor: bg }]}>
        <Text style={[styles.difficultyText, { color: text }]}>{d}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.mutedForeground} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.lessonTitle}>{lesson.title}</Text>

        {mode === 'content' && (
          <View>
            {/* Section progress */}
            <View style={styles.progressContainer}>
              {lesson.sections.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.progressSegment, 
                    { backgroundColor: i <= currentSection ? colors.primary : colors.gray200 }
                  ]} 
                />
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTrackerText}>
                  Section {currentSection + 1} of {lesson.sections.length}
                </Text>
                <TouchableOpacity
                  onPress={handleTTS}
                  style={[
                    styles.ttsButton, 
                    { backgroundColor: ttsState === 'speaking' ? colors.primaryLight : colors.gray100 }
                  ]}
                >
                  {ttsState === 'loading' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Volume2 size={20} color={ttsState === 'speaking' ? colors.primary : colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              
              {renderContent(lesson.sections[currentSection].content)}
            </View>

            <View style={styles.navigationButtons}>
              {currentSection > 0 && (
                <TouchableOpacity
                  onPress={() => setCurrentSection(currentSection - 1)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>← Previous</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (currentSection < lesson.sections.length - 1) setCurrentSection(currentSection + 1);
                  else startQuiz();
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {currentSection < lesson.sections.length - 1 ? 'Next Section →' : '🎯 Take Quiz'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === 'quiz' && (
          <View>
            {loadingQuiz ? (
              <View style={styles.cardCentered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Generating adaptive quiz based on the lesson...</Text>
              </View>
            ) : questions.length > 0 && currentQ < questions.length ? (
              <View>
                <View style={styles.badgeContainer}>{getDifficultyBadge()}</View>
                <Text style={styles.questionTrackerText}>
                  Question {currentQ + 1} of {questions.length}
                </Text>
                <View style={styles.card}>
                  <QuizRenderer question={questions[currentQ]} onAnswer={handleAnswer} />
                </View>
              </View>
            ) : null}
          </View>
        )}

        {mode === 'complete' && (
          <View style={styles.cardCentered}>
            <View style={styles.successIconContainer}>
              <CheckCircle2 size={40} color={colors.success} />
            </View>
            <Text style={styles.completeTitle}>Lesson Complete! 🎉</Text>
            <Text style={styles.completeScore}>{totalScore}%</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3].map(s => (
                <Star 
                  key={s} 
                  size={32} 
                  color={s <= stars ? colors.yellow500 : colors.gray300} 
                  fill={s <= stars ? colors.yellow500 : "transparent"} 
                />
              ))}
            </View>
            
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.primaryButtonFull}
            >
              <Text style={styles.primaryButtonTextFull}>Continue Learning</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Show AI Tutor ONLY during 'content' mode */}
      {mode === 'content' && (
        <View style={styles.tutorContainer}>
          <AITutor lessonId={lessonId as string} lessonTitle={lesson.title} />
        </View>
      )}
    </View>
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
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 24,
  },
  
  // Section Progress Bar
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
  },
  progressSegment: {
    height: 6,
    flex: 1,
    borderRadius: 3,
  },

  // Main Card
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
  cardCentered: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTrackerText: {
    fontSize: 12,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ttsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Navigation Buttons
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.gray700,
    fontWeight: '600',
    fontSize: 14,
  },

  // Quiz State
  loadingText: {
    color: colors.gray500,
    marginTop: 16,
    textAlign: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  questionTrackerText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Complete State
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  completeScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  primaryButtonFull: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonTextFull: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 18,
  },

  // AI Tutor FAB Container
  tutorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    pointerEvents: 'box-none',
  },

  // Markdown Styles
  markdownH1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 12,
  },
  markdownH2: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  markdownBlockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    backgroundColor: colors.primaryLight,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 12,
    marginVertical: 12,
  },
  markdownBlockquoteText: {
    fontSize: 14,
    color: colors.gray700,
    fontStyle: 'italic',
  },
  markdownListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingLeft: 8,
  },
  markdownListBullet: {
    color: colors.foreground,
    marginRight: 8,
    fontSize: 14,
  },
  markdownListText: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
    lineHeight: 20,
  },
  markdownParagraph: {
    fontSize: 14,
    color: colors.foreground,
    marginVertical: 8,
    lineHeight: 22,
  },
  markdownSpacer: {
    height: 8,
  },
});