const test = require('node:test');
const assert = require('node:assert/strict');

const {
  N2_PARTS,
  N2_UNITS,
  TOTAL_N2_WORDS,
} = require('../src/vocabulary/n2Manifest');
const {
  computeCandidateHash,
  validateN2Vocabulary,
} = require('../src/vocabulary/validateN2Vocabulary');

function makeSegments(number) {
  return [
    { text: `人生${number}`, reading: `じんせい${number}`, isUnderlined: true },
    { text: 'を', reading: '', isUnderlined: false },
    { text: '送る', reading: 'おくる', isUnderlined: false },
    { text: '。', reading: '', isUnderlined: false },
  ];
}

function makeWord(number) {
  const segments = makeSegments(number);
  return {
    sourceNumber: number,
    kanji: `人生${number}`,
    hiragana: `じんせい${number}`,
    hanVietMeaning: `NHÂN SINH ${number}`,
    meaning: `Đời người ${number}`,
    examples: [{
      japanese: segments.map((segment) => segment.text).join(''),
      segments,
      vietnamese: `Sống một cuộc đời ${number}.`,
      source: { pdfPage: 7, printedPage: 4 },
    }],
    relations: [{
      label: '連',
      items: [{
        japanese: '＿を送る',
        segments: [
          { text: '＿', reading: '', isUnderlined: true },
          { text: 'を送る', reading: 'おくる', isUnderlined: false },
        ],
        vietnamese: 'Sống một cuộc sống',
        source: { pdfPage: 7, printedPage: 4 },
      }],
    }],
    source: { pdfPage: 7, printedPage: 4 },
  };
}

function makeCompleteCandidate() {
  const units = N2_UNITS.map((unit) => ({
    ...unit,
    parts: N2_PARTS
      .filter((part) => part.unitNumber === unit.unitNumber)
      .map((part) => ({
        ...part,
        words: Array.from(
          { length: part.rangeEnd - part.rangeStart + 1 },
          (_, index) => makeWord(part.rangeStart + index),
        ),
      })),
  }));
  const candidate = {
    schemaVersion: 1,
    level: 'N2',
    source: {
      fileName: 'minikara n2 bản dịch tiếng việt.pdf',
      sha256: 'a'.repeat(64),
      pageCount: 361,
    },
    units,
    verification: {
      approved: true,
      candidateHash: '',
      issues: [],
    },
  };
  candidate.verification.candidateHash = computeCandidateHash(candidate);
  return candidate;
}

test('N2 manifest contains 13 units, 22 vocabulary parts and continuous word ranges', () => {
  assert.equal(N2_UNITS.length, 13);
  assert.equal(N2_PARTS.length, 22);
  assert.equal(TOTAL_N2_WORDS, 1160);
  assert.deepEqual(
    N2_PARTS.flatMap((part) => Array.from(
      { length: part.rangeEnd - part.rangeStart + 1 },
      (_, index) => part.rangeStart + index,
    )),
    Array.from({ length: 1160 }, (_, index) => index + 1),
  );
  assert.equal(N2_PARTS.find((part) => part.rangeStart === 371).unitNumber, 4);
  assert.equal(N2_PARTS.find((part) => part.rangeStart === 656).unitNumber, 7);
});

test('validator accepts a complete source-verified N2 candidate', () => {
  const candidate = makeCompleteCandidate();

  const result = validateN2Vocabulary(candidate, { requireVerified: true });

  assert.equal(result.totalWords, 1160);
  assert.equal(result.totalParts, 22);
});

test('validator rejects missing examples, furigana and vocabulary underlines', () => {
  const missingExample = makeCompleteCandidate();
  missingExample.units[0].parts[0].words[0].examples = [];
  assert.throws(() => validateN2Vocabulary(missingExample), /examples/);

  const missingReading = makeCompleteCandidate();
  missingReading.units[0].parts[0].words[0].examples[0].segments[0].reading = '';
  assert.throws(() => validateN2Vocabulary(missingReading), /furigana/);

  const missingUnderline = makeCompleteCandidate();
  missingUnderline.units[0].parts[0].words[0].examples[0].segments[0].isUnderlined = false;
  assert.throws(() => validateN2Vocabulary(missingUnderline), /gạch chân/);
});

test('validator rejects gaps, exercise content and stale verifier approval', () => {
  const missingWord = makeCompleteCandidate();
  missingWord.units[0].parts[0].words.shift();
  assert.throws(() => validateN2Vocabulary(missingWord), /phải chứa đúng/);

  const exercisePart = makeCompleteCandidate();
  exercisePart.units[0].parts[0].title = '練習問題 I';
  assert.throws(() => validateN2Vocabulary(exercisePart), /練習問題/);

  const staleApproval = makeCompleteCandidate();
  staleApproval.units[0].parts[0].words[0].meaning = 'Nghĩa đã bị sửa';
  assert.throws(
    () => validateN2Vocabulary(staleApproval, { requireVerified: true }),
    /candidateHash/,
  );
});

test('validator preserves literal Vietnamese meanings and relation placeholders', () => {
  const candidate = makeCompleteCandidate();
  const firstWord = candidate.units[0].parts[0].words[0];
  firstWord.meaning = 'Đời người, cuộc sống, cuộc đời';
  firstWord.examples[0].vietnamese = 'Sống một cuộc sống hạnh phúc.';
  firstWord.relations[0].items[0].vietnamese = 'Sống một cuộc sống';
  candidate.verification.candidateHash = computeCandidateHash(candidate);

  validateN2Vocabulary(candidate, { requireVerified: true });

  assert.equal(firstWord.meaning, 'Đời người, cuộc sống, cuộc đời');
  assert.equal(firstWord.examples[0].vietnamese, 'Sống một cuộc sống hạnh phúc.');
  assert.equal(firstWord.relations[0].items[0].segments[0].text, '＿');
});

test('validator rejects OCR placeholder headwords', () => {
  const candidate = makeCompleteCandidate();
  candidate.units[0].parts[0].words[0].kanji = '語彙999';
  assert.throws(() => validateN2Vocabulary(candidate), /placeholder OCR/);
});

test('validator rejects OCR placeholder meanings and examples', () => {
  const meaningPlaceholder = makeCompleteCandidate();
  meaningPlaceholder.units[0].parts[0].words[0].meaning = 'M\u1ee5c t\u1eeb 1';
  assert.throws(() => validateN2Vocabulary(meaningPlaceholder), /placeholder OCR/);

  const examplePlaceholder = makeCompleteCandidate();
  examplePlaceholder.units[0].parts[0].words[0].examples[0].japanese = '\u8a9e\u5f59999.';
  examplePlaceholder.units[0].parts[0].words[0].examples[0].vietnamese = 'M\u1ee5c t\u1eeb 999';
  examplePlaceholder.units[0].parts[0].words[0].examples[0].segments = [
    { text: '\u8a9e\u5f59999.', reading: '\u3054\u3044999', isUnderlined: true },
  ];
  assert.throws(() => validateN2Vocabulary(examplePlaceholder), /placeholder OCR/);
});
