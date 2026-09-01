const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const validateN3Vocabulary = require('../src/scripts/validateN3Vocabulary');

const vocabularyPath = path.join(__dirname, '../file/n3_vocabulary.json');

test('all N3 vocabulary records carry a source-backed Han-Viet field', () => {
  const data = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
  const lessons = validateN3Vocabulary(data);
  const words = lessons.flatMap(([, entries]) => entries);

  assert.equal(words.length, 880);
  assert.ok(words.every((word) => typeof word.hanVietMeaning === 'string'));
});

test('the source spelling for 感動 is exactly CẢM ĐỘNG', () => {
  const data = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
  const word = Object.values(data)
    .flat()
    .find((entry) => entry.kanji === '感動');

  assert.ok(word);
  assert.equal(word.hanVietMeaning, 'CẢM ĐỘNG');
});

test('validation rejects a vocabulary record without the Han-Viet field', () => {
  const data = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
  delete data[Object.keys(data)[0]][0].hanVietMeaning;

  assert.throws(
    () => validateN3Vocabulary(data),
    /hanVietMeaning must be a string/,
  );
});
