const express = require('express');
const prisma = require('../lib/prisma');

const SUPPORTED_LEVELS = new Set(['N2', 'N3']);

function compareSets(a, b) {
  if (a.level !== b.level) return String(a.level).localeCompare(String(b.level));

  const unitDifference = (a.unitNumber ?? Number.MAX_SAFE_INTEGER)
    - (b.unitNumber ?? Number.MAX_SAFE_INTEGER);
  if (unitDifference !== 0) return unitDifference;

  const partDifference = (a.partNumber ?? Number.MAX_SAFE_INTEGER)
    - (b.partNumber ?? Number.MAX_SAFE_INTEGER);
  if (partDifference !== 0) return partDifference;

  const numberA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
  const numberB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
  return numberA - numberB;
}

function createVocabularyRouter(client = prisma) {
  const router = express.Router();

  // GET /api/vocabulary/sets?level=N2|N3 - response remains an array.
  router.get('/sets', async (req, res) => {
    const { level } = req.query;

    if (level !== undefined && !SUPPORTED_LEVELS.has(level)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LEVEL',
          message: 'Level must be N2 or N3',
        },
      });
    }

    try {
      const sets = await client.vocabularySet.findMany({
        ...(level ? { where: { level } } : {}),
        select: {
          id: true,
          code: true,
          name: true,
          level: true,
          unitNumber: true,
          unitTitle: true,
          partNumber: true,
          partTitle: true,
          rangeStart: true,
          rangeEnd: true,
          isSummary: true,
          totalWords: true,
          createdAt: true,
          _count: {
            select: { sessions: true },
          },
        },
      });

      sets.sort(compareSets);
      return res.json(sets);
    } catch (error) {
      console.error('List sets error:', error);
      return res.status(500).json({ error: 'Failed to fetch vocabulary sets' });
    }
  });

  router.get('/sets/:id', async (req, res) => {
    try {
      const set = await client.vocabularySet.findUnique({
        where: { id: req.params.id },
        include: {
          vocabularies: { orderBy: { position: 'asc' } },
        },
      });

      if (!set) return res.status(404).json({ error: 'Vocabulary set not found' });
      return res.json(set);
    } catch (error) {
      console.error('Get set error:', error);
      return res.status(500).json({ error: 'Failed to fetch vocabulary set' });
    }
  });

  router.delete('/sets/:id', async (req, res) => {
    try {
      await client.vocabularySet.delete({ where: { id: req.params.id } });
      return res.json({ message: 'Vocabulary set deleted successfully' });
    } catch (error) {
      console.error('Delete set error:', error);
      return res.status(500).json({ error: 'Failed to delete vocabulary set' });
    }
  });

  return router;
}

module.exports = createVocabularyRouter();
module.exports.createVocabularyRouter = createVocabularyRouter;
module.exports.compareSets = compareSets;
