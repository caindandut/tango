export function shouldShowQuizMeaning(showMeaning, checkResult) {
  return showMeaning || checkResult?.isCorrect === true;
}
