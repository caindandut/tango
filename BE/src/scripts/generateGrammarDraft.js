/* eslint-disable no-console */
require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { GoogleGenAI, ThinkingLevel } = require('@google/genai');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const IMAGE_DIR = path.join(ROOT_DIR, 'tmp', 'pdfs', 'soumatome-data');
const DRAFT_DIR = path.join(ROOT_DIR, 'tmp', 'grammar-drafts');
const MODEL = process.env.GRAMMAR_EXTRACTION_MODEL || 'gemini-3.5-flash-lite';

const WEEK_RANGES = Object.freeze({
  1: { divider: 13, firstLesson: 14, review: [26, 27, 28], printedOffset: 0, answer: 112 },
  2: { divider: 29, firstLesson: 30, review: [42, 43, 44], printedOffset: 0, answer: 113 },
  3: { divider: 45, firstLesson: 46, review: [58, 59, 60], printedOffset: 0, answer: [113, 114] },
  4: { divider: 61, firstLesson: 62, review: [74, 75, 76], printedOffset: 0, answer: 114 },
  5: { divider: 77, firstLesson: 78, review: [89, 90, 91], printedOffset: 1, answer: [114, 115] },
  6: { divider: 92, firstLesson: 93, review: [105, 106, 107], printedOffset: 1, answer: 115 },
});

const segmentSchema = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    isGrammar: { type: 'boolean' },
  },
  required: ['text', 'isGrammar'],
  additionalProperties: false,
};

const optionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
    text: { type: 'string' },
  },
  required: ['id', 'text'],
  additionalProperties: false,
};

const questionSchema = {
  type: 'object',
  properties: {
    number: { type: 'integer' },
    type: { type: 'string', enum: ['BINARY_CHOICE', 'STAR_CHOICE', 'REVIEW_CHOICE', 'REVIEW_CLOZE'] },
    promptSegments: { type: 'array', items: segmentSchema },
    options: { type: 'array', items: optionSchema },
    correctOptionId: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
    correctOrder: {
      type: ['array', 'null'],
      items: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
    },
    explanationVi: { type: 'string' },
    correctSentenceJa: { type: ['string', 'null'] },
    sourceExplanationJa: { type: ['string', 'null'] },
    passageNumber: { type: ['integer', 'null'] },
  },
  required: [
    'number',
    'type',
    'promptSegments',
    'options',
    'correctOptionId',
    'correctOrder',
    'explanationVi',
    'correctSentenceJa',
    'sourceExplanationJa',
    'passageNumber',
  ],
  additionalProperties: false,
};

const lessonSchema = {
  type: 'object',
  properties: {
    weekNumber: { type: 'integer' },
    dayNumber: { type: 'integer' },
    titleJa: { type: 'string' },
    titleVi: { type: 'string' },
    contentPdfPage: { type: 'integer' },
    contentPrintedPage: { type: 'integer' },
    exercisePdfPage: { type: 'integer' },
    exercisePrintedPage: { type: 'integer' },
    grammarPoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titleJa: { type: 'string' },
          meaningVi: { type: 'string' },
          structures: { type: 'array', items: { type: 'string' } },
          usageVi: { type: 'string' },
          examples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                segments: { type: 'array', items: segmentSchema },
                translationVi: { type: 'string' },
                paraphraseJa: { type: ['string', 'null'] },
              },
              required: ['segments', 'translationVi', 'paraphraseJa'],
              additionalProperties: false,
            },
          },
        },
        required: ['titleJa', 'meaningVi', 'structures', 'usageVi', 'examples'],
        additionalProperties: false,
      },
    },
    questions: { type: 'array', items: questionSchema },
    transcriptionWarnings: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'weekNumber',
    'dayNumber',
    'titleJa',
    'titleVi',
    'contentPdfPage',
    'contentPrintedPage',
    'exercisePdfPage',
    'exercisePrintedPage',
    'grammarPoints',
    'questions',
    'transcriptionWarnings',
  ],
  additionalProperties: false,
};

const reviewSchema = {
  type: 'object',
  properties: {
    weekNumber: { type: 'integer' },
    titleVi: { type: 'string' },
    pdfPages: { type: 'array', items: { type: 'integer' } },
    printedPages: { type: 'array', items: { type: 'integer' } },
    passages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          segments: { type: 'array', items: segmentSchema },
        },
        required: ['number', 'segments'],
        additionalProperties: false,
      },
    },
    questions: { type: 'array', items: questionSchema },
    transcriptionWarnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['weekNumber', 'titleVi', 'pdfPages', 'printedPages', 'passages', 'questions', 'transcriptionWarnings'],
  additionalProperties: false,
};

