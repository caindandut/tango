const EXPECTED_LESSON_COUNTS = [120, 100, 78, 112, 100, 40, 40, 45, 80, 80, 50, 35];
const OCR_GARBAGE_PATTERN = /[\u00e5\u00f6\u00fc\u00f8\u00e6&\u2175\u03b2\ufffd]/u;

function validateN3Vocabulary(data) {
  const lessons = Object.entries(data || {});
  const hasExpectedShape = lessons.length === EXPECTED_LESSON_COUNTS.length
    && lessons.every(([, words], index) => Array.isArray(words) && words.length === EXPECTED_LESSON_COUNTS[index]);

  if (!hasExpectedShape) {
    throw new Error('n3_vocabulary.json must contain 12 lessons with exactly 880 words');
  }

  for (const [lessonName, words] of lessons) {
    for (const [index, word] of words.entries()) {
      if (!word || typeof word !== 'object') {
        throw new Error(`${lessonName}[${index}] must be an object`);
      }

      for (const field of ['hiragana', 'meaning']) {
        if (typeof word[field] !== 'string' || !word[field].trim()) {
          throw new Error(`${lessonName}[${index}].${field} must be a non-empty string`);
        }
      }

      if (typeof word.kanji !== 'string') {
        throw new Error(`${lessonName}[${index}].kanji must be a string`);
      }

      if (!Array.isArray(word.examples)) {
        throw new Error(`${lessonName}[${index}].examples must be an array`);
      }

      for (const [exampleIndex, example] of word.examples.entries()) {
        if (!example || typeof example !== 'object') {
          throw new Error(`${lessonName}[${index}].examples[${exampleIndex}] must be an object`);
        }
        for (const field of ['japanese', 'vietnamese']) {
          if (typeof example[field] !== 'string' || !example[field].trim()) {
            throw new Error(`${lessonName}[${index}].examples[${exampleIndex}].${field} must be a non-empty string`);
          }
        }
        if (OCR_GARBAGE_PATTERN.test(example.vietnamese)) {
          throw new Error(`${lessonName}[${index}].examples[${exampleIndex}].vietnamese contains OCR garbage characters`);
        }
      }
    }
  }

  return lessons;
}

module.exports = validateN3Vocabulary;

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../file/n3_vocabulary.json'), 'utf8'));
  const lessons = validateN3Vocabulary(data);
  const count = lessons.reduce((total, [, words]) => total + words.length, 0);
  const examples = lessons.reduce((total, [, words]) => total + words.reduce((sum, word) => sum + word.examples.length, 0), 0);
  console.log(`Validated ${count} vocabulary entries and ${examples} examples.`);
}
