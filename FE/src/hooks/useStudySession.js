import { useState, useCallback, useRef } from 'react';
import { studyApi } from '@/lib/api';
import { clearStudyProgress, getStudyProgress, saveStudyProgress } from '@/lib/studyProgress';

/**
 * Custom hook to manage the entire study session flow
 */
export function useStudySession() {
  const studyConfigRef = useRef(null);
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

  const startSession = useCallback(async (setId, shuffle = false, mode = 'reading') => {
    setIsLoading(true);
    setError(null);
    studyConfigRef.current = { setId, shuffle };
    try {
      const savedProgress = getStudyProgress(setId, shuffle);
      let data;

      if (savedProgress?.sessionId) {
        try {
          const resumedSession = await studyApi.getSession(savedProgress.sessionId);
          if (!resumedSession.data.isCompleted) {
            if (resumedSession.data.mode && resumedSession.data.mode !== mode) {
              await studyApi.changeMode(savedProgress.sessionId, mode);
            }
            data = { ...resumedSession.data, mode };
          } else {
            clearStudyProgress(setId, shuffle);
          }
        } catch (resumeError) {
          if (resumeError.response?.status !== 404) throw resumeError;
          clearStudyProgress(setId, shuffle);
        }
      }

      if (!data) {
        const startedSession = await studyApi.startSession(setId, shuffle, mode);
        data = startedSession.data;
        saveStudyProgress(setId, shuffle, { sessionId: data.sessionId });
      }

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
      saveStudyProgress(setId, shuffle, {
        sessionId: data.sessionId,
        currentIndex: wordRes.data.currentIndex,
        totalWords: wordRes.data.totalWords,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAnswer = useCallback(async (answer, answerHintsUsed = hintsUsed) => {
    if (!sessionId || isChecking) return;
    setIsChecking(true);
    setError(null);
    try {
      const { data } = await studyApi.checkAnswer(sessionId, answer, answerHintsUsed);
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

  const changeMode = useCallback(async (mode) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    try {
      await studyApi.changeMode(sessionId, mode);
      const { data: wordData } = await studyApi.getCurrentWord(sessionId);
      setCurrentWord(wordData);
      setTotalChars(wordData.hiraganaLength);
      setCheckResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change study mode');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const getHint = useCallback(async () => {
    if (!sessionId) return;
    const nextReveal = hintsUsed + 1;
    setError(null);
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
    setError(null);
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
        const config = studyConfigRef.current;
        if (config) {
          saveStudyProgress(config.setId, config.shuffle, {
            sessionId,
            currentIndex: wordData.currentIndex,
            totalWords: wordData.totalWords,
          });
        }
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
    setError(null);
    try {
      await studyApi.previousWord(sessionId);
      const { data: wordData } = await studyApi.getCurrentWord(sessionId);
      setCurrentWord(wordData);
      setTotalChars(wordData.hiraganaLength);
      const config = studyConfigRef.current;
      if (config) {
        saveStudyProgress(config.setId, config.shuffle, {
          sessionId,
          currentIndex: wordData.currentIndex,
          totalWords: wordData.totalWords,
        });
      }
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
    changeMode,
    checkAnswer,
    getHint,
    nextWord,
    previousWord,
    resetSession,
  };
}

export default useStudySession;
