import { describe, expect, it } from 'vitest';
import { getFlashcardNextLabel, getStudyMeaningLines, isKatakanaVocabulary } from '../lib/studyPresentation.js';

describe('Katakana vocabulary presentation', () => {
  it('detects Katakana headwords without treating hiragana as Katakana', () => {
    expect(isKatakanaVocabulary({ kanji: 'アンテナ' })).toBe(true);
    expect(isKatakanaVocabulary({ kanji: '人生' })).toBe(false);
    expect(isKatakanaVocabulary({ kanji: 'いわゆる' })).toBe(false);
  });
});

describe('study meaning presentation', () => {
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
