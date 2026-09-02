const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(728, [
  e(203, '彼は学費を親に頼らず、自分で働いて払っている。', 'Anh ta không phụ thuộc bố mẹ vào tiền học phí mà tự làm việc và chi trả.', [
    s('彼は学費を親に', 'かれはがくひをおやに'), s('頼らず', 'たよらず', true), s('、自分で働いて払っている。', '、じぶんではたらいてはらっている。'),
  ]),
  e(203, '東京にいる親せきを頼って日本へ来た。', 'Tôi đã nhờ cậy người thân (họ hàng) sống ở Tokyo để đến Nhật.', [
    s('東京にいる親せきを', 'とうきょうにいるしんせきを'), s('頼って', 'たよって', true), s('日本へ来た。', 'にほんへきた。'),
  ]),
]);

set(737, [e(206, '大雨で山が崩れた。', 'Núi lở do mưa lớn.', [
  s('大雨で山が', 'おおあめでやまが'), s('崩れた', 'くずれた', true), s('。', '。'),
])]);
set(738, [e(206, '山を崩して住宅地が造られている。', 'Phá núi để xây dựng khu dân cư.', [
  s('山を', 'やまを'), s('崩して', 'くずして', true), s('住宅地が造られている。', 'じゅうたくちがつくられている。'),
])]);
set(739, [
  e(206, '台風が接近しているので、海も荒れている。', 'Do bão tiếp cận nên biển cũng trở nên dữ dội.', [
    s('台風が接近しているので、海も', 'たいふうがせっきんしているので、うみも'), s('荒れている', 'あれている', true), s('。', '。'),
  ]),
  e(206, '荒れた天気', 'Thời tiết bất ổn. (Bão bùng)', [s('荒れた', 'あれた', true), s('天気', 'てんき')]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 728 and 737–739 from PDF pages 203 and 206.');
