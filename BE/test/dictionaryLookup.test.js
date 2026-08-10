const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateLookupInput,
  parseLookupResponse,
} = require('../src/lib/dictionaryLookup');

test('accepts a Japanese kanji term and its example sentence', () => {
  assert.deepEqual(
    validateLookupInput({ term: '図書館', sentence: '図書館で本を借りました。' }),
    { term: '図書館', sentence: '図書館で本を借りました。', hasKanji: true },
  );
});

test('accepts kana-only terms', () => {
  assert.equal(validateLookupInput({ term: 'かりる', sentence: '本をかりる。' }).hasKanji, false);
});

test('rejects empty, oversized, and non-Japanese terms', () => {
  assert.throws(() => validateLookupInput({ term: ' ', sentence: '本を借りる。' }), /TERM_INVALID/);
  assert.throws(() => validateLookupInput({ term: 'あ'.repeat(81), sentence: '本を借りる。' }), /TERM_INVALID/);
  assert.throws(() => validateLookupInput({ term: 'library', sentence: '本を借りる。' }), /TERM_INVALID/);
});

test('parses a valid Gemini result and keeps hiragana only for kanji terms', () => {
  assert.deepEqual(
    parseLookupResponse('{"meaning":"thư viện","hiragana":"としょかん"}', { term: '図書館', hasKanji: true }),
    { term: '図書館', meaning: 'thư viện', hiragana: 'としょかん' },
  );
  assert.deepEqual(
    parseLookupResponse('{"meaning":"mượn","hiragana":null}', { term: 'かりる', hasKanji: false }),
    { term: 'かりる', meaning: 'mượn', hiragana: null },
  );
});

test('rejects malformed or unsafe Gemini JSON', () => {
  assert.throws(() => parseLookupResponse('not json', { term: '図書館', hasKanji: true }), /MODEL_RESPONSE_INVALID/);
  assert.throws(
    () => parseLookupResponse('{"meaning":"<script>","hiragana":"tosyokan"}', { term: '図書館', hasKanji: true }),
    /MODEL_RESPONSE_INVALID/,
  );
});
