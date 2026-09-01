const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();
const STUDY_MODES = new Set(['reading', 'flashcard', 'quiz']);

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

function normalizeStudyMode(mode) {
  return STUDY_MODES.has(mode) ? mode : 'reading';
}

/**
 * Generate and persistable quiz option indexes for every question in a session.
 * Distractors are unique readings from the same lesson and never share the
 * target reading, so each question has exactly one correct option.
 */
function generateQuizOptions(vocabularies, questionOrder) {
  const uniqueReadings = new Set(vocabularies.map((vocab) => vocab.hiragana));

  if (uniqueReadings.size < 4) {
    const error = new Error('Quiz requires at least 4 unique readings in this lesson');
    error.code = 'QUIZ_NOT_AVAILABLE';
    throw error;
  }

  return questionOrder.map((targetIndex) => {
    const targetReading = vocabularies[targetIndex].hiragana;
    const distractorPool = [];
    const seenReadings = new Set([targetReading]);

    vocabularies.forEach((vocab, index) => {
      if (index === targetIndex || seenReadings.has(vocab.hiragana)) return;
      seenReadings.add(vocab.hiragana);
      distractorPool.push(index);
    });

    const shuffledDistractors = generateShuffledOrder(distractorPool.length)
      .slice(0, 3)
      .map((poolIndex) => distractorPool[poolIndex]);

    return generateShuffledOrder(4).map((optionIndex) => (
      optionIndex === 0 ? targetIndex : shuffledDistractors[optionIndex - 1]
    ));
  });
}

function getSessionQuizOptions(session, vocabularies) {
  const optionIndexes = session.quizOptions?.[session.currentIndex];

  if (!Array.isArray(optionIndexes) || optionIndexes.length !== 4) {
    return null;
  }

  return optionIndexes.map((index) => vocabularies[index]?.hiragana).filter(Boolean);
}

