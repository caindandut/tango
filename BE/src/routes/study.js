const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * Fisher-Yates shuffle - returns array of indices
 */
function generateShuffledOrder(length) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// POST /api/study/start/:setId - Start a new study session
router.post('/start/:setId', async (req, res) => {
  try {
    const set = await prisma.vocabularySet.findUnique({
      where: { id: req.params.setId },
      include: { vocabularies: { orderBy: { position: 'asc' } } },
    });

    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }

    const shuffledOrder = generateShuffledOrder(set.vocabularies.length);

    const session = await prisma.studySession.create({
      data: {
        setId: set.id,
        totalWords: set.vocabularies.length,
        shuffledOrder,
      },
    });

    res.status(201).json({
      sessionId: session.id,
      totalWords: session.totalWords,
      currentIndex: 0,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start study session' });
  }
});

// GET /api/study/session/:sessionId - Get session state
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        set: {
          include: { vocabularies: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.id,
      totalWords: session.totalWords,
      currentIndex: session.currentIndex,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      isCompleted: session.isCompleted,
      setName: session.set.name,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// GET /api/study/session/:sessionId/current - Get current vocabulary word
router.get('/session/:sessionId/current', async (req, res) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        set: {
          include: { vocabularies: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isCompleted) {
      return res.json({ isCompleted: true });
    }

    const vocabIndex = session.shuffledOrder[session.currentIndex];
    const vocab = session.set.vocabularies[vocabIndex];

    if (!vocab) {
      return res.status(400).json({ error: 'Invalid vocabulary index' });
    }

    res.json({
      id: vocab.id,
      kanji: vocab.kanji,
      hiragana: vocab.hiragana,
      meaning: vocab.meaning,
      hiraganaLength: vocab.hiragana.length,
      currentIndex: session.currentIndex,
      totalWords: session.totalWords,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
    });
  } catch (error) {
    console.error('Get current vocab error:', error);
    res.status(500).json({ error: 'Failed to fetch current vocabulary' });
  }
});

// POST /api/study/session/:sessionId/check - Check user answer
router.post('/session/:sessionId/check', async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        set: {
          include: { vocabularies: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isCompleted) {
      return res.status(400).json({ error: 'Session is already completed' });
    }

    const vocabIndex = session.shuffledOrder[session.currentIndex];
    const vocab = session.set.vocabularies[vocabIndex];
    const isCorrect = answer.trim() === vocab.hiragana;

    // Save result
    await prisma.studyResult.create({
      data: {
        sessionId: session.id,
        vocabId: vocab.id,
        userAnswer: answer.trim(),
        isCorrect,
        hintsUsed: parseInt(req.body.hintsUsed) || 0,
      },
    });

    // Update session counts
    await prisma.studySession.update({
      where: { id: session.id },
      data: {
        correctCount: isCorrect ? session.correctCount + 1 : session.correctCount,
        wrongCount: !isCorrect ? session.wrongCount + 1 : session.wrongCount,
      },
    });

    res.json({
      isCorrect,
      correctAnswer: vocab.hiragana,
      userAnswer: answer.trim(),
    });
  } catch (error) {
    console.error('Check answer error:', error);
    res.status(500).json({ error: 'Failed to check answer' });
  }
});

// POST /api/study/session/:sessionId/hint - Get hint
router.post('/session/:sessionId/hint', async (req, res) => {
  try {
    const { revealCount } = req.body;

    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        set: {
          include: { vocabularies: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const vocabIndex = session.shuffledOrder[session.currentIndex];
    const vocab = session.set.vocabularies[vocabIndex];
    const hiragana = vocab.hiragana;
    const count = Math.min(parseInt(revealCount) || 1, hiragana.length);

    // Reveal first N characters
    const hint = hiragana.substring(0, count);

    res.json({
      hint,
      totalChars: hiragana.length,
      revealedCount: count,
    });
  } catch (error) {
    console.error('Get hint error:', error);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

// POST /api/study/session/:sessionId/next - Move to next word
router.post('/session/:sessionId/next', async (req, res) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const nextIndex = session.currentIndex + 1;
    const isCompleted = nextIndex >= session.totalWords;

    await prisma.studySession.update({
      where: { id: session.id },
      data: {
        currentIndex: nextIndex,
        isCompleted,
      },
    });

    res.json({
      currentIndex: nextIndex,
      isCompleted,
      totalWords: session.totalWords,
    });
  } catch (error) {
    console.error('Next word error:', error);
    res.status(500).json({ error: 'Failed to move to next word' });
  }
});

// POST /api/study/session/:sessionId/previous - Move to previous word
router.post('/session/:sessionId/previous', async (req, res) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const previousIndex = Math.max(0, session.currentIndex - 1);
    await prisma.studySession.update({
      where: { id: session.id },
      data: {
        currentIndex: previousIndex,
        isCompleted: false,
      },
    });

    res.json({
      currentIndex: previousIndex,
      isFirst: previousIndex === 0,
      totalWords: session.totalWords,
    });
  } catch (error) {
    console.error('Previous word error:', error);
    res.status(500).json({ error: 'Failed to move to previous word' });
  }
});

// GET /api/study/session/:sessionId/results - Get session results summary
router.get('/session/:sessionId/results', async (req, res) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        results: {
          include: {
            vocabulary: true,
          },
        },
        set: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const wrongAnswers = session.results
      .filter(r => !r.isCorrect)
      .map(r => ({
        kanji: r.vocabulary.kanji,
        hiragana: r.vocabulary.hiragana,
        meaning: r.vocabulary.meaning,
        userAnswer: r.userAnswer,
      }));

    res.json({
      setName: session.set.name,
      totalWords: session.totalWords,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      accuracy: session.totalWords > 0
        ? Math.round((session.correctCount / session.totalWords) * 100)
        : 0,
      wrongAnswers,
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
