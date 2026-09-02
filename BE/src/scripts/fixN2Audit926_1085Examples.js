const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(926, [e(274, 'この仕事は経験が重視される。', 'Công việc này coi trọng kinh nghiệm.', [s('この仕事は', 'このしごとは'), s('経験が重視される', 'けいけんがじゅうしされる', true), s('。', '。')])]);
set(1068, [
  e(321, '彼の発言は会社に大きな影響を及ぼした。', 'Ảnh hưởng của anh ấy đã tạo ra ảnh hưởng lớn tới công ty.', [s('彼の発言は会社に大きな', 'かれのはつげんはかいしゃにおおきな'), s('影響を及ぼした', 'えいきょうをおよぼした', true), s('。', '。')]),
  e(321, 'その地震は大きな被害を及ぼした。', 'Trận động đất đó đã gây thiệt hại to lớn.', [s('その地震は大きな被害を', 'そのじしんはおおきなひがいを'), s('及ぼした', 'およぼした', true), s('。', '。')]),
]);
set(1080, [
  e(324, '長野県は海に接していない。', 'Tỉnh Nagano không tiếp giáp với biển.', [s('長野県は海に', 'ながのけんはうみに'), s('接していない', 'せっしていない', true), s('。', '。')]),
  e(324, 'A国とB国は国境を接している。', 'Nước A và nước B giáp biên giới với nhau.', [s('A国とB国は国境を', 'エーこくとビーこくはこっきょうを'), s('接している', 'せっしている', true), s('。', '。')]),
  e(324, '彼女とは今まで親しく接したことがない。', 'Đến bây giờ vẫn không tiếp xúc thân mật với cô ấy được.', [s('彼女とは今まで親しく', 'かのじょとはいままでしたしく'), s('接した', 'せっした', true), s('ことがない。', 'ことがない。')]),
]);
set(1085, [e(326, '家の土地から温泉が湧いている。', 'Suối nước nóng phun ra từ dưới nền nhà.', [s('家の土地から温泉が', 'いえのとちからおんせんが'), s('湧いている', 'わいている', true), s('。', '。')])]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 926, 1068, 1080 and 1085.');
