const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(992, [
  e(298, 'ミシンで布を縫う。', 'Khâu khăn len.', [s('ミシンで布を', 'ミシンでぬのを'), s('縫う', 'ぬう', true), s('。', '。')]),
  e(298, '破れたところを縫う。', 'Khâu chỗ bị rách.', [s('破れたところを', 'やぶれたところを'), s('縫う', 'ぬう', true), s('。', '。')]),
  e(298, 'けがをして５針縫った。', 'Khâu 5 mũi tại vết thương.', [s('けがをして５針', 'けがをしてごはり'), s('縫った', 'ぬった', true), s('。', '。')]),
]);
set(993, [
  e(298, '時計の針が12時を指している。', 'Kim đồng hồ đang chỉ 12 giờ.', [s('時計の針が12時を', 'とけいのはりがじゅうにじを'), s('指している', 'さしている', true), s('。', '。')]),
  e(298, '駅の方向を指で指し示して教えてあげた。', 'Tôi chỉ tay về phía nhà ga để chỉ đường.', [s('駅の方向を指で', 'えきのほうこうをゆびで'), s('指し示して', 'さししめして', true), s('教えてあげた。', 'おしえてあげた。')]),
]);
set(996, [e(299, '歯をみがいて口をすすぐ。', 'Đánh răng rồi súc miệng.', [s('歯をみがいて口を', 'はをみがいてくちを'), s('すすぐ', 'すすぐ', true), s('。', '。')])]);
set(997, [
  e(300, '切れた電線に触ると危ない。', 'Nếu chạm vào dây điện hở (bị đứt) thì nguy hiểm.', [s('切れた電線に', 'きれたでんせんに'), s('触る', 'さわる', true), s('と危ない。', 'とあぶない。')]),
  e(300, '子どもがふざけて、隣の人の足に触った。', 'Khi đùa nghịch, chân đã chạm vào chân của người bên cạnh.', [s('子どもがふざけて、隣の人の足に', 'こどもがふざけて、となりのひとのあしに'), s('触った', 'さわった', true), s('。', '。')]),
]);
set(998, [
  e(300, '「肩にお手を触れないでください。」', '“Đừng chạm tay vào đồ trên lưng”.', [s('「肩にお手を', '「かたにおてを'), s('触れないでください', 'ふれないでください', true), s('。」', '。」')]),
  e(300, '暗闇の中にいたら、何かが足に触れた。', 'Trong bóng tối có cái gì đó chạm vào chân.', [s('暗闇の中にいたら、何かが足に', 'くらやみのなかにいたら、なにかがあしに'), s('触れた', 'ふれた', true), s('。', '。')]),
  e(300, '道で肩が触れたので、相手ににらまれた。', 'Chỉ vì va vào vai người khác trên đường mà bị lườm.', [s('道で肩が', 'みちでかたが'), s('触れた', 'ふれた', true), s('ので、相手ににらまれた。', 'ので、あいてににらまれた。')]),
]);
set(1000, [
  e(301, 'その人は腕に大きな荷物を抱えていた。', 'Người đó mang hành lý lớn trên tay.', [s('その人は腕に大きな荷物を', 'そのひとはうでにおおきなにもつを'), s('抱えていた', 'かかえていた', true), s('。', '。')]),
  e(301, '彼は今、仕事上の問題を抱えている。', 'Hiện tại anh ấy gánh vác tất cả các vấn đề về công việc.', [s('彼は今、仕事上の問題を', 'かれはいま、しごとじょうのもんだいを'), s('抱えている', 'かかえている', true), s('。', '。')]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 992–1000 from PDF pages 298–301.');
