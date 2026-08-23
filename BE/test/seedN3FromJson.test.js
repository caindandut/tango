const test = require('node:test');
const assert = require('node:assert/strict');
const seedN3FromJson = require('../src/scripts/seedN3FromJson');

test('startup seed skips reset when vocabulary already exists', async () => {
  const calls = [];
  const tx = {
    $executeRaw: async () => calls.push('lock'),
    vocabularySet: {
      count: async () => 1,
      findMany: async () => [],
      deleteMany: async () => calls.push('delete'),
      create: async () => calls.push('create'),
    },
  };
  const client = { $transaction: async (callback) => callback(tx) };

  const seeded = await seedN3FromJson({ client });

  assert.equal(seeded, false);
  assert.deepEqual(calls, ['lock']);
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
      count: async () => existingSets.length,
      findMany: async () => existingSets,
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
