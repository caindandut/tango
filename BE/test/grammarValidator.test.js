const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateGrammarCurriculum,
  GrammarValidationError,
} = require('../src/grammar/validateGrammarCurriculum');

function exampleSegments() {
  return [
    { text: '試合は雨', isGrammar: false },
    { text: 'によって', isGrammar: true },
    { text: '中止になった。', isGrammar: false },
  ];
}

function grammarPoint(id, sourcePage) {
  return {
    id,
    titleJa: '～によって',
    meaningVi: 'Do, bởi, bằng',
    structures: ['N + によって'],
    usageVi: 'Dùng để nêu nguyên nhân hoặc phương thức.',
    examples: [{
      id: `${id}-example-1`,
      segments: exampleSegments(),
      translationVi: 'Trận đấu đã bị hủy do mưa.',
      paraphraseJa: '雨が原因で',
    }],
    source: { pdfPage: sourcePage, printedPage: sourcePage },
  };
}

function option(id) {
  return { id, text: `Lựa chọn ${id}` };
}

function question(id, type, sourcePage) {
  const optionIds = type === 'BINARY_CHOICE' ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  return {
    id,
    type,
    promptSegments: [{ text: `${id} の問題`, isGrammar: false }],
    options: optionIds.map(option),
    correctOptionId: 'A',
    explanationVi: 'A đúng vì phù hợp với cấu trúc và ngữ cảnh của câu.',
    source: { pdfPage: sourcePage, printedPage: sourcePage },
    ...(type === 'STAR_CHOICE' ? {
      correctOrder: ['B', 'C', 'A', 'D'],
      correctSentenceJa: 'Đây là thứ tự hoàn chỉnh.',
    } : {}),
  };
}

function buildValidCurriculum() {
  return {
    version: 1,
    sourceTitle: 'Soumatome N3 Ngữ Pháp Bunpou',
    weeks: Array.from({ length: 6 }, (_, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const lessonDays = Array.from({ length: 6 }, (_, dayIndex) => {
        const dayNumber = dayIndex + 1;
        const base = `w${weekNumber}d${dayNumber}`;
        return {
          id: base,
          weekNumber,
          dayNumber,
          kind: 'LESSON',
          titleVi: `Tuần ${weekNumber} · Ngày ${dayNumber}`,
          grammarPoints: Array.from({ length: 3 }, (_, pointIndex) =>
            grammarPoint(`${base}-g${pointIndex + 1}`, 10 + dayIndex)),
          questions: [
            ...Array.from({ length: 5 }, (_, questionIndex) =>
              question(`${base}-q${questionIndex + 1}`, 'BINARY_CHOICE', 11 + dayIndex)),
            ...Array.from({ length: 2 }, (_, questionIndex) =>
              question(`${base}-q${questionIndex + 6}`, 'STAR_CHOICE', 11 + dayIndex)),
          ],
        };
      });

      const reviewBase = `w${weekNumber}d7`;
      const reviewQuestions = [
        ...Array.from({ length: 15 }, (_, index) =>
          question(`${reviewBase}-q${index + 1}`, 'REVIEW_CHOICE', 20 + index)),
        ...Array.from({ length: 5 }, (_, index) =>
          question(`${reviewBase}-q${index + 16}`, 'STAR_CHOICE', 35 + index)),
        ...Array.from({ length: 5 }, (_, index) => ({
          ...question(`${reviewBase}-q${index + 21}`, 'REVIEW_CLOZE', 40 + index),
          passageId: `${reviewBase}-passage-1`,
        })),
      ];

      return {
        weekNumber,
        titleVi: `Tuần ${weekNumber}`,
        days: [
          ...lessonDays,
          {
            id: reviewBase,
            weekNumber,
            dayNumber: 7,
            kind: 'REVIEW',
            titleVi: `Ôn tập tuần ${weekNumber}`,
            timeLimitSeconds: 900,
            maxScore: 100,
            passages: [{
              id: `${reviewBase}-passage-1`,
              segments: [{ text: 'Đoạn văn ôn tập.', isGrammar: false }],
            }],
            questions: reviewQuestions,
          },
        ],
      };
    }),
  };
}

test('validator accepts a complete six-week curriculum', () => {
  const curriculum = buildValidCurriculum();
  assert.doesNotThrow(() => validateGrammarCurriculum(curriculum));
});

test('validator accepts the PDF-aligned six-question lesson w1d6', () => {
  const curriculum = buildValidCurriculum();
  const day = curriculum.weeks[0].days[5];
  day.id = 'w1d6';
  day.questions = day.questions.filter((question) => question.id !== 'w1d6-q5');
  assert.doesNotThrow(() => validateGrammarCurriculum(curriculum));
});

test('validator rejects a lesson with the wrong exercise distribution', () => {
  const curriculum = buildValidCurriculum();
  curriculum.weeks[0].days[0].questions.pop();

  assert.throws(
    () => validateGrammarCurriculum(curriculum),
    (error) => error instanceof GrammarValidationError
      && error.issues.some((issue) => issue.includes('5 BINARY_CHOICE và 2 STAR_CHOICE')),
  );
});

test('validator rejects examples without a grammar underline segment', () => {
  const curriculum = buildValidCurriculum();
  curriculum.weeks[0].days[0].grammarPoints[0].examples[0].segments = [
    { text: 'Không có đoạn ngữ pháp.', isGrammar: false },
  ];

  assert.throws(
    () => validateGrammarCurriculum(curriculum),
    (error) => error instanceof GrammarValidationError
      && error.issues.some((issue) => issue.includes('isGrammar')),
  );
});

test('validator rejects duplicate IDs and missing private answer data', () => {
  const curriculum = buildValidCurriculum();
  curriculum.weeks[0].days[0].questions[1].id = curriculum.weeks[0].days[0].questions[0].id;
  delete curriculum.weeks[0].days[0].questions[0].correctOptionId;
  delete curriculum.weeks[0].days[0].questions[0].explanationVi;

  assert.throws(
    () => validateGrammarCurriculum(curriculum),
    (error) => error instanceof GrammarValidationError
      && error.issues.some((issue) => issue.includes('ID trùng'))
      && error.issues.some((issue) => issue.includes('correctOptionId'))
      && error.issues.some((issue) => issue.includes('explanationVi')),
  );
});

test('validator rejects a star order whose third fragment is not the answer', () => {
  const curriculum = buildValidCurriculum();
  const starQuestion = curriculum.weeks[0].days[0].questions[5];
  starQuestion.correctOrder = ['A', 'B', 'C', 'D'];

  assert.throws(
    () => validateGrammarCurriculum(curriculum),
    (error) => error instanceof GrammarValidationError
      && error.issues.some((issue) => issue.includes('correctOrder')),
  );
});

module.exports = { buildValidCurriculum };
