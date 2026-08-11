const express = require('express');
const { GrammarServiceError } = require('../grammar/grammarService');

function parseNumber(value) {
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function createGrammarRouter({ service }) {
  const router = express.Router();

  router.get('/weeks', (req, res) => {
    res.json(service.listWeeks());
  });

  router.get('/weeks/:weekNumber', (req, res, next) => {
    try {
      res.json(service.getWeek(parseNumber(req.params.weekNumber)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/weeks/:weekNumber/days/:dayNumber', (req, res, next) => {
    try {
      res.json(service.getDay(
        parseNumber(req.params.weekNumber),
        parseNumber(req.params.dayNumber),
      ));
    } catch (error) {
      next(error);
    }
  });

  router.post('/weeks/:weekNumber/days/:dayNumber/questions/:questionId/check', (req, res, next) => {
    try {
      res.json(service.checkDailyQuestion(
        parseNumber(req.params.weekNumber),
        parseNumber(req.params.dayNumber),
        req.params.questionId,
        req.body?.answerOptionId,
      ));
    } catch (error) {
      next(error);
    }
  });

  router.post('/weeks/:weekNumber/days/7/grade', (req, res, next) => {
    try {
      res.json(service.gradeReview(
        parseNumber(req.params.weekNumber),
        req.body?.answers,
      ));
    } catch (error) {
      next(error);
    }
  });

  router.use((error, req, res, next) => {
    if (error instanceof GrammarServiceError) {
      return sendError(res, error.status, error.code, error.message);
    }
    return next(error);
  });

  return router;
}

module.exports = { createGrammarRouter };