function parseArguments(argv) {
  const args = Object.fromEntries(argv.map((entry) => {
    const [key, value = 'true'] = entry.replace(/^--/, '').split('=');
    return [key, value];
  }));
  const weekNumber = Number(args.week);
  const dayNumber = args.day === 'review' ? 7 : Number(args.day);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 6
    || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    throw new Error('Cách dùng: node src/scripts/generateGrammarDraft.js --week=1 --day=1|review');
  }
  return { weekNumber, dayNumber };
}

function pageFile(pageNumber) {
  return path.join(IMAGE_DIR, `page-${String(pageNumber).padStart(3, '0')}.jpg`);
}

async function imagePart(pageNumber) {
  const data = await fs.readFile(pageFile(pageNumber), 'base64');
  return [
    { text: `PDF PAGE ${pageNumber} (hãy dùng đúng nhãn trang này cho source):` },
    { inlineData: { mimeType: 'image/jpeg', data } },
  ];
}

function lessonPrompt(weekNumber, dayNumber, contentPage, exercisePage, answerPage, printedOffset) {
  return `Bạn đang nhập liệu từ bản scan sách Soumatome N3 Ngữ pháp Nhật–Việt.

Chỉ đọc ba ảnh được cung cấp: PDF page ${contentPage} là đầu bài học tuần ${weekNumber} ngày ${dayNumber}; PDF page ${exercisePage} là phần tiếp theo và bài tập ngay sau đó; dải nhỏ ở chân PDF page ${answerPage} ghi "${exercisePage + printedOffset}ページの答え" và là đáp án chính thức cho bài này. printedPage = pdfPage + ${printedOffset}.

Yêu cầu chép chính xác:
- Bỏ tiếng Anh, tranh và hội thoại mở bài. Lấy 3–4 mục ngữ pháp ở phần nội dung.
- titleJa là TIÊU ĐỀ NỀN XANH LỚN BÊN TRÁI của từng mục (ví dụ "書かれている", không phải "Vられる〈受身形〉"). structures lấy trực tiếp từ khối cấu trúc nhỏ bên phải. usageVi CHỈ chép nguyên văn câu giải thích tiếng Việt bên phải, bỏ hoàn toàn câu Nhật và Anh. meaningVi dùng chính câu giải thích tiếng Việt đó (có thể giống usageVi), tuyệt đối không lấy bản dịch của ví dụ và không tự thêm kiến thức ngoài sách.
- Lấy TẤT CẢ ví dụ của từng mục. Mỗi ví dụ tách segments đúng theo phần gạch chân trong sách: phần gạch chân có isGrammar=true, phần còn lại false. Chép bản dịch tiếng Việt; chép paraphraseJa trong ngoặc nếu có, nếu không thì null.
- Bài tập bám đúng số câu trên PDF: thông thường câu 1–5 là BINARY_CHOICE với A/B và câu 6–7 là STAR_CHOICE với A/B/C/D; riêng ngày nào PDF có số câu khác thì giữ đúng số câu nguồn, không tự thêm câu. (Trong sách STAR đánh số 1–4, đổi lần lượt thành A–D.) promptSegments chỉ chứa câu có một chỗ trống, KHÔNG lặp lại nội dung lựa chọn trong prompt; mọi segment câu hỏi để isGrammar=false.
- Đáp án câu 1–5 phải lấy từ dải đáp án nhỏ ở chân PDF page ${answerPage}; correctOrder=null. Câu 6–7 lấy chuỗi thứ tự 4 số tại cùng dải đáp án, đổi thành correctOrder gồm bốn ID A–D; ★ là chỗ trống THỨ BA, nên correctOptionId chính là phần tử thứ ba của correctOrder. correctSentenceJa ghép đúng CẢ BỐN mảnh theo correctOrder, không được lặp hoặc bỏ từ; câu thường để null.
- explanationVi là lời giải tiếng Việt mới, ngắn gọn nhưng nêu rõ ngữ pháp/ngữ cảnh khiến đáp án đúng và vì sao lựa chọn dễ nhầm không phù hợp. Đây là phần AI tạo một lần để duyệt, không phải lời sách.
- sourceExplanationJa chỉ chép nếu trang có lời giải Nhật; nếu không thì null. passageNumber luôn null.
- Không đoán chữ mờ: ghi nghi vấn vào transcriptionWarnings nhưng vẫn chép phương án có khả năng nhất.
- Không thêm furigana/ruby. Không dịch lại câu nếu sách đã có bản dịch Việt.

Trả đúng JSON theo schema, không markdown.`;
}

