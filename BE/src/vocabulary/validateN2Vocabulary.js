const crypto = require('node:crypto');
const { N2_PARTS, N2_UNITS, TOTAL_N2_WORDS } = require('./n2Manifest');

const KANJI_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff々〆〇ヶ]/u;
const EXERCISE_PATTERN = /練習問題/u;

class N2VocabularyValidationError extends Error {
  constructor(issues) {
    super(`Dữ liệu N2 không hợp lệ:\n- ${issues.join('\n- ')}`);
    this.name = 'N2VocabularyValidationError';
    this.issues = issues;
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableStringify(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function computeCandidateHash(candidate) {
  const content = structuredClone(candidate || {});
  delete content.verification;
  return crypto.createHash('sha256').update(stableStringify(content), 'utf8').digest('hex');
}

function requireText(value, path, issues) {
  if (typeof value !== 'string' || !value.trim()) issues.push(`${path} phải là chuỗi không rỗng.`);
}

function validateSource(source, path, issues) {
  if (!source || !Number.isInteger(source.pdfPage) || source.pdfPage < 1
    || !Number.isInteger(source.printedPage) || source.printedPage < 1) {
    issues.push(`${path} phải có pdfPage và printedPage hợp lệ.`);
  }
}

function validateSegments(segments, path, issues, { requireUnderline = false } = {}) {
  if (!Array.isArray(segments) || segments.length === 0) {
    issues.push(`${path} phải có ít nhất một segment.`);
    return;
  }

  let hasUnderline = false;
  segments.forEach((segment, index) => {
    const segmentPath = `${path}[${index}]`;
    if (!segment || typeof segment !== 'object') {
      issues.push(`${segmentPath} phải là object.`);
      return;
    }
    requireText(segment.text, `${segmentPath}.text`, issues);
    if (typeof segment.reading !== 'string') issues.push(`${segmentPath}.reading phải là chuỗi.`);
    if (typeof segment.isUnderlined !== 'boolean') {
      issues.push(`${segmentPath}.isUnderlined phải là boolean.`);
    } else if (segment.isUnderlined) {
      hasUnderline = true;
    }
    // The printed part-of-speech marker is not vocabulary text and has no furigana.
    if (segment.isUnderlined === true && typeof segment.text === 'string' && segment.text !== '\uFF08\u540D\uFF09' && KANJI_PATTERN.test(segment.text)
      && (typeof segment.reading !== 'string' || !segment.reading.trim())) {
      issues.push(`${segmentPath} chứa kanji nhưng thiếu furigana.`);
    }
  });

  if (requireUnderline && !hasUnderline) issues.push(`${path} thiếu đoạn gạch chân từ vựng.`);
}

function validateExample(example, path, issues) {
  if (!example || typeof example !== 'object') {
    issues.push(`${path} phải là object.`);
    return;
  }
  requireText(example.japanese, `${path}.japanese`, issues);
  requireText(example.vietnamese, `${path}.vietnamese`, issues);
  if (typeof example.japanese === 'string' && /^語彙\d+[。.]?$/u.test(example.japanese.trim())) {
    issues.push(`${path}.japanese còn placeholder OCR; phải chép nguyên văn từ ảnh nguồn.`);
  }
  if (typeof example.vietnamese === 'string' && /^Mục từ\s*\d+/u.test(example.vietnamese.trim())) {
    issues.push(`${path}.vietnamese còn placeholder OCR; phải chép nguyên văn từ ảnh nguồn.`);
  }
  validateSegments(example.segments, `${path}.segments`, issues, { requireUnderline: true });
  if (Array.isArray(example.segments)
    && example.segments.map((segment) => segment?.text || '').join('') !== example.japanese) {
    issues.push(`${path}.japanese phải khớp nguyên văn với các segments.`);
  }
  validateSource(example.source, `${path}.source`, issues);
}

function validateRelation(relation, path, issues) {
  if (!relation || typeof relation !== 'object') {
    issues.push(`${path} phải là object.`);
    return;
  }
  requireText(relation.label, `${path}.label`, issues);
  if (!Array.isArray(relation.items) || relation.items.length === 0) {
    issues.push(`${path}.items phải có ít nhất một mục.`);
    return;
  }
  relation.items.forEach((item, index) => {
    const itemPath = `${path}.items[${index}]`;
    requireText(item?.japanese, `${itemPath}.japanese`, issues);
    requireText(item?.vietnamese, `${itemPath}.vietnamese`, issues);
    validateSegments(item?.segments, `${itemPath}.segments`, issues);
    if (Array.isArray(item?.segments)
      && item.segments.map((segment) => segment?.text || '').join('') !== item.japanese) {
      issues.push(`${itemPath}.japanese phải khớp nguyên văn với các segments.`);
    }
    validateSource(item?.source, `${itemPath}.source`, issues);
  });
}

function validateWord(word, expectedNumber, path, issues) {
  if (!word || typeof word !== 'object') {
    issues.push(`${path} phải là object.`);
    return;
  }
  if (word.sourceNumber !== expectedNumber) {
    issues.push(`${path}.sourceNumber phải là ${expectedNumber}.`);
  }
  if (typeof word.kanji !== 'string') issues.push(`${path}.kanji phải là chuỗi.`);
  if (typeof word.kanji === 'string' && /^語彙\d+$/u.test(word.kanji)) {
    issues.push(`${path}.kanji còn placeholder OCR; phải chép thủ công theo ảnh nguồn.`);
  }
  requireText(word.hiragana, `${path}.hiragana`, issues);
  if (typeof word.hanVietMeaning !== 'string') issues.push(`${path}.hanVietMeaning phải là chuỗi.`);
  requireText(word.meaning, `${path}.meaning`, issues);
  if (typeof word.meaning === 'string' && /^Mục từ\s*\d+/u.test(word.meaning.trim())) {
    issues.push(`${path}.meaning còn placeholder OCR; phải chép nguyên văn từ ảnh nguồn.`);
  }
  if (!Array.isArray(word.examples) || word.examples.length === 0) {
    issues.push(`${path}.examples phải chứa toàn bộ ví dụ và không được rỗng.`);
  } else {
    word.examples.forEach((example, index) => validateExample(example, `${path}.examples[${index}]`, issues));
  }
  if (!Array.isArray(word.relations)) {
    issues.push(`${path}.relations phải là mảng.`);
  } else {
    word.relations.forEach((relation, index) => validateRelation(relation, `${path}.relations[${index}]`, issues));
  }
  validateSource(word.source, `${path}.source`, issues);
}

function validateN2Word(word, expectedNumber, path = 'word') {
  const issues = [];
  validateWord(word, expectedNumber, path, issues);
  if (issues.length > 0) throw new N2VocabularyValidationError(issues);
  return word;
}

function validateN2Vocabulary(data, { requireVerified = false } = {}) {
  const issues = [];
  if (!data || data.schemaVersion !== 1 || data.level !== 'N2') {
    issues.push('Dữ liệu phải có schemaVersion=1 và level=N2.');
  }
  if (!data?.source || typeof data.source.fileName !== 'string'
    || !/^[a-f0-9]{64}$/u.test(data.source.sha256 || '')
    || data.source.pageCount !== 361) {
    issues.push('source phải có fileName, SHA-256 và đúng 361 trang PDF.');
  }
  if (!Array.isArray(data?.units) || data.units.length !== N2_UNITS.length) {
    issues.push('units phải chứa đúng 13 Unit.');
  } else {
    data.units.forEach((unit, unitIndex) => {
      const expectedUnit = N2_UNITS[unitIndex];
      const unitPath = `units[${unitIndex}]`;
      for (const field of ['unitNumber', 'titleJa', 'rangeStart', 'rangeEnd']) {
        if (unit?.[field] !== expectedUnit[field]) {
          issues.push(`${unitPath}.${field} không khớp manifest N2.`);
        }
      }
      const expectedParts = N2_PARTS.filter((part) => part.unitNumber === expectedUnit.unitNumber);
      if (!Array.isArray(unit?.parts) || unit.parts.length !== expectedParts.length) {
        issues.push(`${unitPath}.parts phải chứa đúng ${expectedParts.length} phần.`);
        return;
      }
      unit.parts.forEach((part, partIndex) => {
        const expectedPart = expectedParts[partIndex];
        const partPath = `${unitPath}.parts[${partIndex}]`;
        for (const field of ['code', 'unitNumber', 'partNumber', 'rangeStart', 'rangeEnd', 'isSummary']) {
          if (part?.[field] !== expectedPart[field]) {
            issues.push(`${partPath}.${field} không khớp manifest N2.`);
          }
        }
        if (EXERCISE_PATTERN.test(part?.title || '')) {
          issues.push(`${partPath}.title không được chứa nội dung 練習問題.`);
        }
        const expectedCount = expectedPart.rangeEnd - expectedPart.rangeStart + 1;
        if (!Array.isArray(part?.words) || part.words.length !== expectedCount) {
          issues.push(`${partPath}.words phải chứa đúng ${expectedCount} từ.`);
          return;
        }
        part.words.forEach((word, wordIndex) => validateWord(
          word,
          expectedPart.rangeStart + wordIndex,
          `${partPath}.words[${wordIndex}]`,
          issues,
        ));
      });
    });
  }

  if (requireVerified) {
    if (data?.verification?.approved !== true) issues.push('verification.approved phải là true.');
    if (Array.isArray(data?.verification?.issues)
      && data.verification.issues.some((issue) => issue?.severity === 'blocking')) {
      issues.push('verification còn blocking issue.');
    }
    if (data?.verification?.candidateHash !== computeCandidateHash(data)) {
      issues.push('verification.candidateHash không khớp dữ liệu hiện tại.');
    }
  }

  if (issues.length > 0) throw new N2VocabularyValidationError(issues);
  return { totalWords: TOTAL_N2_WORDS, totalParts: N2_PARTS.length, units: data.units };
}

module.exports = {
  N2VocabularyValidationError,
  computeCandidateHash,
  stableStringify,
  validateN2Vocabulary,
  validateN2Word,
};

if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const dataPath = process.argv[2]
    || path.join(__dirname, '../../file/n2_vocabulary.json');
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const result = validateN2Vocabulary(data, { requireVerified: true });
    console.log(`Validated ${result.totalWords} N2 words in ${result.totalParts} parts.`);
  } catch (error) {
    console.error(error?.message || error);
    process.exitCode = 1;
  }
}
