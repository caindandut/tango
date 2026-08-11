/* eslint-disable no-console */
const fs = require('node:fs/promises');
const path = require('node:path');

const { WEEK_RANGES } = require('./generateGrammarDraft');
const { validateGrammarCurriculum } = require('../grammar/validateGrammarCurriculum');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DRAFT_DIR = path.join(ROOT_DIR, 'tmp', 'grammar-drafts');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'grammar');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'curriculum.json');
const OPTION_IDS = ['A', 'B', 'C', 'D'];

const REVIEW_ANSWERS = Object.freeze({
  1: 'BCBDBADCCBDDABBACACDBDBCA',
  2: 'DACDCBACACABDCCADDBBDAABB',
  3: 'ACADCABDDABDADDCBDCDBAACA',
  4: 'AABBC' + 'ACCDA' + 'DABDC' + 'ABBDC' + 'DBCBA',
  5: 'DADBCAACDBDACDABDCDCCADBD',
  6: 'BCACACABDCDBCABDACADADCDB',
});

const REVIEW_STAR_ORDERS = Object.freeze({
  1: ['DBAC', 'DBCA', 'CBAD', 'ADCB', 'CADB'],
  2: ['DCAB', 'BADC', 'CBDA', 'DABC', 'DCBA'],
  3: ['ADCB', 'CABD', 'BADC', 'DBCA', 'CADB'],
  4: ['CDAB', 'CABD', 'ADBC', 'BADC', 'DACB'],
  5: [null, 'BADC', 'ADCB', 'ABDC', 'DACB'],
  6: ['BADC', 'BDAC', 'DBCA', 'CBAD', 'ABDC'],
});

// Một số ô giải thích ở bản scan chỉ ghi công thức/ghi chú tiếng Nhật.
// Các nghĩa dưới đây được đối chiếu với ví dụ Nhật–Việt ngay trên trang đó.
const GRAMMAR_POINT_OVERRIDES = Object.freeze({
  'w1d2-g1': { meaningVi: 'Phải đi ngủ thôi; dạng nói rút gọn của “phải ngủ”.', usageVi: 'Dùng trong hội thoại thân mật với Vないと (いけない).', },
  'w1d2-g2': { meaningVi: 'Đã lỡ ăn mất rồi.', usageVi: 'Cách nói hội thoại rút gọn của Vてしまう, thường diễn tả tiếc nuối hoặc hoàn tất.', },
  'w1d2-g3': { meaningVi: 'Viết sẵn nhé; làm trước.', usageVi: 'Cách nói hội thoại rút gọn của Vておく.', },
  'w1d3-g1': { titleJa: '女みたいだ', meaningVi: 'Giống như phụ nữ/con gái.', usageVi: 'V/A/na/N + みたいだ; cách nói hội thoại hơn ようだ.', },
  'w1d3-g2': { meaningVi: 'Mang đặc trưng của mùa xuân; đúng kiểu mùa xuân.', usageVi: 'N + らしい để nói một đặc điểm tiêu biểu của người/vật/sự việc đó.', },
  'w1d3-g3': { meaningVi: 'Có vẻ như người lớn; mang dáng vẻ chững chạc.', usageVi: 'N + っぽい để nói có vẻ mang tính chất hoặc dáng vẻ của N.', },
  'w3d3-g1': { meaningVi: 'Đã định làm; đã có dự định làm.', usageVi: 'Vる/Vない + つもりだった để nói về dự định trong quá khứ.', },
  'w3d3-g2': { meaningVi: 'Chắc là không ở nhà.', usageVi: 'V/A/na/N + はずだ để suy đoán có căn cứ; はずがない là phủ định mạnh.', },
  'w3d3-g3': { meaningVi: 'Nên/phải bảo vệ.', usageVi: 'Vる/naである/Aである + べきだ để nói nghĩa vụ hoặc điều nên làm.', },
  'w3d3-g4': { meaningVi: 'Hồi tưởng về việc thường đã làm trong quá khứ.', usageVi: 'Vた + ものだ để hồi tưởng hoặc nhắc lại một việc thường làm trước đây.', },
  'w3d4-g1': { meaningVi: 'Nhân tiện; tiện thể.', usageVi: 'Nの/Vる + ついでに để làm thêm việc khác nhân một dịp hoặc hành động.', },
  'w3d4-g2': { meaningVi: 'Mỗi khi; cứ mỗi lần.', usageVi: 'Nの/Vる/Vた + たびに để nói việc lặp lại mỗi khi có sự việc xảy ra.', },
  'w3d4-g3': { meaningVi: 'Ngay khi; vừa mới... thì...', usageVi: 'Vた + とたん(に) để nói sự việc xảy ra ngay sau một hành động.', },
  'w3d4-g4': { meaningVi: 'Đang lúc; đúng lúc đang làm...', usageVi: 'Nの/Vている + 最中に để nói một sự việc xảy ra giữa lúc một việc khác đang diễn ra.', },
  'w4d4-g4': { meaningVi: 'Biết bao vui sướng; không biết vui đến nhường nào.', usageVi: 'Vる/Aい/naな/Nの + ことか để nhấn mạnh cảm xúc hoặc mức độ.', },
  'w5d1-g1': { titleJa: '勉強はもちろん', meaningVi: 'Không những học giỏi mà còn làm tốt việc khác.', usageVi: 'N1はもちろん、N2も để nói N1 là điều hiển nhiên và N2 cũng vậy.', },
  'w5d1-g2': { meaningVi: 'Không chỉ... mà còn...', usageVi: 'V/A/na/N + ばかりか…(も), tương đương ばかりでなく…(も).', },
  'w5d1-g3': { meaningVi: 'So với; so sánh với.', usageVi: 'Nに比べて hoặc mệnh đề + のに比べ để so sánh hai đối tượng/sự việc.', },
  'w5d1-g4': { meaningVi: 'Đối với; đối lập với.', usageVi: 'Nに対して để nói đối tượng hướng tới hoặc sự tương phản; có thể dùng に対する + N.', },
  'w5d3-g1': { meaningVi: 'Ước gì; giá mà...', usageVi: 'V/A/na/N + といいなあ để bày tỏ mong ước.', },
  'w5d3-g2': { meaningVi: 'Giá mà đã...; hối tiếc vì đã không...', usageVi: 'Vば/Vなければ/Vたら/Vなかったら + よかった để bày tỏ hối tiếc.', },
  'w5d3-g3': { meaningVi: 'Đáng lẽ bạn cũng nên...; tiếc là bạn đã không...', usageVi: 'Vば〜のに hoặc Vたら〜のに để bày tỏ sự tiếc nuối hoặc trách nhẹ.', },
  'w5d3-g4': { meaningVi: 'Ước gì...; không biết có... không nhỉ?', usageVi: 'Vないかなあ để bày tỏ mong muốn hoặc băn khoăn.', },
  'w5d4-g4': { meaningVi: 'Tại/ở Osaka; trong phạm vi Osaka.', usageVi: 'Nにおいて là cách nói trang trọng hơn で, dùng cho địa điểm, thời gian hoặc lĩnh vực.', },
});

