const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(822, [e(236, '両親は、定年後に海外移住するプランを立てている。', 'Bố mẹ tôi đang lên kế hoạch sẽ sang nước ngoài định cư sau khi nghỉ hưu.', [
  s('両親は、定年後に海外移住する', 'りょうしんは、ていねんごにかいがいいじゅうする'), s('プラン', 'プラン', true), s('を立てている。', 'をたてている。'),
])]);

set(823, [e(236, 'テレビの音のことでアパートの隣人とトラブルになった。', 'Đã gặp rắc rối với hàng xóm vì tiếng ồn của tivi.', [
  s('テレビの音のことでアパートの隣人と', 'テレビのおとのことでアパートのりんじんと'), s('トラブルになった', 'トラブルになった', true), s('。', '。'),
])]);

set(825, [
  e(237, '買った肉が美味しくなかったので、スーパーにクレームがあった。', 'Có lời phàn nàn với siêu thị rằng “Thịt đã mua có mùi lạ”.', [
    s('買った肉が美味しくなかったので、スーパーに', 'かったにくがおいしくなかったので、スーパーに'), s('クレームがあった', 'クレームがあった', true), s('。', '。'),
  ]),
  e(237, '最近は、小さなことでもクレームをつける人が多くなった。', 'Gần đây, có rất nhiều người phàn nàn dù là những việc nhỏ nhặt.', [
    s('最近は、小さなことでも', 'さいきんは、ちいさなことでも'), s('クレームをつける', 'クレームをつける', true), s('人が多くなった。', 'ひとがおおくなった。'),
  ]),
]);

set(827, [
  e(237, '踏切事故で電車が１時間ストップした。', 'Tàu điện đã phải dừng lại 1 tiếng đồng hồ do sự cố ở thanh chắn tàu.', [
    s('踏切事故で電車が１時間', 'ふみきりじこででんしゃがいちじかん'), s('ストップした', 'ストップした', true), s('。', '。'),
  ]),
  e(237, '駅前再開発は、住民の反対でストップしている。', 'Kế hoạch phát triển khu vực trước nhà ga đang dừng lại do sự phản đối của người dân.', [
    s('駅前再開発は、住民の反対で', 'えきまえさいかいはつは、じゅうみんのはんたいで'), s('ストップしている', 'ストップしている', true), s('。', '。'),
  ]),
]);

set(829, [
  e(238, 'ソファーをカバーで覆った。', 'Phủ kín chiếc ghế sofa.', [
    s('ソファーを', 'ソファーを'), s('カバーで覆った', 'カバーでおおった', true), s('。', '。'),
  ]),
  e(238, '私の仕事のミスを同僚がカバーしてくれた。', 'Đồng nghiệp đã che giấu giúp tôi những lỗi sai trong công việc.', [
    s('私の仕事のミスを同僚が', 'わたしのしごとのミスをどうりょうが'), s('カバーしてくれた', 'カバーしてくれた', true), s('。', '。'),
  ]),
  e(238, 'この選手は特技を生かしたテクニックでカバーしている。', 'Tuyển thủ này có kỹ thuật chơi điêu luyện ăn chặn được sự non nớt hình nhỏ bé.', [
    s('この選手は特技を生かしたテクニックで', 'このせんしゅはとくぎをいかしたテクニックで'), s('カバーしている', 'カバーしている', true), s('。', '。'),
  ]),
]);

set(830, [e(239, '骨折で入院し、退院後もしばらくリハビリのため病院に通った。', 'Tôi đã nhập viện vì gãy xương, đã xuất viện nhưng vẫn phải thường xuyên lui tới bệnh viện để tập vật lý trị liệu phục hồi chức năng trong 1 thời gian ngắn.', [
  s('骨折で入院し、退院後もしばらく', 'こっせつでにゅういんし、たいいんごもしばらく'), s('リハビリのため病院に通った', 'リハビリのためびょういんにかよった', true), s('。', '。'),
])]);

set(832, [
  e(239, '学校で子どもたち（を／に）カウンセリングする仕事をしている。', 'Tôi đang làm công việc tư vấn tâm lý cho trẻ em ở trường học.', [
    s('学校で子どもたち（を／に）', 'がっこうでこどもたち（を／に）'), s('カウンセリングする', 'カウンセリングする', true), s('仕事をしている。', 'しごとをしている。'),
  ]),
  e(239, '最近は、心配なことがあったので、病院でカウンセリングを受けた。', 'Gần đây tôi bị mất ngủ vì lo nghĩ nhiều nên đã khám tâm lý ở bệnh viện.', [
    s('最近は、心配なことがあったので、病院で', 'さいきんは、しんぱいなことがあったので、びょういんで'), s('カウンセリングを受けた', 'カウンセリングをうけた', true), s('。', '。'),
  ]),
]);

set(833, [
  e(239, '彼はユーモアを交えたキャラクターの持ち主だ。', 'Anh ta có tính cách thú vị thường mang tính hài hước.', [
    s('彼はユーモアを交えた', 'かれはユーモアをまじえた'), s('キャラクター', 'キャラクター', true), s('の持ち主だ。', 'のもちぬしだ。'),
  ]),
  e(239, 'アニメや映画のキャラクターが商品化されています。', 'Nhân vật trong truyện tranh và hoạt hình thường được thương mại hóa.', [
    s('アニメや映画の', 'アニメやえいがの'), s('キャラクター', 'キャラクター', true), s('が商品化されています。', 'がしょうひんかされています。'),
  ]),
]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated examples and underlines for N2 words 822–833 from PDF pages 236–239.');
