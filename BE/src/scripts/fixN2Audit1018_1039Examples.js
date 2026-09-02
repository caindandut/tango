const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(1018, [e(305, '冬が去って春になった。', 'Mùa đông đi qua, mùa xuân đã tới.', [s('冬が', 'ふゆが'), s('去って', 'さって', true), s('春になった。', 'はるになった。')])]);
set(1022, [e(306, 'あの子は母親の愛情に飢えている。', 'Đứa trẻ đó khao khát tình yêu của mẹ.', [s('あの子は母親の愛情に', 'あのこはははおやのあいじょうに'), s('飢えている', 'うえている', true), s('。', '。')])]);
set(1031, [
  e(309, '本が増えて、本棚に収（納）まらなくなった。', 'Lượng sách tăng lên đã làm đầy giá sách. (Không còn chỗ nào nữa)', [s('本が増えて、本棚に', 'ほんがふえて、ほんだなに'), s('収（納）まらなくなった', 'おさ（おさ）まらなくなった', true), s('。', '。')]),
  e(309, '警官が大勢来て、ようやく騒ぎが収まった。', 'Cảnh sát đã đến rất đông, cuối cùng sự ồn ào cũng lắng xuống.', [s('警官が大勢来て、ようやく騒ぎが', 'けいかんがたいせいきて、ようやくさわぎが'), s('収まった', 'おさまった', true), s('。', '。')]),
]);
const w1036 = words.find((w) => w.sourceNumber === 1036);
w1036.examples[0].segments = [s('このスポーツは、高齢者に', 'このスポーツは、こうれいしゃに'), s('適している', 'てきしている', true), s('。', '。')];
set(1039, [
  e(311, 'このホールは音がよく響く。', 'Khán phòng này âm thanh rất vang.', [s('このホールは音がよく', 'このホールはおとがよく'), s('響く', 'ひびく', true), s('。', '。')]),
  e(311, '彼の声はよく響く。', 'Giọng nói của anh ấy rất vang.', [s('彼の声はよく', 'かれのこえはよく'), s('響く', 'ひびく', true), s('。', '。')]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 1018, 1022, 1031, 1036 and 1039.');
