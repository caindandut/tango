import { isKatakana } from 'wanakana';

const KANJI_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const KATAKANA_PATTERN = /^[\s\u30a0-\u30ffー・]+$/u;

function isKanaOnlyVocabulary(currentWord) {
  return Boolean(currentWord) && !KANJI_PATTERN.test(currentWord.kanji?.trim() || '');
}

export function isKatakanaVocabulary(currentWord) {
  const headword = currentWord?.kanji?.trim() || '';
  return Boolean(headword) && KATAKANA_PATTERN.test(headword)
    && /[\u30a1-\u30fa]/u.test(headword);
}

export function shouldShowMeaning(showMeaning, currentWord, checkResult) {
  return showMeaning || isKanaOnlyVocabulary(currentWord) || checkResult != null;
}

export function shouldShowHanVietMeaning(showHanVietMeaning, _checkResult, currentWord) {
  return Boolean(showHanVietMeaning && typeof currentWord?.hanVietMeaning === 'string'
    && currentWord.hanVietMeaning.trim());
}

export function shouldShowQuizMeaning(showMeaning, checkResult, currentWord) {
  return showMeaning || isKanaOnlyVocabulary(currentWord) || checkResult?.isCorrect === true;
}

export function getStudyMeaningLines({ meaning, hanVietMeaning, showHanVietMeaning }) {
  const lines = [];

  if (showHanVietMeaning && typeof hanVietMeaning === 'string' && hanVietMeaning.trim()) {
    lines.push({ type: 'hanViet', value: hanVietMeaning });
  }

  if (typeof meaning === 'string' && meaning.trim()) {
    lines.push(...splitKatakanaMeaning(meaning));
  }

  return lines;
}

function splitKatakanaMeaning(meaning) {
  const value = meaning.trim();
  const englishStart = value.search(/[A-Za-z]/u);
  if (englishStart <= 0) return [{ type: 'meaning', value: meaning }];

  const headwordLine = value.slice(0, englishStart).trim();
  if (!/^[\s_＿\u30a0-\u30ffー・]+$/u.test(headwordLine)) {
    return [{ type: 'meaning', value: meaning }];
  }

  const remainder = value.slice(englishStart).trim();
  const vietnameseStart = remainder.search(/\s+(?=[A-ZÀ-ÝĐ][a-zà-ỹđ])/u);
  if (vietnameseStart < 0) {
    return [
      { type: 'meaning', value: headwordLine },
      { type: 'meaning', value: remainder },
    ];
  }

  return [
    { type: 'meaning', value: headwordLine },
    { type: 'meaning', value: remainder.slice(0, vietnameseStart).trim() },
    { type: 'meaning', value: remainder.slice(vietnameseStart).trim() },
  ].filter((line) => line.value);
}

export function getKanaInputMode(currentWord) {
  return isKatakana(currentWord?.hiragana?.trim() || '') ? 'toKatakana' : 'toHiragana';
}

export function getReadingCorrectAnswer(checkResult, currentWord) {
  return checkResult?.correctAnswer || currentWord?.hiragana || '';
}

export function getFlashcardNextLabel(currentIndex, totalWords) {
  return currentIndex + 1 === totalWords ? 'Hoàn thành' : 'Tiếp';
}
