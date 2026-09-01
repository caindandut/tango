const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GrammarContentValidationError,
  validateGrammarContent,
} = require('../src/grammar/validateGrammarContent');

function point(overrides = {}) {
  return {
    meaningVi: 'Diễn tả sự việc được thực hiện bởi một đối tượng khác.',
    usageVi: 'Dùng khi muốn nhấn mạnh sự việc và không cần nêu rõ chủ thể thực hiện.',
    structures: ['N に Vられる'],
    examples: [{
      segments: [
        { text: 'この本は', isGrammar: false },
        { text: '読まれている', isGrammar: true },
      ],
      translationVi: 'Cuốn sách này đang được đọc.',
    }],
    ...overrides,
  };
}

function curriculum(overrides = {}) {
  return {
    weeks: [{
      days: [{
        grammarPoints: [point(overrides.point)],
        questions: [{
          explanationVi: 'Đáp án này phù hợp với cấu trúc và ngữ cảnh của câu.',
          options: [{ id: 'A', text: '読まれる' }],
          correctOptionId: 'A',
        }],
      }],
    }],
  };
}

test('content validator accepts Vietnamese explanations and Japanese formulas', () => {
  assert.doesNotThrow(() => validateGrammarContent(curriculum()));
});

test('content validator rejects Japanese prose in a Vietnamese explanation', () => {
  assert.throws(
    () => validateGrammarContent(curriculum({ point: point({ meaningVi: '(= 行く予定でした)' }) })),
    (error) => error instanceof GrammarContentValidationError
      && error.issues.some((issue) => issue.includes('meaningVi')),
  );
});

test('content validator rejects generic fallback explanations', () => {
  assert.throws(
    () => validateGrammarContent(curriculum({ point: point({ usageVi: 'Xem cách dùng trong cấu trúc và ví dụ.' }) })),
    (error) => error instanceof GrammarContentValidationError
      && error.issues.some((issue) => issue.includes('chung chung')),
  );
});

test('content validator rejects missing grammar underline and explanations', () => {
  assert.throws(
    () => validateGrammarContent(curriculum({ point: point({
      examples: [{
        segments: [{ text: 'Câu ví dụ.', isGrammar: false }],
        translationVi: 'Một câu ví dụ.',
      }],
    }) })),
    (error) => error instanceof GrammarContentValidationError
      && error.issues.some((issue) => issue.includes('segments')),
  );
});

test('content validator rejects a question with an invalid answer id', () => {
  const value = curriculum();
  value.weeks[0].days[0].questions[0].correctOptionId = 'E';
  assert.throws(
    () => validateGrammarContent(value),
    (error) => error instanceof GrammarContentValidationError
      && error.issues.some((issue) => issue.includes('correctOptionId')),
  );
});
