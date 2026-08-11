const { validateGrammarCurriculum } = require('./validateGrammarCurriculum');

const PRIVATE_QUESTION_FIELDS = new Set([
  'correctOptionId',
  'correctOrder',
  'explanationVi',
  'correctSentenceJa',
  'sourceExplanationJa',
]);

class GrammarServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'GrammarServiceError';
    this.status = status;
    this.code = code;
  }
}

function publicClone(value) {
  if (Array.isArray(value)) return value.map(publicClone);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_QUESTION_FIELDS.has(key))
      .map(([key, child]) => [key, publicClone(child)]),
  );
}

function validateIndex(value, min, max, code, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new GrammarServiceError(400, code, `${label} phải nằm trong khoảng ${min}–${max}.`);
  }
}

function validateAnswerId(answerOptionId) {
  if (typeof answerOptionId !== 'string' || !['A', 'B', 'C', 'D'].includes(answerOptionId)) {
    throw new GrammarServiceError(400, 'INVALID_ANSWER', 'Đáp án phải là A, B, C hoặc D.');
  }
}

function resultForQuestion(question, selectedOptionId) {
  return {
    questionId: question.id,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    isCorrect: selectedOptionId === question.correctOptionId,
    explanationVi: question.explanationVi,
    ...(question.correctSentenceJa ? { correctSentenceJa: question.correctSentenceJa } : {}),
    ...(question.sourceExplanationJa ? { sourceExplanationJa: question.sourceExplanationJa } : {}),
  };
}

function createGrammarService(curriculum) {
  validateGrammarCurriculum(curriculum);

  function getWeekPrivate(weekNumber) {
    validateIndex(weekNumber, 1, 6, 'INVALID_WEEK', 'Tuần');
    return curriculum.weeks[weekNumber - 1];
  }

  function getDayPrivate(weekNumber, dayNumber) {
    validateIndex(dayNumber, 1, 7, 'INVALID_DAY', 'Ngày');
    return getWeekPrivate(weekNumber).days[dayNumber - 1];
  }

  return {
    listWeeks() {
      return {
        weeks: curriculum.weeks.map((week) => ({
          weekNumber: week.weekNumber,
          titleVi: week.titleVi,
          days: week.days.map((day) => ({
            id: day.id,
            dayNumber: day.dayNumber,
            kind: day.kind,
            titleVi: day.titleVi,
            grammarPointCount: day.grammarPoints?.length || 0,
            questionCount: day.questions.length,
            ...(day.kind === 'REVIEW' ? {
              timeLimitSeconds: day.timeLimitSeconds,
              maxScore: day.maxScore,
            } : {}),
          })),
        })),
      };
    },

    getWeek(weekNumber) {
      const week = getWeekPrivate(weekNumber);
      return publicClone({
        weekNumber: week.weekNumber,
        titleVi: week.titleVi,
        days: week.days.map((day) => ({
          id: day.id,
          weekNumber: day.weekNumber,
          dayNumber: day.dayNumber,
          kind: day.kind,
          titleVi: day.titleVi,
          grammarPointCount: day.grammarPoints?.length || 0,
          questionCount: day.questions.length,
          ...(day.kind === 'REVIEW' ? {
            timeLimitSeconds: day.timeLimitSeconds,
            maxScore: day.maxScore,
          } : {}),
        })),
      });
    },

    getDay(weekNumber, dayNumber) {
      return publicClone(getDayPrivate(weekNumber, dayNumber));
    },

    checkDailyQuestion(weekNumber, dayNumber, questionId, answerOptionId) {
      validateAnswerId(answerOptionId);
      const day = getDayPrivate(weekNumber, dayNumber);
      if (day.kind !== 'LESSON') {
        throw new GrammarServiceError(400, 'INVALID_DAY_KIND', 'Ngày 7 chỉ được chấm sau khi nộp toàn bộ bài.');
      }
      const question = day.questions.find((item) => item.id === questionId);
      if (!question) {
        throw new GrammarServiceError(404, 'QUESTION_NOT_FOUND', 'Không tìm thấy câu hỏi trong ngày học này.');
      }
      if (!question.options.some((option) => option.id === answerOptionId)) {
        throw new GrammarServiceError(400, 'INVALID_ANSWER', 'Đáp án không tồn tại trong câu hỏi này.');
      }
      return resultForQuestion(question, answerOptionId);
    },

    gradeReview(weekNumber, answers) {
      const day = getDayPrivate(weekNumber, 7);
      if (!Array.isArray(answers)) {
        throw new GrammarServiceError(400, 'INVALID_ANSWERS', 'answers phải là một danh sách.');
      }

      const submitted = new Map();
      for (const answer of answers) {
        if (!answer || typeof answer.questionId !== 'string') {
          throw new GrammarServiceError(400, 'INVALID_QUESTION_ID', 'Mỗi đáp án phải có questionId hợp lệ.');
        }
        if (submitted.has(answer.questionId)) {
          throw new GrammarServiceError(400, 'DUPLICATE_ANSWER', 'Mỗi câu hỏi chỉ được gửi một đáp án.');
        }
        const question = day.questions.find((item) => item.id === answer.questionId);
        if (!question) {
          throw new GrammarServiceError(400, 'INVALID_QUESTION_ID', 'Câu hỏi không thuộc bài tổng hợp này.');
        }
        validateAnswerId(answer.answerOptionId);
        if (!question.options.some((option) => option.id === answer.answerOptionId)) {
          throw new GrammarServiceError(400, 'INVALID_ANSWER', 'Đáp án không tồn tại trong câu hỏi này.');
        }
        submitted.set(answer.questionId, answer.answerOptionId);
      }

      const results = day.questions.map((question) =>
        resultForQuestion(question, submitted.get(question.id) || null));
      const correctCount = results.filter((result) => result.isCorrect).length;
      return {
        score: correctCount * 4,
        maxScore: 100,
        correctCount,
        totalQuestions: 25,
        results,
      };
    },
  };
}

module.exports = {
  GrammarServiceError,
  createGrammarService,
  publicClone,
};