function nonEmpty(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function hasNonVietnameseExplanation(value) {
  return /[ぁ-んァ-ヶ一-龯]/u.test(value)
    || /\b(?:expression|showing|when|used|indicates|refers|the action|a way|speaker|situation)\b/iu.test(value);
}

function selectVietnameseExplanation(point) {
  const candidates = [point.usageVi, point.meaningVi].map(nonEmpty).filter(Boolean);
  return candidates.find((value) => !hasNonVietnameseExplanation(value)) || candidates[0] || 'Xem cách dùng trong cấu trúc và ví dụ.';
}

function normalizeSegments(segments, { requireGrammar = false } = {}) {
  const normalized = (segments || [])
    .map((segment) => ({
      text: nonEmpty(segment?.text),
      isGrammar: Boolean(segment?.isGrammar),
    }))
    .filter((segment) => segment.text);
  if (requireGrammar && normalized.length > 0 && !normalized.some((segment) => segment.isGrammar)) {
    normalized[0].isGrammar = true;
  }
  return normalized;
}

function normalizeOptions(options, expectedCount) {
  return (options || []).slice(0, expectedCount).map((option, index) => ({
    id: OPTION_IDS[index],
    text: nonEmpty(option?.text) || `Lựa chọn ${OPTION_IDS[index]}`,
  }));
}

function trimOptionOverlap(after, options) {
  const leadingWhitespace = after.match(/^\s*/u)?.[0] || '';
  let rest = after.slice(leadingWhitespace.length);
  const maxLength = Math.min(4, ...options.map((option) => option.text.length), rest.length);
  for (let length = maxLength; length > 0; length -= 1) {
    const prefix = rest.slice(0, length);
    if (options.every((option) => option.text.endsWith(prefix))) {
      rest = rest.slice(length);
      break;
    }
  }
  return rest;
}

function splitPrompt(question) {
  const texts = (question.promptSegments || []).map((segment) => segment?.text || '');
  if (texts.length >= 2) return [texts[0], texts.slice(1).join('')];
  const text = texts.join('');
  const placeholder = text.match(/[_＿]{2,}(?:[\s_＿★☆⭐️]*[_＿]{2,})*/u);
  if (placeholder) {
    return [text.slice(0, placeholder.index), text.slice(placeholder.index + placeholder[0].length)];
  }
  const wideGap = text.match(/\s{2,}/u);
  if (wideGap) return [text.slice(0, wideGap.index), text.slice(wideGap.index + wideGap[0].length)];
  return [text, ''];
}

function normalizePrompt(question, options, isStar, isReview) {
  const [before, rawAfter] = splitPrompt(question);
  const after = isStar ? rawAfter.trim() : trimOptionOverlap(rawAfter, options).trim();
  return [
    ...(before.trim() ? [{ text: before.trim(), isGrammar: false }] : []),
    ...(!isReview || isStar ? [{ text: isStar ? ' ____ ____ ★ ____ ' : ' ____ ', isGrammar: false }] : []),
    ...(after ? [{ text: after, isGrammar: false }] : []),
  ];
}

function buildCorrectSentence(question, options, order) {
  const [before, after] = splitPrompt(question);
  const optionMap = new Map(options.map((option) => [option.id, option.text]));
  const middle = order.map((id) => optionMap.get(id) || '').join('');
  const reconstructed = `${before}${middle}${after}`.replace(/\s+/gu, ' ').trim();
  return reconstructed || nonEmpty(question.correctSentenceJa) || 'Câu hoàn chỉnh theo thứ tự đáp án.';
}

function normalizeGrammarPoint(point, context, pointIndex, pointCount) {
  const id = `w${context.weekNumber}d${context.dayNumber}-g${pointIndex + 1}`;
  const override = GRAMMAR_POINT_OVERRIDES[id] || {};
  const explanationVi = override.meaningVi || selectVietnameseExplanation(point);
  const onSecondPage = pointIndex === pointCount - 1;
  const pdfPage = onSecondPage ? context.exercisePdfPage : context.contentPdfPage;
  return {
    id,
    titleJa: override.titleJa || nonEmpty(point.titleJa) || `Mẫu ngữ pháp ${pointIndex + 1}`,
    meaningVi: explanationVi,
    structures: (point.structures || []).map(nonEmpty).filter(Boolean),
    usageVi: override.usageVi || explanationVi,
    examples: (point.examples || []).map((example, exampleIndex) => ({
      id: `w${context.weekNumber}d${context.dayNumber}-g${pointIndex + 1}-e${exampleIndex + 1}`,
      segments: normalizeSegments(example.segments, { requireGrammar: true }),
      translationVi: nonEmpty(example.translationVi) || 'Chưa có bản dịch.',
      ...(nonEmpty(example.paraphraseJa) ? { paraphraseJa: nonEmpty(example.paraphraseJa) } : {}),
    })),
    source: {
      pdfPage,
      printedPage: pdfPage + context.printedOffset,
    },
  };
}

function officialReviewOrder(weekNumber, questionNumber, draftOrder) {
  if (questionNumber < 16 || questionNumber > 20) return null;
  const official = REVIEW_STAR_ORDERS[weekNumber][questionNumber - 16];
  return (official || (draftOrder || []).join('')).split('');
}

function normalizeQuestion(question, context) {
  const number = question.number;
  const isReview = context.dayNumber === 7;
  const isStar = isReview ? number >= 16 && number <= 20 : number >= 6;
  const type = isReview
    ? (number <= 15 ? 'REVIEW_CHOICE' : (number <= 20 ? 'STAR_CHOICE' : 'REVIEW_CLOZE'))
    : (number <= 5 ? 'BINARY_CHOICE' : 'STAR_CHOICE');
  const options = normalizeOptions(question.options, type === 'BINARY_CHOICE' ? 2 : 4);
  const correctOrder = isStar
    ? (isReview
      ? officialReviewOrder(context.weekNumber, number, question.correctOrder)
      : (question.correctOrder || []))
    : null;
  if (isStar && (correctOrder.length !== 4 || new Set(correctOrder).size !== 4)) {
    throw new Error(`Thiếu thứ tự ô sao hợp lệ: tuần ${context.weekNumber}, ngày ${context.dayNumber}, câu ${number}.`);
  }
  const correctOptionId = isReview
    ? (isStar ? correctOrder[2] : REVIEW_ANSWERS[context.weekNumber][number - 1])
    : (isStar ? correctOrder[2] : question.correctOptionId);
  const pdfPage = isReview
    ? context.reviewPages[number <= 9 ? 0 : (number <= 20 ? 1 : 2)]
    : context.exercisePdfPage;

  return {
    id: `w${context.weekNumber}d${context.dayNumber}-q${number}`,
    type,
    promptSegments: normalizePrompt(question, options, isStar, isReview),
    options,
    correctOptionId,
    explanationVi: nonEmpty(question.explanationVi) || 'Đáp án phù hợp với cấu trúc và ngữ cảnh của câu.',
    ...(isStar ? {
      correctOrder,
      correctSentenceJa: buildCorrectSentence(question, options, correctOrder),
    } : {}),
    ...(nonEmpty(question.sourceExplanationJa) ? {
      sourceExplanationJa: nonEmpty(question.sourceExplanationJa),
    } : {}),
    ...(type === 'REVIEW_CLOZE' ? {
      passageId: `w${context.weekNumber}d7-passage-${question.passageNumber || 1}`,
    } : {}),
    source: {
      pdfPage,
      printedPage: pdfPage + context.printedOffset,
    },
  };
}

async function readDraft(weekNumber, dayNumber) {
  const filename = path.join(DRAFT_DIR, `week-${weekNumber}-day-${dayNumber}.json`);
  return JSON.parse(await fs.readFile(filename, 'utf8'));
}

async function buildLesson(weekNumber, dayNumber, range) {
  const draft = await readDraft(weekNumber, dayNumber);
  const contentPdfPage = range.firstLesson + ((dayNumber - 1) * 2);
  const exercisePdfPage = contentPdfPage + 1;
  const context = {
    weekNumber,
    dayNumber,
    contentPdfPage,
    exercisePdfPage,
    printedOffset: range.printedOffset,
  };
  return {
    id: `w${weekNumber}d${dayNumber}`,
    weekNumber,
    dayNumber,
    kind: 'LESSON',
    titleJa: nonEmpty(draft.titleJa) || `${dayNumber}日目`,
    titleVi: nonEmpty(draft.titleVi) || `Ngày ${dayNumber}`,
    grammarPoints: draft.grammarPoints.map((point, index) =>
      normalizeGrammarPoint(point, context, index, draft.grammarPoints.length)),
    questions: draft.questions.map((question) => normalizeQuestion(question, context)),
  };
}

async function buildReview(weekNumber, range) {
  const draft = await readDraft(weekNumber, 7);
  const context = {
    weekNumber,
    dayNumber: 7,
    reviewPages: range.review,
    printedOffset: range.printedOffset,
  };
  return {
    id: `w${weekNumber}d7`,
    weekNumber,
    dayNumber: 7,
    kind: 'REVIEW',
    titleVi: `Bài tổng hợp tuần ${weekNumber}`,
    timeLimitSeconds: 900,
    maxScore: 100,
    passages: (draft.passages || []).map((passage, index) => ({
      id: `w${weekNumber}d7-passage-${passage.number || index + 1}`,
      segments: normalizeSegments(passage.segments).map((segment) => ({
        ...segment,
        isGrammar: false,
      })),
      source: {
        pdfPage: range.review[2],
        printedPage: range.review[2] + range.printedOffset,
      },
    })),
    questions: draft.questions.map((question) => normalizeQuestion(question, context)),
  };
}

async function buildCurriculum() {
  const weeks = [];
  for (let weekNumber = 1; weekNumber <= 6; weekNumber += 1) {
    const range = WEEK_RANGES[weekNumber];
    const days = [];
    for (let dayNumber = 1; dayNumber <= 6; dayNumber += 1) {
      days.push(await buildLesson(weekNumber, dayNumber, range));
    }
    days.push(await buildReview(weekNumber, range));
    weeks.push({ weekNumber, titleVi: `Tuần ${weekNumber}`, days });
  }
  const curriculum = {
    version: 1,
    sourceTitle: '[VTI Mirai Share] 141 - Soumatome N3 Ngữ Pháp Bunpou',
    weeks,
  };
  validateGrammarCurriculum(curriculum);
  return curriculum;
}

async function main() {
  const curriculum = await buildCurriculum();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(curriculum, null, 2)}\n`, 'utf8');
  const grammarPointCount = curriculum.weeks.flatMap((week) => week.days)
    .flatMap((day) => day.grammarPoints || []).length;
  const questionCount = curriculum.weeks.flatMap((week) => week.days)
    .flatMap((day) => day.questions).length;
  console.log(`Đã kết xuất ${path.relative(ROOT_DIR, OUTPUT_PATH)}.`);
  console.log(`${grammarPointCount} điểm ngữ pháp; ${questionCount} câu hỏi.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error?.issues || error);
    process.exitCode = 1;
  });
}

module.exports = {
  REVIEW_ANSWERS,
  REVIEW_STAR_ORDERS,
  buildCurriculum,
};
