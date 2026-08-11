const LESSON_QUESTION_COUNTS = Object.freeze({
  BINARY_CHOICE: 5,
  STAR_CHOICE: 2,
});

const REVIEW_QUESTION_COUNTS = Object.freeze({
  REVIEW_CHOICE: 15,
  STAR_CHOICE: 5,
  REVIEW_CLOZE: 5,
});

const OPTION_IDS = new Set(['A', 'B', 'C', 'D']);

class GrammarValidationError extends Error {
  constructor(issues) {
    super(`Dữ liệu ngữ pháp không hợp lệ (${issues.length} lỗi).`);
    this.name = 'GrammarValidationError';
    this.issues = issues;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateSource(source, path, issues) {
  if (!source || !Number.isInteger(source.pdfPage) || source.pdfPage < 1
    || !Number.isInteger(source.printedPage) || source.printedPage < 1) {
    issues.push(`${path}.source phải có pdfPage và printedPage hợp lệ.`);
  }
}

function validateSegments(segments, path, issues, requireGrammar = false) {
  if (!Array.isArray(segments) || segments.length === 0) {
    issues.push(`${path} phải có ít nhất một đoạn text.`);
    return;
  }

  for (const [index, segment] of segments.entries()) {
    if (!segment || !isNonEmptyString(segment.text) || typeof segment.isGrammar !== 'boolean') {
      issues.push(`${path}[${index}] phải có text và isGrammar.`);
    }
  }

  if (requireGrammar && !segments.some((segment) => segment?.isGrammar === true)) {
    issues.push(`${path} phải có ít nhất một đoạn isGrammar để gạch chân.`);
  }
}

function registerId(id, path, seenIds, issues) {
  if (!isNonEmptyString(id)) {
    issues.push(`${path}.id là bắt buộc.`);
    return;
  }
  if (seenIds.has(id)) {
    issues.push(`${path}.id: ID trùng "${id}".`);
  }
  seenIds.add(id);
}

function validateGrammarPoint(point, path, seenIds, issues) {
  if (!point || typeof point !== 'object') {
    issues.push(`${path} phải là một điểm ngữ pháp.`);
    return;
  }

  registerId(point.id, path, seenIds, issues);
  for (const field of ['titleJa', 'meaningVi', 'usageVi']) {
    if (!isNonEmptyString(point[field])) issues.push(`${path}.${field} là bắt buộc.`);
  }
  if (!Array.isArray(point.structures) || point.structures.length === 0
    || point.structures.some((structure) => !isNonEmptyString(structure))) {
    issues.push(`${path}.structures phải có ít nhất một cấu trúc.`);
  }
  validateSource(point.source, path, issues);

  if (!Array.isArray(point.examples) || point.examples.length === 0) {
    issues.push(`${path}.examples phải có ít nhất một ví dụ.`);
    return;
  }
  for (const [index, example] of point.examples.entries()) {
    const examplePath = `${path}.examples[${index}]`;
    registerId(example?.id, examplePath, seenIds, issues);
    validateSegments(example?.segments, `${examplePath}.segments`, issues, true);
    if (!isNonEmptyString(example?.translationVi)) {
      issues.push(`${examplePath}.translationVi là bắt buộc.`);
    }
    if (example?.paraphraseJa !== undefined && !isNonEmptyString(example.paraphraseJa)) {
      issues.push(`${examplePath}.paraphraseJa phải là chuỗi có nội dung khi được khai báo.`);
    }
  }
}

function expectedOptions(type) {
  return type === 'BINARY_CHOICE' ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
}

function validateQuestion(question, path, seenIds, issues) {
  if (!question || typeof question !== 'object') {
    issues.push(`${path} phải là một câu hỏi.`);
    return;
  }
  registerId(question.id, path, seenIds, issues);
  validateSegments(question.promptSegments, `${path}.promptSegments`, issues);
  validateSource(question.source, path, issues);

  const expected = expectedOptions(question.type);
  const optionIds = Array.isArray(question.options) ? question.options.map((option) => option?.id) : [];
  if (optionIds.length !== expected.length
    || expected.some((id, index) => optionIds[index] !== id)
    || question.options.some((option) => !isNonEmptyString(option?.text))) {
    issues.push(`${path}.options phải lần lượt là ${expected.join(', ')} và có nội dung.`);
  }
  if (!OPTION_IDS.has(question.correctOptionId) || !optionIds.includes(question.correctOptionId)) {
    issues.push(`${path}.correctOptionId phải trỏ tới một lựa chọn hợp lệ.`);
  }
  if (!isNonEmptyString(question.explanationVi)) {
    issues.push(`${path}.explanationVi là bắt buộc.`);
  }
  if (question.type === 'STAR_CHOICE' && !isNonEmptyString(question.correctSentenceJa)) {
    issues.push(`${path}.correctSentenceJa là bắt buộc với câu ô sao.`);
  }
  if (question.type === 'STAR_CHOICE') {
    const order = question.correctOrder;
    const validOrder = Array.isArray(order)
      && order.length === 4
      && new Set(order).size === 4
      && order.every((id) => ['A', 'B', 'C', 'D'].includes(id))
      && order[2] === question.correctOptionId;
    if (!validOrder) {
      issues.push(`${path}.correctOrder phải gồm đủ A–D và phần tử thứ ba phải là correctOptionId.`);
    }
  }
  if (question.type === 'REVIEW_CLOZE' && !isNonEmptyString(question.passageId)) {
    issues.push(`${path}.passageId là bắt buộc với câu điền đoạn văn.`);
  }
}

function countQuestionTypes(questions) {
  return questions.reduce((counts, question) => {
    counts[question?.type] = (counts[question?.type] || 0) + 1;
    return counts;
  }, {});
}

function validateLessonDay(day, path, seenIds, issues) {
  if (!Array.isArray(day.grammarPoints) || day.grammarPoints.length < 3 || day.grammarPoints.length > 4) {
    issues.push(`${path} phải có 3–4 điểm ngữ pháp.`);
  } else {
    day.grammarPoints.forEach((point, index) =>
      validateGrammarPoint(point, `${path}.grammarPoints[${index}]`, seenIds, issues));
  }

  const questions = Array.isArray(day.questions) ? day.questions : [];
  const counts = countQuestionTypes(questions);
  if (questions.length !== 7
    || counts.BINARY_CHOICE !== LESSON_QUESTION_COUNTS.BINARY_CHOICE
    || counts.STAR_CHOICE !== LESSON_QUESTION_COUNTS.STAR_CHOICE) {
    issues.push(`${path} phải có đúng 5 BINARY_CHOICE và 2 STAR_CHOICE.`);
  }
  questions.forEach((question, index) =>
    validateQuestion(question, `${path}.questions[${index}]`, seenIds, issues));
}

function validateReviewDay(day, path, seenIds, issues) {
  if (day.timeLimitSeconds !== 900 || day.maxScore !== 100) {
    issues.push(`${path} phải có timeLimitSeconds=900 và maxScore=100.`);
  }
  const passages = Array.isArray(day.passages) ? day.passages : [];
  const passageIds = new Set();
  passages.forEach((passage, index) => {
    const passagePath = `${path}.passages[${index}]`;
    registerId(passage?.id, passagePath, seenIds, issues);
    if (isNonEmptyString(passage?.id)) passageIds.add(passage.id);
    validateSegments(passage?.segments, `${passagePath}.segments`, issues);
  });

  const questions = Array.isArray(day.questions) ? day.questions : [];
  const counts = countQuestionTypes(questions);
  const validDistribution = questions.length === 25
    && Object.entries(REVIEW_QUESTION_COUNTS).every(([type, count]) => counts[type] === count);
  if (!validDistribution) {
    issues.push(`${path} phải có đúng 15 REVIEW_CHOICE, 5 STAR_CHOICE và 5 REVIEW_CLOZE.`);
  }
  questions.forEach((question, index) => {
    validateQuestion(question, `${path}.questions[${index}]`, seenIds, issues);
    if (question?.type === 'REVIEW_CLOZE' && !passageIds.has(question.passageId)) {
      issues.push(`${path}.questions[${index}].passageId không tồn tại.`);
    }
  });
}

function validateGrammarCurriculum(curriculum) {
  const issues = [];
  const seenIds = new Set();
  if (!curriculum || typeof curriculum !== 'object') {
    throw new GrammarValidationError(['Dữ liệu gốc phải là một object.']);
  }
  if (!Array.isArray(curriculum.weeks) || curriculum.weeks.length !== 6) {
    issues.push('Dữ liệu phải có đúng 6 tuần.');
  }

  for (const [weekIndex, week] of (curriculum.weeks || []).entries()) {
    const expectedWeek = weekIndex + 1;
    const weekPath = `weeks[${weekIndex}]`;
    if (week?.weekNumber !== expectedWeek) {
      issues.push(`${weekPath}.weekNumber phải là ${expectedWeek}.`);
    }
    if (!Array.isArray(week?.days) || week.days.length !== 7) {
      issues.push(`${weekPath} phải có đúng 7 ngày.`);
      continue;
    }

    for (const [dayIndex, day] of week.days.entries()) {
      const expectedDay = dayIndex + 1;
      const dayPath = `${weekPath}.days[${dayIndex}]`;
      registerId(day?.id, dayPath, seenIds, issues);
      if (day?.weekNumber !== expectedWeek || day?.dayNumber !== expectedDay) {
        issues.push(`${dayPath} có số tuần/ngày không khớp vị trí.`);
      }
      if (expectedDay < 7 && day?.kind !== 'LESSON') {
        issues.push(`${dayPath}.kind phải là LESSON.`);
      } else if (expectedDay === 7 && day?.kind !== 'REVIEW') {
        issues.push(`${dayPath}.kind phải là REVIEW.`);
      } else if (day.kind === 'LESSON') {
        validateLessonDay(day, dayPath, seenIds, issues);
      } else if (day.kind === 'REVIEW') {
        validateReviewDay(day, dayPath, seenIds, issues);
      }
    }
  }

  if (issues.length > 0) throw new GrammarValidationError(issues);
  return curriculum;
}

module.exports = {
  GrammarValidationError,
  validateGrammarCurriculum,
};
