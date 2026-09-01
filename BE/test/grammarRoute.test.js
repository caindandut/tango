const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { createGrammarRouter } = require('../src/routes/grammar');
const { createGrammarService } = require('../src/grammar/grammarService');
const { buildValidCurriculum } = require('./grammarValidator.test');
const curriculum = require('../src/data/grammar/curriculum.json');

async function request(router, path, { method = 'GET', body } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function setupRouter() {
  return createGrammarRouter({
    service: createGrammarService(buildValidCurriculum()),
  });
}

function assertNoPrivateAnswerData(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /correctOptionId/);
  assert.doesNotMatch(serialized, /explanationVi/);
  assert.doesNotMatch(serialized, /correctSentenceJa/);
  assert.doesNotMatch(serialized, /correctOrder/);
}

test('GET endpoints expose weeks and lessons without private answers', async () => {
  const router = setupRouter();
  const weeks = await request(router, '/weeks');
  const week = await request(router, '/weeks/1');
  const day = await request(router, '/weeks/1/days/1');

  assert.equal(weeks.status, 200);
  assert.equal(weeks.body.weeks.length, 6);
  assert.equal(week.status, 200);
  assert.equal(week.body.days.length, 7);
  assert.equal(day.status, 200);
  assert.equal(day.body.questions.length, 7);
  assertNoPrivateAnswerData(weeks.body);
  assertNoPrivateAnswerData(week.body);
  assertNoPrivateAnswerData(day.body);
});

test('daily check locks onto a known question and returns its reviewed explanation', async () => {
  const response = await request(
    setupRouter(),
    '/weeks/1/days/1/questions/w1d1-q1/check',
    { method: 'POST', body: { answerOptionId: 'A' } },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    questionId: 'w1d1-q1',
    selectedOptionId: 'A',
    correctOptionId: 'A',
    isCorrect: true,
    explanationVi: 'A đúng vì phù hợp với cấu trúc và ngữ cảnh của câu.',
  });
});

test('daily check rejects review day, fake IDs and invalid answer IDs', async () => {
  const router = setupRouter();
  const reviewDay = await request(
    router,
    '/weeks/1/days/7/questions/w1d7-q1/check',
    { method: 'POST', body: { answerOptionId: 'A' } },
  );
  const fakeQuestion = await request(
    router,
    '/weeks/1/days/1/questions/fake/check',
    { method: 'POST', body: { answerOptionId: 'A' } },
  );
  const invalidAnswer = await request(
    router,
    '/weeks/1/days/1/questions/w1d1-q1/check',
    { method: 'POST', body: { answerOptionId: 'E' } },
  );

  assert.equal(reviewDay.status, 400);
  assert.equal(reviewDay.body.error.code, 'INVALID_DAY_KIND');
  assert.equal(fakeQuestion.status, 404);
  assert.equal(fakeQuestion.body.error.code, 'QUESTION_NOT_FOUND');
  assert.equal(invalidAnswer.status, 400);
  assert.equal(invalidAnswer.body.error.code, 'INVALID_ANSWER');
});

test('review grading gives four points per correct answer and treats blanks as wrong', async () => {
  const answers = Array.from({ length: 24 }, (_, index) => ({
    questionId: `w1d7-q${index + 1}`,
    answerOptionId: index === 0 ? 'A' : 'B',
  }));
  const response = await request(
    setupRouter(),
    '/weeks/1/days/7/grade',
    { method: 'POST', body: { answers } },
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.score, 4);
  assert.equal(response.body.maxScore, 100);
  assert.equal(response.body.correctCount, 1);
  assert.equal(response.body.results.length, 25);
  assert.equal(response.body.results[24].selectedOptionId, null);
  assert.equal(response.body.results[24].isCorrect, false);
  assert.equal(response.body.results[0].explanationVi.length > 0, true);
});

test('route rejects out-of-range params, duplicate submissions and unknown review questions', async () => {
  const router = setupRouter();
  const badWeek = await request(router, '/weeks/7');
  const badDay = await request(router, '/weeks/1/days/0');
  const duplicate = await request(router, '/weeks/1/days/7/grade', {
    method: 'POST',
    body: { answers: [
      { questionId: 'w1d7-q1', answerOptionId: 'A' },
      { questionId: 'w1d7-q1', answerOptionId: 'A' },
    ] },
  });
  const unknown = await request(router, '/weeks/1/days/7/grade', {
    method: 'POST',
    body: { answers: [{ questionId: 'fake', answerOptionId: 'A' }] },
  });

  assert.equal(badWeek.status, 400);
  assert.equal(badWeek.body.error.code, 'INVALID_WEEK');
  assert.equal(badDay.status, 400);
  assert.equal(badDay.body.error.code, 'INVALID_DAY');
  assert.equal(duplicate.status, 400);
  assert.equal(duplicate.body.error.code, 'DUPLICATE_ANSWER');
  assert.equal(unknown.status, 400);
  assert.equal(unknown.body.error.code, 'INVALID_QUESTION_ID');
});

test('review prompts do not append a second blank after the source blank', () => {
  for (const week of curriculum.weeks) {
    for (const question of week.days[6].questions) {
      if (question.type === 'STAR_CHOICE') continue;
      const lastSegment = question.promptSegments.at(-1);
      assert.notEqual(lastSegment?.text, ' ____ ', `thừa gạch ở ${question.id}`);
    }
  }
});
