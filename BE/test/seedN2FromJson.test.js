const test = require('node:test');
const assert = require('node:assert/strict');

const seedN2FromJson = require('../src/scripts/seedN2FromJson');

function candidate() {
  const source = { pdfPage: 7, printedPage: 4 };
  const example = {
    japanese: '人生を送る。',
    segments: [
      { text: '人生', reading: 'じんせい', isUnderlined: true },
      { text: 'を', reading: '', isUnderlined: false },
      { text: '送る', reading: 'おくる', isUnderlined: false },
      { text: '。', reading: '', isUnderlined: false },
    ],
    vietnamese: 'Sống một cuộc sống.',
    source,
  };
  const makeWord = (sourceNumber) => ({
    sourceNumber,
    kanji: '人生',
    hiragana: 'じんせい',
    hanVietMeaning: 'NHÂN SINH',
    meaning: 'Đời người, cuộc sống, cuộc đời',
    examples: [example],
    relations: [],
    source,
  });
  return {
    units: [{
      unitNumber: 1,
      titleJa: '名詞A',
      parts: [
        {
          code: 'N2-U01-P01',
          unitNumber: 1,
          partNumber: 1,
          title: 'Phần 1: 1–2',
          rangeStart: 1,
          rangeEnd: 2,
          isSummary: false,
          words: [makeWord(1), makeWord(2)],
        },
      ],
    }],
  };
}

test('N2 seed creates only N2 sets and never deletes existing N3 data', async () => {
  const calls = [];
  const tx = {
    $executeRaw: async () => calls.push('lock'),
    vocabularySet: {
      upsert: async (args) => {
        calls.push(['upsert-set', args]);
        return { id: 'set-1' };
      },
      deleteMany: async () => {
        throw new Error('N2 seed must never delete vocabulary sets');
      },
    },
    vocabulary: {
      findMany: async () => [],
      createMany: async (args) => calls.push(['create-words', args]),
      update: async () => {
        throw new Error('new set should not update words');
      },
    },
  };
  const client = {
    $transaction: async (callback, options) => {
      calls.push(['transaction-options', options]);
      return callback(tx);
    },
  };

  await seedN2FromJson({
    client,
    data: candidate(),
    validator: (data) => ({ units: data.units }),
  });

  const setCall = calls.find(([name]) => name === 'upsert-set')[1];
  assert.equal(setCall.create.level, 'N2');
  assert.equal(setCall.create.code, 'N2-U01-P01');
  assert.equal(setCall.create.totalWords, 2);
  const wordCall = calls.find(([name]) => name === 'create-words')[1];
  assert.deepEqual(wordCall.data.map((word) => word.sourceNumber), [1, 2]);
  assert.ok(wordCall.data.every((word) => Array.isArray(word.relations)));
  const transactionOptions = calls.find(([name]) => name === 'transaction-options')[1];
  assert.equal(transactionOptions.maxWait, 30000);
  assert.equal(transactionOptions.timeout, 120000);
});

test('N2 seed updates words in place on repeated runs to preserve study results', async () => {
  const updates = [];
  const tx = {
    $executeRaw: async () => {},
    vocabularySet: {
      upsert: async () => ({ id: 'set-1' }),
    },
    vocabulary: {
      findMany: async () => [
        { id: 'vocab-1', position: 1 },
        { id: 'vocab-2', position: 2 },
      ],
      createMany: async () => {
        throw new Error('existing words must not be recreated');
      },
      update: async (args) => updates.push(args),
    },
  };
  const client = { $transaction: async (callback) => callback(tx) };

  await seedN2FromJson({
    client,
    data: candidate(),
    validator: (data) => ({ units: data.units }),
  });

  assert.deepEqual(updates.map((entry) => entry.where.id), ['vocab-1', 'vocab-2']);
  assert.equal(updates[0].data.meaning, 'Đời người, cuộc sống, cuộc đời');
  assert.equal(updates[0].data.sourceNumber, 1);
});
