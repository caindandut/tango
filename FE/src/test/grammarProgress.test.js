import { beforeEach, describe, expect, it } from 'vitest';
import {
  countCompletedDays,
  formatRemainingTime,
  getDayProgress,
  readGrammarProgress,
  updateGrammarDay,
} from '@/lib/grammarProgress';

describe('grammar progress', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists the current question and completed days', () => {
    updateGrammarDay('w1d1', (previous) => ({ ...previous, currentQuestionIndex: 2 }));
    updateGrammarDay('w1d2', (previous) => ({ ...previous, completed: true }));

    expect(getDayProgress('w1d1').currentQuestionIndex).toBe(2);
    expect(countCompletedDays([{ id: 'w1d1' }, { id: 'w1d2' }])).toBe(1);
    expect(readGrammarProgress().version).toBe(1);
  });

  it('formats timer values with a safe zero floor', () => {
    expect(formatRemainingTime(899)).toBe('14:59');
    expect(formatRemainingTime(-4)).toBe('00:00');
  });
});
