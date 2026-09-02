import { describe, expect, it } from 'vitest';
import { getFlashcardNextLabel, getStudyLessonTitle, getStudyMeaningLines, isKatakanaVocabulary, shouldShowHanVietMeaning } from '../lib/studyPresentation.js';

describe('study lesson title presentation', () => {
  it('uses the lesson name supplied by the study session', () => {
    expect(getStudyLessonTitle({
      lessonTitle: 'Unit 01 - 人生 - 1–50 - Từ vựng N2 Mimikara',
    })).toBe('Unit 01 - 人生 - 1–50 - Từ vựng N2 Mimikara');
  });

  it('falls back to a useful title when older payloads have no lesson metadata', () => {
    expect(getStudyLessonTitle({})).toBe('Bài học từ vựng');
  });
});

describe('Katakana vocabulary presentation', () => {
  it('detects Katakana headwords without treating hiragana as Katakana', () => {
    expect(isKatakanaVocabulary({ kanji: 'アンテナ' })).toBe(true);
    expect(isKatakanaVocabulary({ kanji: '人生' })).toBe(false);
    expect(isKatakanaVocabulary({ kanji: 'いわゆる' })).toBe(false);
  });
});

describe('study meaning presentation', () => {
  it('keeps Han-Viet hidden when the setting is off even after answering', () => {
    expect(shouldShowHanVietMeaning(false, { isCorrect: true }, { hanVietMeaning: '\u004e\u1eef T\u00cdNH' })).toBe(false);
    expect(shouldShowHanVietMeaning(true, null, { hanVietMeaning: '\u004e\u1eef T\u00cdNH' })).toBe(true);
  });

  it('places Han-Viet meaning before the Vietnamese meaning without a label', () => {
    const lines = getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: 'NỮ TÍNH',
      showHanVietMeaning: true,
    });

    expect(lines).toEqual([
      { type: 'hanViet', value: 'NỮ TÍNH' },
      { type: 'meaning', value: 'Nữ giới' },
    ]);
    expect(lines.map((line) => line.value).join(' ')).not.toContain('Hán–Việt:');
  });

  it('omits Han-Viet meaning when the setting is disabled or the value is empty', () => {
    expect(getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: 'NỮ TÍNH',
      showHanVietMeaning: false,
    })).toEqual([{ type: 'meaning', value: 'Nữ giới' }]);

    expect(getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: '   ',
      showHanVietMeaning: true,
    })).toEqual([{ type: 'meaning', value: 'Nữ giới' }]);
  });
});

it('keeps the flashcard next label stable while loading', () => {
  expect(getFlashcardNextLabel(0, 2)).toBe('Tiếp');
  expect(getFlashcardNextLabel(1, 2)).toBe('Hoàn thành');
});
