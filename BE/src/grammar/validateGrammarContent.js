const JAPANESE_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u;
const VIETNAMESE_LETTER = /[À-ỹĐđ]/u;
const VIETNAMESE_MARKER = /\b(?:theo|về|dùng|để|thể|biểu|sử|cho|khi|không|có|liên|nhấn|diễn|mang|giống|sự|việc|phải|cách|được|hành|động|trong|từ|mỗi|chỉ|bằng|với|nói|nêu|giả|định|tần suất)\b/iu;
const ENGLISH_EXPLANATION = /\b(?:expression|showing|when|used|indicates|refers|the action|a way|speaker|situation)\b/iu;
const GENERIC_EXPLANATION = /^(?:xem cách dùng trong cấu trúc và ví dụ|nhấn mạnh|nhấn mạnh ý phủ định|sử dụng khi bắt đầu phần giải thích|thể hiện mong ước|dùng để nối các câu|dùng để nối hai mệnh đề)\.?$/iu;

class GrammarContentValidationError extends Error {
  constructor(issues) {
    super(`Nội dung ngữ pháp không đạt kiểm tra (${issues.length} lỗi).`);
    this.name = 'GrammarContentValidationError';
    this.issues = issues;
  }
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasVietnameseExplanation(value) {
  return (VIETNAMESE_LETTER.test(value) || VIETNAMESE_MARKER.test(value))
    && !ENGLISH_EXPLANATION.test(value);
}

function validateVietnameseField(value, path, issues, { allowJapanese = false } = {}) {
  if (!nonEmpty(value)) {
    issues.push(`${path} phải là nội dung tiếng Việt không rỗng.`);
    return;
  }
  if (!hasVietnameseExplanation(value)) {
    issues.push(`${path} phải được diễn đạt bằng tiếng Việt.`);
  }
  if (!allowJapanese && JAPANESE_SCRIPT.test(value)) {
    issues.push(`${path} không được chứa chữ Nhật; công thức phải nằm trong structures.`);
  }
  if (GENERIC_EXPLANATION.test(value.trim())) {
    issues.push(`${path} không được dùng lời giải thích chung chung.`);
  }
}

function validateGrammarPointContent(point, path, issues) {
  validateVietnameseField(point?.meaningVi, `${path}.meaningVi`, issues);
  validateVietnameseField(point?.usageVi, `${path}.usageVi`, issues, { allowJapanese: true });

  if (!Array.isArray(point?.structures) || point.structures.length === 0
    || point.structures.some((structure) => !nonEmpty(structure))) {
    issues.push(`${path}.structures phải có ít nhất một công thức không rỗng.`);
  }

  if (!Array.isArray(point?.examples) || point.examples.length === 0) {
    issues.push(`${path}.examples phải có ít nhất một ví dụ.`);
    return;
  }

  point.examples.forEach((example, index) => {
    const examplePath = `${path}.examples[${index}]`;
    if (!Array.isArray(example?.segments) || example.segments.length === 0
      || !example.segments.some((segment) => segment?.isGrammar === true)) {
      issues.push(`${examplePath}.segments phải có đoạn ngữ pháp được đánh dấu.`);
    }
    validateVietnameseField(example?.translationVi, `${examplePath}.translationVi`, issues);
  });
}

function validateQuestionContent(question, path, issues) {
  validateVietnameseField(question?.explanationVi, `${path}.explanationVi`, issues, { allowJapanese: true });
  if (!Array.isArray(question?.options) || question.options.some((option) => !nonEmpty(option?.text))) {
    issues.push(`${path}.options phải có đầy đủ nội dung.`);
  }
  if (!['A', 'B', 'C', 'D'].includes(question?.correctOptionId)) {
    issues.push(`${path}.correctOptionId không hợp lệ.`);
  }
}

function validateGrammarContent(curriculum) {
  const issues = [];
  for (const [weekIndex, week] of (curriculum?.weeks || []).entries()) {
    for (const [dayIndex, day] of (week?.days || []).entries()) {
      const dayPath = `weeks[${weekIndex}].days[${dayIndex}]`;
      (day?.grammarPoints || []).forEach((point, pointIndex) => {
        validateGrammarPointContent(point, `${dayPath}.grammarPoints[${pointIndex}]`, issues);
      });
      (day?.questions || []).forEach((question, questionIndex) => {
        validateQuestionContent(question, `${dayPath}.questions[${questionIndex}]`, issues);
      });
    }
  }
  if (issues.length > 0) throw new GrammarContentValidationError(issues);
  return curriculum;
}

module.exports = {
  GrammarContentValidationError,
  validateGrammarContent,
};
