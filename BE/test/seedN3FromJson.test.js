const test = require('node:test');
const assert = require('node:assert/strict');
const seedN3FromJson = require('../src/scripts/seedN3FromJson');

test('startup seed creates missing N3 lessons without deleting existing N2 data', async () => {
  const calls = [];
  const tx = {
    $executeRaw: async () => calls.push('lock'),
    vocabularySet: {
      findMany: async () => [],
      create: async () => {
        calls.push('create');
        return { id: 'set-1' };
      },
      deleteMany: async () => {
        throw new Error('N3 seed must never delete N2 sets');
      },
    },
    vocabulary: {
      createMany: async ({ data }) => calls.push(['create-words', data]),
    },
  };
  const client = { $transaction: async (callback) => callback(tx) };

  const seeded = await seedN3FromJson({ client });

  assert.equal(seeded, true);
  assert.equal(calls[0], 'lock');
  assert.equal(calls.filter((call) => call === 'create').length, 12);
  const wordCalls = calls.filter(([name]) => name === 'create-words');
  assert.equal(wordCalls.length, 12);
  assert.ok(wordCalls.every(([, words]) => words.every((word) => word.setId === 'set-1')));
});

test('startup seed backfills Han-Viet meanings without resetting existing vocabulary', async () => {
  const data = JSON.parse(require('node:fs').readFileSync(
    require('node:path').join(__dirname, '../file/n3_vocabulary.json'),
    'utf8',
  ));
  const lessons = Object.entries(data);
  const updates = [];
  const existingSets = lessons.map(([lessonName, words]) => ({
    name: `${lessonName} - Từ vựng N3 Mimikara`,
    vocabularies: words.map((word, index) => ({
      id: `${lessonName}-${index}`,
      position: index + 1,
      hanVietMeaning: '',
      word,
    })),
  }));
  const tx = {
    $executeRaw: async () => {},
    vocabularySet: {
      findMany: async () => existingSets,
      update: async () => {},
      deleteMany: async () => { throw new Error('existing vocabulary must not be deleted'); },
      create: async () => { throw new Error('existing vocabulary must not be recreated'); },
    },
    vocabulary: {
      update: async (args) => updates.push(args),
    },
  };
  const client = { $transaction: async (callback) => callback(tx) };

  const seeded = await seedN3FromJson({ client });

  assert.equal(seeded, true);
  const expectedUpdates = lessons.flatMap(([, words]) => words)
    .filter((word) => word.hanVietMeaning !== '').length;
  assert.equal(expectedUpdates, 693);
  assert.equal(updates.length, expectedUpdates);
  assert.ok(updates.some(({ data }) => data.hanVietMeaning === 'CẢM ĐỘNG'));
  assert.ok(updates.every(({ data }) => typeof data.hanVietMeaning === 'string'));
});
