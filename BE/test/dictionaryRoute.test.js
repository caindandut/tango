const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createDictionaryRouter } = require('../src/routes/dictionary');
const { DictionaryLookupError } = require('../src/lib/dictionaryLookup');

async function request(router, body) {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('dictionary route returns a lookup result', async () => {
  const router = createDictionaryRouter({
    lookup: async () => ({ term: '図書館', meaning: 'thư viện', hiragana: 'としょかん' }),
  });
  const response = await request(router, { term: '図書館', sentence: '図書館へ行く。' });

  assert.equal(response.status, 200);
  assert.equal(response.body.meaning, 'thư viện');
});

test('dictionary route returns a generic configuration error without sensitive details', async () => {
  const router = createDictionaryRouter({
    lookup: async () => { throw new DictionaryLookupError('SERVICE_NOT_CONFIGURED'); },
  });
  const response = await request(router, { term: '図書館', sentence: '図書館へ行く。' });

  assert.equal(response.status, 503);
  assert.equal(response.body.error.code, 'SERVICE_NOT_CONFIGURED');
  assert.doesNotMatch(JSON.stringify(response.body), /GEMINI_API_KEY/i);
});

test('dictionary route limits repeated lookups', async () => {
  const router = createDictionaryRouter({
    maxAttempts: 1,
    lookup: async () => ({ term: '図書館', meaning: 'thư viện', hiragana: 'としょかん' }),
  });

  await request(router, { term: '図書館', sentence: '図書館へ行く。' });
  const response = await request(router, { term: '図書館', sentence: '図書館へ行く。' });

  assert.equal(response.status, 429);
  assert.equal(response.body.error.code, 'RATE_LIMITED');
});
