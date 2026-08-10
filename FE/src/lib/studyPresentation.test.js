import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getKanaInputMode,
  getReadingCorrectAnswer,
  shouldShowMeaning,
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

test('keeps quiz meaning visible for vocabulary without Kanji when the setting is disabled', () => {
  assert.equal(
    shouldShowQuizMeaning(false, null, { kanji: '', hiragana: 'まとめる' }),
    true,
  );
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

test('uses Katakana input mode for Katakana readings', () => {
  assert.equal(getKanaInputMode({ hiragana: 'スーパー' }), 'toKatakana');
});

test('keeps Hiragana input mode for Hiragana readings', () => {
  assert.equal(getKanaInputMode({ hiragana: 'しつけ' }), 'toHiragana');
});

test('keeps meaning visible for vocabulary without Kanji when the setting is disabled', () => {
  assert.equal(
    shouldShowMeaning(false, { kanji: '', hiragana: 'まとめる' }, null),
    true,
  );
});

test('hides meaning for Kanji vocabulary when the setting is disabled before answering', () => {
  assert.equal(
    shouldShowMeaning(false, { kanji: '湿気', hiragana: 'しっけ' }, null),
    false,
  );
});
