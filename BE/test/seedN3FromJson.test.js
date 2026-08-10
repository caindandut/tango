const test = require('node:test');
const assert = require('node:assert/strict');
const seedN3FromJson = require('../src/scripts/seedN3FromJson');

test('startup seed skips reset when vocabulary already exists', async () => {
  const calls = [];
  const tx = {
    $executeRaw: async () => calls.push('lock'),
    vocabularySet: {
      count: async () => 1,
      deleteMany: async () => calls.push('delete'),
      create: async () => calls.push('create'),
    },
  };
  const client = { $transaction: async (callback) => callback(tx) };

  const seeded = await seedN3FromJson({ client });

  assert.equal(seeded, false);
  assert.deepEqual(calls, ['lock']);
});
