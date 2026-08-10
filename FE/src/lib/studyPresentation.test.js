import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getReadingCorrectAnswer,
  shouldShowQuizMeaning,
} from './studyPresentation.js';

test('shows quiz meaning immediately when the setting is enabled', () => {
  assert.equal(shouldShowQuizMeaning(true, null), true);
});

test('keeps quiz meaning hidden before answering when the setting is disabled', () => {
  assert.equal(shouldShowQuizMeaning(false, null), false);
});

test('keeps quiz meaning hidden after an incorrect answer when the setting is disabled', () => {
  assert.equal(shouldShowQuizMeaning(false, { isCorrect: false }), false);
});

test('reveals quiz meaning after a correct answer when the setting is disabled', () => {
  assert.equal(shouldShowQuizMeaning(false, { isCorrect: true }), true);
});

test('uses the current word reading when the check response omits the correct answer', () => {
  assert.equal(
    getReadingCorrectAnswer({ isCorrect: false }, { hiragana: 'しつけ' }),
    'しつけ',
  );
});
