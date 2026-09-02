const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const seg = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const ex = (pdfPage, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(pdfPage) });
const setExamples = (number, examples) => { words.find((w) => w.sourceNumber === number).examples = examples; };

setExamples(843, [
  ex(247, '水や空気は無色透明だ。', 'Nước và không khí không màu, trong suốt.', [
    seg('水や空気は無色', 'みずやくうきはむしょく'), seg('透明', 'とうめい', true), seg('だ。', 'だ。'),
  ]),
  ex(247, '透明な{水／ガラス／プラスチック…}', '{Đồ thủy tinh/nhựa,…} trong suốt.', [
    seg('透明な', 'とうめいな', true), seg('{水／ガラス／プラスチック…}', '{みず／ガラス／プラスチック…}'),
  ]),
]);

setExamples(844, [
  ex(247, '朝の空気はさわやかだ。', 'Không khí buổi sáng dễ chịu.', [
    seg('朝の空気は', 'あさのくうきは'), seg('さわやかだ', 'さわやかだ', true), seg('。', '。'),
  ]),
  ex(247, 'さわやかな{風／天気／気分／味…}', '{Con gió/ Thời tiết/ Tinh thần/ Hương vị} dễ chịu.', [
    seg('さわやかな', 'さわやかな', true), seg('{風／天気／気分／味…}', '{かぜ／てんき／きぶん／あじ…}'),
  ]),
  ex(247, 'さわやかな人／笑顔／話し方…', 'Con người/ nụ cười/ cách nói chuyện thân thiện.', [
    seg('さわやかな', 'さわやかな', true), seg('人／笑顔／話し方…', 'ひと／えがお／はなしかた…'),
  ]),
]);

setExamples(846, [
  ex(248, '彼は率直な人で、言うべきことをきちんと言う。', 'Vì anh ta là người thẳng thắn nên sẽ nói những điều cần nói.', [
    seg('彼は', 'かれは'), seg('率直な', 'そっちょくな', true), seg('人で、言うべきことをきちんと言う。', 'ひとで、いうべきことをきちんという。'),
  ]),
]);

setExamples(847, [
  ex(248, '男女ともに、「誠実な人と結婚したい」という若者が多い。', 'Có rất nhiều những người trẻ dù là nam hay nữ đều có nguyện vọng kết hôn với một người thành thật, trung thực.', [
    seg('男女ともに、「', 'だんじょともに、「'), seg('誠実な', 'せいじつな', true), seg('人と結婚したい」という若者が多い。', 'ひととけっこんしたい」というわかものがおおい。'),
  ]),
]);

setExamples(848, [
  ex(248, '彼は謙虚な人柄だ。', 'Anh ta là người có tính cách khiêm tốn.', [
    seg('彼は', 'かれは'), seg('謙虚な', 'けんきょな', true), seg('人柄だ。', 'ひとがらだ。'),
  ]),
]);

setExamples(850, [
  ex(249, '私は慎重な性格なので、よく考えてからでなければ行動しない。', 'Vì tôi là người thận trọng nên nếu không suy nghĩ cẩn thận thì sẽ không hành động.', [
    seg('私は', 'わたしは'), seg('慎重な', 'しんちょうな', true), seg('性格なので、よく考えてからでなければ行動しない。', 'せいかくなので、よくかんがえてからでなければこうどうしない。'),
  ]),
]);

setExamples(852, [
  ex(249, '二人は結婚するつもりで真剣につき合っている。', 'Hai người có dự định kết hôn nên đang tìm hiểu nhau một cách nghiêm túc.', [
    seg('二人は結婚するつもりで', 'ふたりはけっこんするつもりで'), seg('真剣に', 'しんけんに', true), seg('つき合っている。', 'つきあっている。'),
  ]),
  ex(249, '問題解決に真剣に取り組む。', 'Chuyên tâm nghiêm túc giải quyết vấn đề.', [
    seg('問題解決に', 'もんだいかいけつに'), seg('真剣に', 'しんけんに', true), seg('取り組む。', 'とりくむ。'),
  ]),
]);

setExamples(853, [
  ex(249, '日本のお札の正式な名称は「日本銀行券」だ。', 'Tên gọi chính thức của tiền giấy Nhật Bản là 「日本銀行券」 (tiền ngân hàng Nhật Bản).', [
    seg('日本のお札の', 'にほんのおさつの'), seg('正式な', 'せいしきな', true), seg('名称は「日本銀行券」だ。', 'めいしょうは「にっぽんぎんこうけん」だ。'),
  ]),
  ex(249, '３か月の試用期間を経て、正式に社員として採用された。', 'Trải qua 3 tháng thử việc, tôi được tuyển dụng chính thức với tư cách là nhân viên chính thức.', [
    seg('３か月の試用期間を経て、', 'さんかげつのしようきかんをへて、'), seg('正式に', 'せいしきに', true), seg('社員として採用された。', 'しゃいんとしてさいようされた。'),
  ]),
]);

setExamples(854, [
  ex(250, '「今日の主なニュースを５つお話しします」', '“Tôi xin truyền đạt 5 tin thời sự chính của ngày hôm nay”.', [
    seg('「今日の', '「きょうの'), seg('主な', 'おもな', true), seg('ニュースを５つお話しします」', 'ニュースをいつつおはなしします」'),
  ]),
  ex(250, 'この車は主に輸出用に作られている。', 'Xe này được làm ra chủ yếu để xuất khẩu.', [
    seg('この車は', 'このくるまは'), seg('主に', 'おもに', true), seg('輸出用に作られている。', 'ゆしゅつようにつくられている。'),
  ]),
  ex(250, '作家の収入は印税が主だ。', 'Thu nhập của nhà văn chủ yếu là tiền nhuận bút.', [
    seg('作家の収入は', 'さっかのしゅうにゅうは'), seg('印税が主だ', 'いんぜいがおもだ', true), seg('。', '。'),
  ]),
]);

setExamples(855, [
  ex(250, '今会の主要な役員が集まって今後の方針を議論した。', 'Tập hợp các ủy viên ban chấp hành chủ chốt của hội nghị đã tập hợp và đã thảo luận chính sách trong tương lai.', [
    seg('今会の', 'こんかいの'), seg('主要な', 'しゅような', true), seg('役員が集まって今後の方針を議論した。', 'やくいんがあつまってこんごのほうしんをぎろんした。'),
  ]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and segment underlines for N2 words 843–855 from PDF pages 247–250.');
