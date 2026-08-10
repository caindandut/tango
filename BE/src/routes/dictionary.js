const express = require('express');
const { DictionaryLookupError, lookupJapaneseWord } = require('../lib/dictionaryLookup');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

function createDictionaryRouter({ lookup = lookupJapaneseWord, maxAttempts = MAX_ATTEMPTS } = {}) {
  const router = express.Router();
  const attemptsByIp = new Map();

  const allowLookup = (ip, now = Date.now()) => {
    const attempts = (attemptsByIp.get(ip) || []).filter((time) => now - time < WINDOW_MS);
    if (attempts.length >= maxAttempts) return false;
    attempts.push(now);
    attemptsByIp.set(ip, attempts);
    return true;
  };

  router.post('/lookup', async (req, res) => {
    if (!allowLookup(req.ip)) {
      return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Bạn đã tra cứu quá nhiều lần. Hãy thử lại sau.' } });
    }

    try {
      const result = await lookup(req.body);
      return res.json(result);
    } catch (error) {
      if (!(error instanceof DictionaryLookupError)) {
        console.error('Dictionary lookup error:', error);
        return res.status(502).json({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Dịch vụ tra cứu hiện chưa phản hồi. Hãy thử lại.' } });
      }

      const errors = {
        TERM_INVALID: [400, 'Từ được chọn không hợp lệ.'],
        SENTENCE_INVALID: [400, 'Câu ví dụ không hợp lệ.'],
        SERVICE_NOT_CONFIGURED: [503, 'Tính năng tra cứu chưa được cấu hình.'],
        UPSTREAM_RATE_LIMITED: [429, 'Dịch vụ tra cứu đang quá tải quota. Hãy thử lại sau.'],
        UPSTREAM_UNAVAILABLE: [502, 'Dịch vụ tra cứu hiện chưa phản hồi. Hãy thử lại.'],
        MODEL_RESPONSE_INVALID: [502, 'Không thể đọc kết quả tra cứu. Hãy thử lại.'],
      };
      const [status, message] = errors[error.code] || [502, 'Không thể tra cứu lúc này.'];
      return res.status(status).json({ error: { code: error.code, message } });
    }
  });

  return router;
}

const router = createDictionaryRouter();

module.exports = router;
module.exports.createDictionaryRouter = createDictionaryRouter;
