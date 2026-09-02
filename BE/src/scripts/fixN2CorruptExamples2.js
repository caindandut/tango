const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const by = new Map(words.map((w) => [w.sourceNumber, w]));
function ex(japanese, vietnamese, target, reading, pdfPage, printedPage) {
  const i = japanese.indexOf(target);
  const segments = i < 0 ? [{ text: japanese, reading: '', isUnderlined: false }] : [
    { text: japanese.slice(0, i), reading: '', isUnderlined: false },
    { text: target, reading, isUnderlined: true },
    { text: japanese.slice(i + target.length), reading: '', isUnderlined: false },
  ].filter((s) => s.text);
  return { japanese, vietnamese, segments, source: { pdfPage, printedPage } };
}
by.get(556).examples = [
  ex('あの人はいつも愛想良く、にこにこしている。', 'Lúc nào người đó cũng nở nụ cười gần gũi, thân thiện.', 'にこにこ', 'にこにこ', 154, 151),
  ex('彼女はにっこり（と）ほほえんだ。', 'Cô ấy đã mỉm cười rồi.', 'にっこり', 'にっこり', 154, 151),
];
by.get(693).examples = [
  ex('彼は足が速いから、今から追いかけても追いつかないだろう。', 'Vì anh ấy chạy nhanh nên bây giờ có đuổi theo thì chắc cũng không đuổi kịp đâu.', '追いつかない', 'おいつかない', 195, 192),
  ex('斎藤選手がゴールを決め、同点に追いついた。', 'Cầu thủ Saito ghi bàn thắng quyết định, san bằng tỷ số.', '追いついた', 'おいついた', 195, 192),
  ex('我が社の技術が世界水準に追いつくには、5年はかかるだろう。', 'Có lẽ sẽ mất 5 năm để công nghệ của công ty tôi bắt kịp tiêu chuẩn thế giới.', '追いつく', 'おいつく', 195, 192),
];
by.get(887).examples = [
  ex('名詞は形のない抽象的なものごとも表す。', 'Danh từ cũng biểu thị những sự vật mang tính trừu tượng không có hình dạng.', '抽象的な', 'ちゅうしょうてきな', 258, 255),
  ex('この理論は抽象的すぎてよく分からない。', 'Lý luận này quá trừu tượng nên tôi đã không hiểu rõ.', '抽象的', 'ちゅうしょうてき', 258, 255),
];
by.get(746).examples = [ex('一滴も漏らさず水をバケツで運んだ。', 'Tôi vận chuyển nước bằng xô mà không làm tràn một giọt nào.', '漏らさず', 'もらさず', 212, 209)];
by.get(1010).examples = [ex('台風の進路が北にそれた。', 'Đường đi của bão đã lệch về hướng bắc.', 'それた', 'それた', 303, 300)];
by.get(1089).examples = [ex('申し込みをためらっているうちに、締め切りが過ぎてしまった。', 'Trong khi đang chần chừ đăng kí thì đã quá hạn mất rồi.', 'ためらっているうちに', 'ためらっているうちに', 326, 323)];
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Fixed remaining corrupt examples.');
