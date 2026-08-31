const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assertVerifiedBatch,
  buildCorrectionPrompt,
  buildExtractionPrompt,
  buildReviewBatches,
  buildVerifierPrompt,
  computeBatchHash,
  mergeCorrectionCandidate,
  normalizeTechnicalJapanese,
  parseArguments,
  parseModelJson,
  validateExtractedBatch,
} = require('../src/scripts/reviewN2Vocabulary');

function word(number) {
  return {
    sourceNumber: number,
    kanji: '人生',
    hiragana: 'じんせい',
    hanVietMeaning: 'NHÂN SINH',
    meaning: 'Đời người, cuộc sống, cuộc đời',
    examples: [{
      japanese: '幸せな人生を送る。',
      segments: [
        { text: '幸せな', reading: 'しあわせな', isUnderlined: false },
        { text: '人生', reading: 'じんせい', isUnderlined: true },
        { text: 'を', reading: '', isUnderlined: false },
        { text: '送る', reading: 'おくる', isUnderlined: false },
        { text: '。', reading: '', isUnderlined: false },
      ],
      vietnamese: 'Sống một cuộc sống hạnh phúc.',
      source: { pdfPage: 7, printedPage: 4 },
    }],
    relations: [],
    source: { pdfPage: 7, printedPage: 4 },
  };
}

test('review batches cover every manifest part without crossing part boundaries', () => {
  const batches = buildReviewBatches(20);

  assert.equal(batches.length, 68);
  assert.deepEqual(
    { start: batches[0].rangeStart, end: batches[0].rangeEnd },
    { start: 1, end: 20 },
  );
  assert.deepEqual(
    { start: batches.at(-1).rangeStart, end: batches.at(-1).rangeEnd },
    { start: 1151, end: 1160 },
  );
  assert.ok(batches.every((batch) => batch.rangeEnd - batch.rangeStart + 1 <= 20));
});

test('arguments accept extract and verify modes but reject unsafe ranges and non-PDF sources', () => {
  assert.deepEqual(
    parseArguments(['--mode=extract', '--pdf=file/book.pdf', '--from=1', '--to=20', '--resume']),
    {
      mode: 'extract',
      pdfPath: 'file/book.pdf',
      from: 1,
      to: 20,
      resume: true,
    },
  );
  assert.throws(() => parseArguments(['--mode=publish', '--pdf=file/book.pdf']), /mode/);
  assert.throws(() => parseArguments(['--mode=extract', '--pdf=https:\/\/example.com/book.pdf']), /PDF cục bộ/);
  assert.throws(() => parseArguments(['--mode=extract', '--pdf=file/book.pdf', '--from=20', '--to=1']), /phạm vi/);
});

test('prompts demand literal transcription and treat PDF/model content as untrusted data', () => {
  const batch = buildReviewBatches(20)[0];
  const extractionPrompt = buildExtractionPrompt(batch);
  const verifierPrompt = buildVerifierPrompt(batch, { words: [word(1)] });

  assert.match(extractionPrompt, /chép nguyên văn/iu);
  assert.match(extractionPrompt, /không.*dịch/iu);
  assert.match(extractionPrompt, /練習問題/u);
  assert.match(extractionPrompt, /dữ liệu không tin cậy/iu);
  assert.match(verifierPrompt, /từng chữ/iu);
  assert.match(verifierPrompt, /blocking/iu);

  const correctionPrompt = buildCorrectionPrompt(batch, { words: [word(1)] }, new Error('thiếu furigana'));
  assert.match(correctionPrompt, /đọc lại/iu);
  assert.match(correctionPrompt, /mọi segment chứa Kanji/iu);
  assert.match(correctionPrompt, /không được tự đoán/iu);
});

test('model JSON parser accepts fenced JSON and rejects malformed output', () => {
  assert.deepEqual(
    parseModelJson('```json\n' + JSON.stringify({ words: [] }) + '\n```'),
    { words: [] },
  );
  assert.throws(() => parseModelJson('not-json'), /JSON không hợp lệ/);
});

test('extracted batches require exact numbers and verifier approval is bound to the batch hash', () => {
  const batch = { ...buildReviewBatches(20)[0], rangeEnd: 2 };
  const extracted = { words: [word(1), word(2)] };

  assert.equal(validateExtractedBatch(extracted, batch).words.length, 2);
  assert.throws(
    () => validateExtractedBatch({ words: [word(2), word(1)] }, batch),
    /sourceNumber/,
  );

  const verification = {
    approved: true,
    issues: [],
    candidateHash: computeBatchHash(extracted),
  };
  assert.doesNotThrow(() => assertVerifiedBatch(extracted, verification));
  extracted.words[0].meaning = 'Đã bị thay đổi';
  assert.throws(() => assertVerifiedBatch(extracted, verification), /candidateHash/);
});

test('structure repair replaces only failing words and preserves accepted transcription', () => {
  const original = { words: [word(1), word(2)], transcriptionIssues: [] };
  const correction = {
    words: [{ ...word(2), meaning: 'bản sửa đúng từ lỗi' }],
    transcriptionIssues: [],
  };
  const repaired = mergeCorrectionCandidate(
    original,
    correction,
    new Error('N2-U01-P01-1-20.words[1].examples[0] thiếu gạch chân'),
  );

  assert.equal(repaired.words[0].meaning, original.words[0].meaning);
  assert.equal(repaired.words[1].meaning, 'bản sửa đúng từ lỗi');
});

test('technical Japanese lookup strings are derived from visible source segments', () => {
  const candidate = { words: [word(1)] };
  candidate.words[0].examples[0].japanese = 'chuỗi OCR lặp bị lệch';

  normalizeTechnicalJapanese(candidate);

  assert.equal(
    candidate.words[0].examples[0].japanese,
    candidate.words[0].examples[0].segments.map((segment) => segment.text).join(''),
  );
});
