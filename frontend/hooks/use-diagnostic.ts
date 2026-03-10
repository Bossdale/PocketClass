import { useState, useEffect, useCallback } from 'react';
import type { DiagnosticQuestion } from '../lib/types';
import { generateDiagnosticQuestions } from '../lib/quizService';
import { getProfile } from '../lib/store';
import { QUARTER_TOPICS } from '../lib/types';

export function useDiagnostic(subjectId: string, subjectName: string) {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showQuarterIntro, setShowQuarterIntro] = useState(true);
  const [currentQuarter, setCurrentQuarter] = useState(1);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    // ✅ ADDED AWAIT HERE because getProfile now uses AsyncStorage
    const profile = await getProfile(); 
    const topics = QUARTER_TOPICS[subjectId] || ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'];
    const qs = await generateDiagnosticQuestions(
      subjectName,
      topics,
      profile?.grade || 7,
      profile?.country || 'indonesia'
    );
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setCurrentQuarter(1);
    setShowQuarterIntro(true);
    setLoading(false);
  }, [subjectId, subjectName]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const answerQuestion = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        const nextQuarter = questions[nextIndex]?.quarter;
        if (nextQuarter !== currentQuarter) {
          setCurrentQuarter(nextQuarter);
          setShowQuarterIntro(true);
        }
        setCurrentIndex(nextIndex);
      } else {
        setCurrentIndex(nextIndex); // past end = completed
      }
    }, 800);
  };

  const beginQuarter = () => {
    setShowQuarterIntro(false);
  };

  const getQuarterScores = () => {
    const scores = { q1: 0, q2: 0, q3: 0, q4: 0 };
    questions.forEach((q, i) => {
      if (answers[i] === q.correctOption) {
        const key = `q${q.quarter}` as keyof typeof scores;
        scores[key] += 20; // 5 questions per quarter, each worth 20%
      }
    });
    return scores;
  };

  const isCompleted = currentIndex >= questions.length && questions.length > 0;

  return {
    questions,
    loading,
    currentIndex,
    answers,
    showQuarterIntro,
    currentQuarter,
    isCompleted,
    answerQuestion,
    beginQuarter,
    getQuarterScores,
    reload: loadQuestions,
  };
}