const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(864, [e(252, '今年の夏の暑さは異常だ。', 'Nắng nóng mùa hè năm nay thật bất thường.', [
  s('今年の夏の暑さは', 'ことしのなつのあつさは'), s('異常だ', 'いじょうだ', true), s('。', '。'),
])]);
set(865, [e(252, 'このメーカーは高度な半導体技術で知られている。', 'Công ty này được biết đến bởi kĩ thuật chất bán dẫn tiên tiến.', [
  s('このメーカーは', 'このメーカーは'), s('高度な半導体技術', 'こうどなはんどうたいぎじゅつ', true), s('で知られている。', 'でしられている。'),
])]);

set(870, [
  e(254, 'この店では手ごろな値段でおいしいフランス料理が食べられる。', 'Ở cửa hàng này có thể ăn món ăn Pháp ngon với giá phải chăng.', [
    s('この店では', 'このみせでは'), s('手ごろな値段', 'てごろなねだん', true), s('でおいしいフランス料理が食べられる。', 'でおいしいフランスりょうりがたべられる。'),
  ]),
  e(254, 'このゲームは、初心者には手ごろだ。', 'Trò chơi này không quá khó, vừa tầm đối với những người mới chơi.', [
    s('このゲームは、初心者には', 'このゲームは、しょしんしゃには'), s('手ごろだ', 'てごろだ', true), s('。', '。'),
  ]),
]);

set(875, [e(255, '彼女はいつも上品な服を着ている。', 'Cô ấy lúc nào cũng mặc những trang phục sang lịch thiệp, tao nhã.', [
  s('彼女はいつも', 'かのじょはいつも'), s('上品な服', 'じょうひんなふく', true), s('を着ている。', 'をきている。'),
])]);

set(879, [e(256, '急な頼みだったが、友人は快く引き受けてくれた。', 'Mặc dù là một lời nhờ vả đột xuất nhưng bạn tôi đã vui vẻ nhận lời.', [
  s('急な頼みだったが、友人は', 'きゅうなたのみだったが、ゆうじんは'), s('快く', 'こころよく', true), s('引き受けてくれた。', 'ひきうけてくれた。'),
])]);

set(883, [e(257, '問題を確実に処理する。', 'Xử lý vấn đề một cách chắc chắn.', [
  s('問題を', 'もんだいを'), s('確実に', 'かくじつに', true), s('処理する。', 'しょりする。'),
])]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 864–883 from PDF pages 252–257.');