function getQuizErrorResponse(error, res, fallbackMessage) {
  if (error.code === 'QUIZ_NOT_AVAILABLE') {
    return res.status(400).json({
      code: error.code,
      error: 'Bài này cần ít nhất 4 cách đọc khác nhau để mở chế độ trắc nghiệm',
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
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

    const { shuffle = false } = req.body || {};
    const mode = normalizeStudyMode(req.body?.mode);
    const shuffledOrder = shuffle
      ? generateShuffledOrder(set.vocabularies.length)
      : Array.from({ length: set.vocabularies.length }, (_, i) => i);
    const quizOptions = mode === 'quiz'
      ? generateQuizOptions(set.vocabularies, shuffledOrder)
      : undefined;


    const session = await prisma.studySession.create({
      data: {
        setId: set.id,
        mode,
        totalWords: set.vocabularies.length,
        roundStartIndex: 0,
        shuffledOrder,
        ...(quizOptions ? { quizOptions } : {}),
      },
    });

    res.status(201).json({
      sessionId: session.id,
      mode: session.mode,
      totalWords: session.totalWords,
      currentIndex: 0,
    });
  } catch (error) {
    return getQuizErrorResponse(error, res, 'Failed to start study session');
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
      mode: session.mode,
      totalWords: session.totalWords,
      currentIndex: session.currentIndex,
      roundStartIndex: session.roundStartIndex,
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

// PATCH /api/study/session/:sessionId/mode - Change mode without changing progress
router.patch('/session/:sessionId/mode', async (req, res) => {
  try {
    const mode = req.body?.mode;

    if (!STUDY_MODES.has(mode)) {
      return res.status(400).json({ error: 'Invalid study mode' });
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

    const quizOptions = mode === 'quiz'
      ? generateQuizOptions(session.set.vocabularies, session.shuffledOrder)
      : null;

    const updatedSession = await prisma.studySession.update({
      where: { id: session.id },
      data: {
        mode,
        ...(quizOptions ? { quizOptions } : {}),
      },
    });

    res.json({
      sessionId: updatedSession.id,
      mode: updatedSession.mode,
      currentIndex: updatedSession.currentIndex,
    });
  } catch (error) {
    return getQuizErrorResponse(error, res, 'Failed to change study mode');
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
      sourceNumber: vocab.sourceNumber,
      kanji: vocab.kanji,
      hiragana: vocab.hiragana,
      meaning: vocab.meaning,
      hanVietMeaning: vocab.hanVietMeaning,
      mode: session.mode,
      isReviewRound: session.currentIndex >= session.roundStartIndex && session.roundStartIndex > 0,
      reviewRoundSize: session.roundStartIndex > 0
        ? session.totalWords - session.roundStartIndex
        : 0,
      ...(session.mode === 'quiz'
        ? { quizOptions: getSessionQuizOptions(session, session.set.vocabularies) }
        : {}),
      hiraganaLength: vocab.hiragana.length,
      currentIndex: session.currentIndex,
      totalWords: session.totalWords,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      examples: Array.isArray(vocab.examples) ? vocab.examples : [],
      relations: Array.isArray(vocab.relations) ? vocab.relations : [],
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
      include: {
        results: {
          orderBy: [
            { answeredAt: 'desc' },
            { id: 'desc' },
          ],
        },
        set: {
          include: { vocabularies: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const nextIndex = session.currentIndex + 1;
    const reachedRoundEnd = nextIndex >= session.totalWords;

    if (reachedRoundEnd && session.mode !== 'flashcard') {
      const roundIndexes = session.shuffledOrder.slice(session.roundStartIndex);
      const roundVocabIds = new Set(
        roundIndexes.map((vocabIndex) => session.set.vocabularies[vocabIndex]?.id).filter(Boolean),
      );
      const latestResultByVocab = new Map();

      session.results.forEach((result) => {
        if (roundVocabIds.has(result.vocabId) && !latestResultByVocab.has(result.vocabId)) {
          latestResultByVocab.set(result.vocabId, result);
        }
      });

      const failedIndexes = roundIndexes.filter((vocabIndex) => {
        const vocab = session.set.vocabularies[vocabIndex];
        return vocab && latestResultByVocab.get(vocab.id)?.isCorrect === false;
      });

      if (failedIndexes.length > 0) {
        const reviewOrder = generateShuffledOrder(failedIndexes.length)
          .map((index) => failedIndexes[index]);
        const totalWords = session.totalWords + reviewOrder.length;
        const reviewQuizOptions = session.mode === 'quiz'
          ? generateQuizOptions(session.set.vocabularies, reviewOrder)
          : null;

        await prisma.studySession.update({
          where: { id: session.id },
          data: {
            currentIndex: nextIndex,
            totalWords,
            roundStartIndex: nextIndex,
            shuffledOrder: [...session.shuffledOrder, ...reviewOrder],
            ...(reviewQuizOptions
              ? { quizOptions: [...(session.quizOptions || []), ...reviewQuizOptions] }
              : {}),
            isCompleted: false,
          },
        });

        return res.json({
          currentIndex: nextIndex,
          isCompleted: false,
          isReviewRound: true,
          reviewCount: reviewOrder.length,
          totalWords,
        });
      }
    }

    const isCompleted = reachedRoundEnd;

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
      isReviewRound: false,
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
          orderBy: [
            { answeredAt: 'desc' },
            { id: 'desc' },
          ],
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

    const latestResultByVocab = new Map();
    session.results.forEach((result) => {
      if (!latestResultByVocab.has(result.vocabId)) {
        latestResultByVocab.set(result.vocabId, result);
      }
    });

    const wrongAnswers = Array.from(latestResultByVocab.values())
      .filter((result) => !result.isCorrect)
      .map(r => ({
        kanji: r.vocabulary.kanji,
        hiragana: r.vocabulary.hiragana,
        meaning: r.vocabulary.meaning,
        hanVietMeaning: r.vocabulary.hanVietMeaning,
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
