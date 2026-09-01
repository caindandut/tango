import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  getStudyProgress,
  getStudyShufflePreference,
  saveStudyProgress,
} from '@/lib/studyProgress';
import useStudySession from '@/hooks/useStudySession';
import { studyApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  studyApi: {
    startSession: vi.fn(),
    getSession: vi.fn(),
    getCurrentWord: vi.fn(),
    nextWord: vi.fn(),
  },
}));

const currentWord = {
  id: 'word-1',
  hiragana: 'べんきょう',
  hiraganaLength: 5,
  currentIndex: 2,
  totalWords: 10,
};

describe('vocabulary study progress', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('keeps separate progress records for ordered and shuffled study', () => {
    saveStudyProgress('set-1', false, {
      sessionId: 'ordered-session',
      currentIndex: 2,
      totalWords: 10,
    });
    saveStudyProgress('set-1', true, {
      sessionId: 'shuffled-session',
      currentIndex: 4,
      totalWords: 10,
    });

    expect(getStudyProgress('set-1', false).sessionId).toBe('ordered-session');
    expect(getStudyProgress('set-1', true).sessionId).toBe('shuffled-session');
  });

  it('remembers the last study order selected for each lesson', () => {
    saveStudyProgress('set-1', true, { sessionId: 'shuffled-session' });

    expect(getStudyShufflePreference('set-1')).toBe(true);
  });

  it('resumes an unfinished session instead of creating a new one', async () => {
    saveStudyProgress('set-1', true, { sessionId: 'saved-session' });
    studyApi.getSession.mockResolvedValue({
      data: { sessionId: 'saved-session', isCompleted: false },
    });
    studyApi.getCurrentWord.mockResolvedValue({ data: currentWord });

    const { result } = renderHook(() => useStudySession());

    await act(async () => {
      await result.current.startSession('set-1', true);
    });

    expect(studyApi.startSession).not.toHaveBeenCalled();
    expect(studyApi.getSession).toHaveBeenCalledWith('saved-session');
    expect(result.current.sessionId).toBe('saved-session');
    expect(result.current.currentWord).toEqual(currentWord);
  });

  it('stores a newly created session for the next visit', async () => {
    studyApi.startSession.mockResolvedValue({
      data: { sessionId: 'new-session', isCompleted: false },
    });
    studyApi.getCurrentWord.mockResolvedValue({ data: currentWord });

    const { result } = renderHook(() => useStudySession());

    await act(async () => {
      await result.current.startSession('set-2', false);
    });

    expect(getStudyProgress('set-2', false)).toEqual({
      sessionId: 'new-session',
      currentIndex: 2,
      totalWords: 10,
    });
  });

  it('updates the saved position after moving to another word', async () => {
    const nextWord = { ...currentWord, currentIndex: 3 };
    studyApi.startSession.mockResolvedValue({
      data: { sessionId: 'progress-session', isCompleted: false },
    });
    studyApi.getCurrentWord
      .mockResolvedValueOnce({ data: currentWord })
      .mockResolvedValueOnce({ data: nextWord });
    studyApi.nextWord.mockResolvedValue({ data: { isCompleted: false } });

    const { result } = renderHook(() => useStudySession());

    await act(async () => {
      await result.current.startSession('set-3', true);
    });
    await act(async () => {
      await result.current.nextWord();
    });

    expect(getStudyProgress('set-3', true).currentIndex).toBe(3);
  });
});
