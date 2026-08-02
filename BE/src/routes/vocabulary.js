const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/vocabulary/sets - List all vocabulary sets (Bài 1, Bài 2, ...)
router.get('/sets', async (req, res) => {
  try {
    const sets = await prisma.vocabularySet.findMany({
      select: {
        id: true,
        name: true,
        totalWords: true,
        createdAt: true,
        _count: {
          select: { sessions: true },
        },
      },
    });

    // Natural sort: "Bài 1", "Bài 2", ..., "Bài 10", "Bài 15"
    sets.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    });

    res.json(sets);
  } catch (error) {
    console.error('List sets error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary sets' });
  }
});

// GET /api/vocabulary/sets/:id - Get vocabulary set details
router.get('/sets/:id', async (req, res) => {
  try {
    const set = await prisma.vocabularySet.findUnique({
      where: { id: req.params.id },
      include: {
        vocabularies: { orderBy: { position: 'asc' } },
      },
    });

    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }

    res.json(set);
  } catch (error) {
    console.error('Get set error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary set' });
  }
});

// DELETE /api/vocabulary/sets/:id - Delete a vocabulary set
router.delete('/sets/:id', async (req, res) => {
  try {
    await prisma.vocabularySet.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vocabulary set deleted successfully' });
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary set' });
  }
});

module.exports = router;
