import { isKatakana } from 'wanakana';

function isKanaOnlyVocabulary(currentWord) {
  return Boolean(currentWord) && !/[一-龯々]/u.test(currentWord.kanji?.trim() || '');
}

export function shouldShowMeaning(showMeaning, currentWord, checkResult) {
  return showMeaning || isKanaOnlyVocabulary(currentWord) || checkResult != null;
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
    lines.push({ type: 'meaning', value: meaning });
  }

  return lines;
}

export function getKanaInputMode(currentWord) {
  return isKatakana(currentWord?.hiragana?.trim() || '') ? 'toKatakana' : 'toHiragana';
}

export function getReadingCorrectAnswer(checkResult, currentWord) {
  return checkResult?.correctAnswer || currentWord?.hiragana || '';
}
