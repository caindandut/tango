const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

const w34 = words.find((w) => w.sourceNumber === 34);
w34.examples[1].segments = [
  s('司法試験に', 'しほうしけんに'), s('合格する', 'ごうかくする', true), s('ために、５年間も勉強した。', 'ために、ごねんかんもべんきょうした。'),
];

set(340, [
  e(99, '今度の市長選挙は、５人の候補(者)で争われることになった。', 'Lần tranh cử thị trưởng lần này có 5 ứng cử viên cạnh tranh nhau.', [
    s('今度の市長選挙は、５人の', 'こんどのしちょうせんきょは、ごにんの'), s('候補(者)', 'こうほ(しゃ)', true), s('で争われることになった。', 'であらそわれることになった。'),
  ]),
  e(99, '東京は、オリンピック開催地の候補になっている。', 'Tokyo trở thành ứng cử viên đăng cai Olympic.', [
    s('東京は、オリンピック開催地の', 'とうきょうは、オリンピックかいさいちの'), s('候補', 'こうほ', true), s('になっている。', 'になっている。'),
  ]),
]);

set(516, [
  e(146, '魚は水気を取り、塩を少々ふっておきます。', 'Cá đã được hút ẩm và phủ một ít muối lên.', [
    s('魚は水気を取り、塩を', 'さかなはみずけをとり、しおを'), s('少々', 'しょうしょう', true), s('ふっておきます。', 'ふっておきます。'),
  ]),
  e(146, '「少々お待ちください」', '“Xin hãy đợi một chút ạ”.', [s('「', '「'), s('少々', 'しょうしょう', true), s('お待ちください」', 'おまちください」')]),
]);

set(532, [
  e(150, '今後のことはまだ何も決まっていない。', 'Việc từ nay về sau thì vẫn chưa quyết định được gì cả.', [
    s('今後のことは', 'こんごのことは'), s('まだ何も決まっていない', 'まだなにもきまっていない', true), s('。', '。'),
  ]),
  e(150, 'このようなことがないように、気をつけてください。', 'Từ nay về sau, hãy chú ý để không xảy ra những việc như thế này.', [
    s('このようなことがないように、', 'このようなことがないように、'), s('気をつけてください', 'きをつけてください', true), s('。', '。'),
  ]),
]);

set(566, [
  e(156, 'A社は大企業で給料も高い。したがって、入社希望者も多い。', 'Công ty A là công ty lớn, lương cũng cao. Vì thế, nhiều người muốn xin vào công ty.', [
    s('A社は大企業で給料も高い。', 'エーしゃはだいきぎょうできゅうりょうもたかい。'), s('したがって', 'したがって', true), s('、入社希望者も多い。', '、にゅうしゃきぼうしゃもおおい。'),
  ]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated remaining early N2 examples and underlines from PDF pages 13, 99, 146, 150 and 156.');
