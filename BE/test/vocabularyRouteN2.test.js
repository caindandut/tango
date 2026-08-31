const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createVocabularyRouter } = require('../src/routes/vocabulary');

async function request(router, url) {
  const app = express();
  app.use('/', router);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('vocabulary sets filter N2 and sort by unit then part with additive metadata', async () => {
  const queries = [];
  const records = [
    { id: 'u2', code: 'N2-U02-P01', level: 'N2', unitNumber: 2, partNumber: 1 },
    { id: 'u1p2', code: 'N2-U01-P02', level: 'N2', unitNumber: 1, partNumber: 2 },
    { id: 'u1p1', code: 'N2-U01-P01', level: 'N2', unitNumber: 1, partNumber: 1 },
  ];
  const router = createVocabularyRouter({
    vocabularySet: {
      findMany: async (query) => {
        queries.push(query);
        return records;
      },
    },
  });

  const response = await request(router, '/sets?level=N2');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.map((set) => set.code), [
    'N2-U01-P01',
    'N2-U01-P02',
    'N2-U02-P01',
  ]);
  assert.deepEqual(queries[0].where, { level: 'N2' });
  for (const field of [
    'code', 'level', 'unitNumber', 'unitTitle', 'partNumber',
    'partTitle', 'rangeStart', 'rangeEnd', 'isSummary',
  ]) {
    assert.equal(queries[0].select[field], true);
  }
});

test('vocabulary sets reject unsupported level filters at the HTTP boundary', async () => {
  const router = createVocabularyRouter({
    vocabularySet: {
      findMany: async () => {
        throw new Error('invalid level must not reach Prisma');
      },
    },
  });

  const response = await request(router, '/sets?level=N1');

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_LEVEL');
});
