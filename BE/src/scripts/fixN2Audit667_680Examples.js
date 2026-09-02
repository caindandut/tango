const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const source = (pdfPage) => ({ pdfPage, printedPage: pdfPage - 3 });
const s = (text, reading, isUnderlined = false) => ({ text, reading, isUnderlined });
const e = (page, japanese, vietnamese, segments) => ({ japanese, vietnamese, segments, source: source(page) });
const set = (n, examples) => { words.find((w) => w.sourceNumber === n).examples = examples; };

set(667, [
  e(184, '近所の小学校の校庭は、日曜日には市民に開放されている。', 'Vào ngày chủ nhật, sân trường tiểu học gần đây sẽ được mở cửa cho người dân.', [
    s('近所の小学校の校庭は、日曜日には市民に', 'きんじょのしょうがっこうのこうていは、にちようびにはしみんに'), s('開放されている', 'かいほうされている', true), s('。', '。'),
  ]),
  e(184, 'アメリカは日本に市場の開放を求めた。', 'Mỹ đã yêu cầu nước Nhật mở cửa thị trường.', [
    s('アメリカは日本に市場の', 'アメリカはにほんにしじょうの'), s('開放を求めた', 'かいほうをもとめた', true), s('。', '。'),
  ]),
]);
set(668, [
  e(184, 'この公園の門は、夜間は閉鎖されている。', 'Cổng của công viên này thường bị đóng vào buổi tối.', [
    s('この公園の門は、夜間は', 'このこうえんのもんは、やかんは'), s('閉鎖されている', 'へいさされている', true), s('。', '。'),
  ]),
  e(184, '会社が倒産し、工場は閉鎖された。', 'Công ty phá sản, nhà máy bị đóng cửa.', [
    s('会社が倒産し、工場は', 'かいしゃがとうさんし、こうじょうは'), s('閉鎖された', 'へいさされた', true), s('。', '。'),
  ]),
]);
set(669, [e(185, '密閉された部屋の中で物を燃やすと、不完全燃焼を起こす。', 'Nếu đốt vật trong phòng kín sẽ xảy ra hiện tượng cháy không hoàn toàn.', [
  s('密閉された部屋の中で物を燃やすと、', 'みっぺいされたへやのなかでものをもやすと、'), s('不完全燃焼を起こす', 'ふかんぜんねんしょうをおこす', true), s('。', '。'),
])]);
set(670, [e(185, '組合は待遇の改善を求めてストを行った。', 'Nghiệp đoàn đã tổ chức cuộc đình công để yêu cầu cải thiện chế độ đãi ngộ.', [
  s('組合は待遇の', 'くみあいはたいぐうの'), s('改善を求めて', 'かいぜんをもとめて', true), s('ストを行った。', 'ストをおこなった。'),
])]);
set(672, [e(185, '4月から新幹線のダイヤが改正されるそうだ。', 'Nghe nói lịch trình tàu cao tốc sẽ được sửa đổi từ tháng 4.', [
  s('4月から新幹線のダイヤが', 'しがつからしんかんせんのダイヤが'), s('改正される', 'かいせいされる', true), s('そうだ。', 'そうだ。'),
])]);
set(673, [e(185, '来年から消費税率が改定されることになった。', 'Từ năm sau mức thuế tiêu thụ sẽ được điều chỉnh.', [
  s('来年から消費税率が', 'らいねんからしょうひぜいりつが'), s('改定される', 'かいていされる', true), s('ことになった。', 'ことになった。'),
])]);
set(674, [e(185, 'アパートが古くなったので、大規模な改修が行われることになった。', 'Vì căn hộ đã cũ nên việc sửa chữa quy mô lớn đã được tiến hành.', [
  s('アパートが古くなったので、大規模な', 'アパートがふるくなったので、だいきぼな'), s('改修が行われる', 'かいしゅうがおこなわれる', true), s('ことになった。', 'ことになった。'),
])]);
set(675, [e(186, '二人の意見が一致した。', 'Ý kiến của hai người thống nhất với nhau.', [
  s('二人の意見が', 'ふたりのいけんが'), s('一致した', 'いっちした', true), s('。', '。'),
])]);
set(676, [e(186, '飛行機の中で乗客が一方に片寄ると危ない。', 'Nếu hành khách trong máy bay ngồi lệch về một phía thì rất nguy hiểm.', [
  s('飛行機の中で乗客が一方に', 'ひこうきのなかでじょうきゃくがいっぽうに'), s('片寄る', 'かたよる', true), s('と危ない。', 'とあぶない。'),
])]);
set(677, [e(186, '倉庫の中は一定の温度に保たれている。', 'Trong kho luôn được duy trì ở nhiệt độ nhất định.', [
  s('倉庫の中は', 'そうこのなかは'), s('一定の温度', 'いっていのおんど', true), s('に保たれている。', 'にたもたれている。'),
])]);
set(679, [e(187, '彼はまだ若いが、コックとしての腕は一流だ。', 'Anh ấy tuy còn trẻ nhưng tay nghề đầu bếp thuộc hạng nhất.', [
  s('彼はまだ若いが、コックとしての腕は', 'かれはまだわかいが、コックとしてのうでは'), s('一流だ', 'いちりゅうだ', true), s('。', '。'),
])]);

const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated shifted examples and underlines for N2 words 667–680 from PDF pages 184–187.');
