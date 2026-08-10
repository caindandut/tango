const { GoogleGenAI, ThinkingLevel } = require('@google/genai');

const MAX_TERM_LENGTH = 80;
const MAX_SENTENCE_LENGTH = 500;
const MAX_MEANING_LENGTH = 400;
const JAPANESE_TERM_PATTERN = /^[\u3041-\u3096\u30a1-\u30fa\u30fc\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3005\u3006\u30f6]+$/u;
const HIRAGANA_PATTERN = /^[\u3041-\u3096\u30fc]+$/u;
const KANJI_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

class DictionaryLookupError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function validateLookupInput(input) {
  const term = typeof input?.term === 'string' ? input.term.trim() : '';
  const sentence = typeof input?.sentence === 'string' ? input.sentence.trim() : '';

  if (!term || term.length > MAX_TERM_LENGTH || !JAPANESE_TERM_PATTERN.test(term)) {
    throw new DictionaryLookupError('TERM_INVALID');
  }

  if (!sentence || sentence.length > MAX_SENTENCE_LENGTH || !JAPANESE_TERM_PATTERN.test(sentence.replace(/[\s\p{P}\p{S}]/gu, ''))) {
    throw new DictionaryLookupError('SENTENCE_INVALID');
  }

  return { term, sentence, hasKanji: KANJI_PATTERN.test(term) };
}

function parseLookupResponse(text, lookup) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DictionaryLookupError('MODEL_RESPONSE_INVALID');
  }

  const meaning = typeof parsed?.meaning === 'string' ? parsed.meaning.trim() : '';
  const hiragana = parsed?.hiragana;
  const validMeaning = meaning
    && meaning.length <= MAX_MEANING_LENGTH
    && !/[<>\u0000-\u001f]/u.test(meaning);
  const validHiragana = typeof hiragana === 'string' && HIRAGANA_PATTERN.test(hiragana);

  if (!validMeaning || (lookup.hasKanji && !validHiragana) || (!lookup.hasKanji && hiragana !== null)) {
    throw new DictionaryLookupError('MODEL_RESPONSE_INVALID');
  }

  return {
    term: lookup.term,
    meaning,
    hiragana: lookup.hasKanji ? hiragana : null,
  };
}

async function lookupJapaneseWord(input, apiKey = process.env.GEMINI_API_KEY) {
  const lookup = validateLookupInput(input);
  if (!apiKey) throw new DictionaryLookupError('SERVICE_NOT_CONFIGURED');

  const client = new GoogleGenAI({ apiKey });
  let response;
  try {
    response = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Bạn là từ điển Nhật-Việt. Tra nghĩa phần được chọn trong ngữ cảnh câu. Chỉ trả JSON theo schema. Không thêm giải thích.\nTừ được chọn: ${lookup.term}\nCâu ngữ cảnh: ${lookup.sentence}`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            meaning: { type: 'string', description: 'Nghĩa tiếng Việt ngắn gọn' },
            hiragana: { type: ['string', 'null'], description: 'Cách đọc bằng hiragana; null nếu từ không có kanji' },
          },
          required: ['meaning', 'hiragana'],
        },
        maxOutputTokens: 160,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });
  } catch (error) {
    const status = error?.status || error?.code;
    if (status === 429 || status === 'RESOURCE_EXHAUSTED') {
      throw new DictionaryLookupError('UPSTREAM_RATE_LIMITED');
    }
    throw new DictionaryLookupError('UPSTREAM_UNAVAILABLE');
  }

  return parseLookupResponse(response?.text, lookup);
}

module.exports = {
  DictionaryLookupError,
  lookupJapaneseWord,
  parseLookupResponse,
  validateLookupInput,
};
