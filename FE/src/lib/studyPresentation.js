export function shouldShowQuizMeaning(showMeaning, checkResult) {
  return showMeaning || checkResult?.isCorrect === true;
}

export function getReadingCorrectAnswer(checkResult, currentWord) {
  return checkResult?.correctAnswer || currentWord?.hiragana || '';
}
