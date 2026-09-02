const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(1046, [e(316, '救援隊は危険を冒して遭難者を救助した。', 'Đội cứu hộ đương đầu với nguy hiểm để cứu người gặp nạn.', [
  s('救援隊は', 'きゅうえんたいは'), s('危険を冒して', 'きけんをおかして', true), s('遭難者を救助した。', 'そうなんしゃをきゅうじょした。'),
])]);
set(1047, [
  e(316, 'ナイフで脅して金を奪う。', 'Dùng dao đe dọa rồi cướp tiền.', [s('ナイフで', 'ナイフで'), s('脅して', 'おどして', true), s('金を奪う。', 'かねをうばう。')]),
]);
set(1049, [e(316, '川の流れに逆らって進む。', 'Ngược dòng chảy của sông mà tiến.', [s('川の流れに', 'かわのながれに'), s('逆らって', 'さからって', true), s('進む。', 'すすむ。')])]);
set(1050, [e(317, '過保護は子どもの成長を妨げる。', 'Bảo vệ con trẻ một cách quá đáng sẽ cản trở sự trưởng thành của chúng.', [s('過保護は子どもの成長を', 'かほごはこどものせいちょうを'), s('妨げる', 'さまたげる', true), s('。', '。')])]);
set(1051, [e(317, '良くないうわさが流れると、それを打ち消すのは大変だ。', 'Khi các tin đồn thất thiệt cứ lan truyền thì việc phủ nhận nó là rất vất vả.', [s('良くないうわさが流れると、それを', 'よくないうわさがながれると、それを'), s('打ち消す', 'うちけす', true), s('のは大変だ。', 'のはたいへんだ。')])]);
set(1052, [
  e(317, 'ボランティア募集の呼びかけに応じて、多くの人が集まった。', 'Hưởng ứng lời kêu gọi tham gia tình nguyện, nhiều người trẻ đã tập trung lại.', [s('ボランティア募集の呼びかけに', 'ボランティアぼしゅうのよびかけに'), s('応じて', 'おうじて', true), s('、多くの人が集まった。', '、おおくのひとがあつまった。')]),
  e(317, '売り上げに応じて給料が決まる。', 'Tiền lương sẽ được quyết định tương ứng với doanh thu. (sản phẩm)', [s('売り上げに', 'うりあげに'), s('応じて', 'おうじて', true), s('給料が決まる。', 'きゅうりょうがきまる。')]),
  e(317, '子どもの発達段階に応じた本を与えましょう。', 'Hãy đưa cho con trẻ những cuốn sách phù hợp với từng giai đoạn phát triển của trẻ.', [s('子どもの発達段階に', 'こどものはったつだんかいに'), s('応じた', 'おうじた', true), s('本を与えましょう。', 'ほんをあたえましょう。')]),
]);
set(1053, [e(317, '「ご注文、確かに承りました」', '“Tôi đã nhận được đơn gọi món của ngài rồi ạ”.', [s('「ご注文、確かに', '「ごちゅうもん、たしかに'), s('承りました', 'うけたまわりました', true), s('」', '」')])]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 1046–1053 from PDF pages 316–317.');