function reviewPrompt(weekNumber, reviewPages, printedOffset, answerPages) {
  const printedPages = reviewPages.map((page) => page + printedOffset);
  return `Bạn đang nhập liệu bài 実戦問題 (ngày 7) tuần ${weekNumber} từ bản scan Soumatome N3 Ngữ pháp Nhật–Việt.

Ảnh đề là PDF pages ${reviewPages.join(', ')} (printed pages ${printedPages.join(', ')}). Ảnh đáp án/phụ lục là PDF pages ${answerPages.join(', ')}; chỉ dùng đúng khối 第${weekNumber}週 実戦問題 trong phụ lục.

Yêu cầu chép chính xác đủ 25 câu:
- Câu 1–15: REVIEW_CHOICE. Chép câu hỏi và mọi lựa chọn; lựa chọn sách đánh số 1–4 đổi thành A–D.
- Câu 16–20: STAR_CHOICE. Chép bốn mảnh A–D, giữ ____ và ★; correctOptionId là mảnh rơi vào ★ theo chuỗi thứ tự trong đáp án. correctSentenceJa là câu hoàn chỉnh sau khi sắp xếp.
- Câu 21–25: REVIEW_CLOZE thuộc 問題3. Chép toàn bộ đoạn văn vào passages (tách đoạn text an toàn, isGrammar=false), và mỗi câu có passageNumber tương ứng. Chép các lựa chọn A–D.
- correctOptionId đối chiếu phụ lục, không tự suy đoán. sourceExplanationJa chép nguyên phần giải thích ngắn trong ngoặc từ phụ lục nếu có; nếu phụ lục chỉ có số thì null.
- explanationVi là lời giải tiếng Việt mới, ngắn gọn nhưng cụ thể, dịch/diễn giải phần Nhật trong phụ lục và giải thích vì sao đáp án hợp ngữ pháp/ngữ cảnh. Đây là phần AI tạo một lần để duyệt.
- promptSegments giữ câu Nhật chính xác, không furigana/ruby; isGrammar=false vì đề không cần gạch chân. Với câu điền đoạn văn, prompt có thể là vị trí trống và ngữ cảnh ngắn, nhưng không được bỏ passage.
- Mỗi câu phải có đúng 4 lựa chọn A–D. Không để lộ nội dung từ tuần khác trong trang phụ lục.
- correctOrder=null cho câu 1–15 và 21–25. Với câu 16–20, chép đúng chuỗi thứ tự bốn số từ phụ lục rồi đổi từng số 1/2/3/4 thành A/B/C/D; phần tử thứ ba phải bằng correctOptionId.
- Không đoán chữ mờ: ghi vào transcriptionWarnings nhưng vẫn chép phương án có khả năng nhất.

Trả đúng JSON theo schema, không markdown.`;
}

async function generateDraft({ weekNumber, dayNumber }) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Thiếu GEMINI_API_KEY.');
  const range = WEEK_RANGES[weekNumber];
  const isReview = dayNumber === 7;
  const answerPages = Array.isArray(range.answer) ? range.answer : [range.answer];
  const contentPage = range.firstLesson + ((dayNumber - 1) * 2);
  const exercisePage = contentPage + 1;
  const dailyAnswerPage = dayNumber < 6 ? exercisePage + 2 : range.review[2];
  const sourcePages = isReview
    ? [...range.review, ...answerPages]
    : [contentPage, exercisePage, dailyAnswerPage];
  const prompt = isReview
    ? reviewPrompt(weekNumber, range.review, range.printedOffset, answerPages)
    : lessonPrompt(
      weekNumber,
      dayNumber,
      contentPage,
      exercisePage,
      dailyAnswerPage,
      range.printedOffset,
    );
  const imageParts = [];
  for (const page of sourcePages) imageParts.push(...await imagePart(page));

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let response;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      response = await client.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: isReview ? reviewSchema : lessonSchema,
          maxOutputTokens: isReview ? 50000 : 30000,
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        },
      });
      break;
    } catch (error) {
      const retryable = [429, 500, 503, 'RESOURCE_EXHAUSTED', 'UNAVAILABLE'].includes(error?.status)
        || [429, 500, 503, 'RESOURCE_EXHAUSTED', 'UNAVAILABLE'].includes(error?.code);
      if (!retryable || attempt === 4) throw error;
      const delayMs = attempt * 5000;
      console.warn(`Gemini tạm bận; thử lại lần ${attempt + 1} sau ${delayMs / 1000}s.`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const parsed = JSON.parse(response.text);
  await fs.mkdir(DRAFT_DIR, { recursive: true });
  const outputPath = path.join(
    DRAFT_DIR,
    `week-${weekNumber}-day-${dayNumber}.json`,
  );
  await fs.writeFile(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  console.log(`Đã tạo ${path.relative(ROOT_DIR, outputPath)} bằng ${MODEL}.`);
  console.log(`Cảnh báo chép: ${parsed.transcriptionWarnings?.length || 0}.`);
  console.log(`Số mục ngữ pháp: ${parsed.grammarPoints?.length || 0}; số câu: ${parsed.questions?.length || 0}.`);
}

if (require.main === module) {
  generateDraft(parseArguments(process.argv.slice(2))).catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  WEEK_RANGES,
  generateDraft,
  lessonSchema,
  parseArguments,
  reviewSchema,
};
