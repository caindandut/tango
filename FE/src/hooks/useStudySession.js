import { useState, useCallback } from 'react';
import { studyApi } from '@/lib/api';

/**
 * Custom hook to manage the entire study session flow
 */
export function useStudySession() {
  const [sessionId, setSessionId] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [totalChars, setTotalChars] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const startSession = useCallback(async (setId, shuffle = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await studyApi.startSession(setId, shuffle);
      setSessionId(data.sessionId);
      setIsCompleted(false);
      setResults(null);

      // Fetch first word
      const wordRes = await studyApi.getCurrentWord(data.sessionId);
      setCurrentWord(wordRes.data);
      setHintsUsed(0);
      setHintText('');
      setTotalChars(wordRes.data.hiraganaLength);
      setCheckResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAnswer = useCallback(async (answer) => {
    if (!sessionId || isChecking) return;
    setIsChecking(true);
    try {
      const { data } = await studyApi.checkAnswer(sessionId, answer, hintsUsed);
      setCheckResult(data);

      // Update current word counts
      if (currentWord) {
        setCurrentWord(prev => ({
          ...prev,
          correctCount: data.isCorrect ? (prev.correctCount || 0) + 1 : prev.correctCount,
          wrongCount: !data.isCorrect ? (prev.wrongCount || 0) + 1 : prev.wrongCount,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check answer');
    } finally {
      setIsChecking(false);
    }
  }, [sessionId, hintsUsed, isChecking, currentWord]);

  const getHint = useCallback(async () => {
    if (!sessionId) return;
    const nextReveal = hintsUsed + 1;
    try {
      const { data } = await studyApi.getHint(sessionId, nextReveal);
      setHintText(data.hint);
      setHintsUsed(nextReveal);
      setTotalChars(data.totalChars);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get hint');
    }
  }, [sessionId, hintsUsed]);

  const nextWord = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const { data: nextData } = await studyApi.nextWord(sessionId);

      if (nextData.isCompleted) {
        setIsCompleted(true);
        const { data: resultData } = await studyApi.getResults(sessionId);
        setResults(resultData);
        setCurrentWord(null);
      } else {
        const { data: wordData } = await studyApi.getCurrentWord(sessionId);
        setCurrentWord(wordData);
        setTotalChars(wordData.hiraganaLength);
      }

      setCheckResult(null);
      setHintsUsed(0);
      setHintText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move to next word');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const previousWord = useCallback(async () => {
    if (!sessionId || !currentWord || currentWord.currentIndex <= 0) return;
    setIsLoading(true);
    try {
      await studyApi.previousWord(sessionId);
      const { data: wordData } = await studyApi.getCurrentWord(sessionId);
      setCurrentWord(wordData);
      setTotalChars(wordData.hiraganaLength);
      setCheckResult(null);
      setHintsUsed(0);
      setHintText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move to previous word');
    } finally {
      setIsLoading(false);
    }
  }, [currentWord, sessionId]);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setCurrentWord(null);
    setCheckResult(null);
    setHintsUsed(0);
    setHintText('');
    setTotalChars(0);
    setIsLoading(false);
    setIsChecking(false);
    setIsCompleted(false);
    setResults(null);
    setError(null);
  }, []);

  return {
    sessionId,
    currentWord,
    checkResult,
    hintsUsed,
    hintText,
    totalChars,
    isLoading,
    isChecking,
    isCompleted,
    results,
    error,
    startSession,
    checkAnswer,
    getHint,
    nextWord,
    previousWord,
    resetSession,
  };
}

export default useStudySession;
