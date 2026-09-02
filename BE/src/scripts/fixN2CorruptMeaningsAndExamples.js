const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((unit) => unit.parts.flatMap((part) => part.words));
const byNumber = new Map(words.map((word) => [word.sourceNumber, word]));

const meanings = {
  157: 'Kiếm lời, có con',
  229: 'Đáng thương',
  247: 'Vô vị, tầm phào',
  257: 'Chật cứng, mệt mỏi, gò bó, khó chịu, nghiêm khắc',
  486: 'Đường đua, quá trình, tiến trình, khóa học, lớp, bữa ăn, món ăn',
  487: 'Cuộc đua, cuộc thi đua, cuộc thi',
  489: 'Đứng đầu, vị trí thứ nhất, vị trí số một, xếp top đầu, hàng đầu',
  490: 'Khung thành, về đích, điểm đích, mục tiêu, mục đích',
  491: 'Trải qua, vượt qua, bỏ qua, thông qua, chuyền',
  492: 'Nhất, tốt nhất, hay nhất, giỏi nhất, đẹp nhất, hết sức, hết mình...',
  494: 'Huấn luyện viên',
  498: 'Buổi giới thiệu, buổi định hướng (cho người mới nhập học, …)',
  501: 'Lớp học, buổi học, bài học',
  523: 'Thêm vào, còn nữa, nữa, hơn nữa, hơn',
  526: 'Hơn, hơn nữa, nhiều',
  528: 'Cuối cùng',
  533: 'Sau, sau khi, tương lai',
  534: 'Sắp sửa, chẳng bao lâu nữa, suýt',
  536: 'Chẳng mấy chốc, chẳng bao lâu, sắp, sắp sửa',
  540: 'Đã, rồi',
  552: 'Thường xuyên, lặp đi lặp lại, nhiều lần',
  554: 'Thi thoảng, đôi lúc, đôi khi, có lúc (tần suất ít hơn ときどき)',
  555: 'Hiếm khi',
  556: 'Mỉm cười, cười tươi',
  557: 'Cười toe toét, nhăn nhở, cười thô tục',
  558: 'Hồi hộp, tim đập thình thịch',
  559: 'Bồn chồn, bị kích động, rung rinh, lá tả',
  561: 'Ướt sũng, sũng nước',
  562: 'Lượn đi lượn lại, thơ thẩn, lảng vảng',
  563: 'Chậm chạp',
  564: 'Choáng váng, thay đổi, khó mà biết mình đang làm gì',
  565: 'Đung đưa, lòng vòng, ngồi không',
  566: 'Vì thế, hậu quả là',
  583: 'Rác, vụn rác',
  801: 'Phương tiện truyền thông',
  805: 'Chứng cứ vắng mặt, chứng cứ ngoại phạm',
  810: 'Kinh doanh, buôn bán, thương mại',
  812: 'Chuyên gia, người kỳ cựu',
  815: 'Tiền mặt',
  835: 'Lỏng lẻo, buông thả, cẩu thả',
  839: 'Đập nước',
  840: 'Bê tông',
  1010: 'Trượt, lệch khỏi',
  1089: 'Chần chừ, ngần ngại, do dự',
};

for (const [number, meaning] of Object.entries(meanings)) byNumber.get(Number(number)).meaning = meaning;

function example(japanese, vietnamese, target, reading, pdfPage, printedPage) {
  const index = japanese.indexOf(target);
  const segments = index < 0
    ? [{ text: japanese, reading: '', isUnderlined: false }]
    : [
      { text: japanese.slice(0, index), reading: '', isUnderlined: false },
      { text: target, reading, isUnderlined: true },
      { text: japanese.slice(index + target.length), reading: '', isUnderlined: false },
    ].filter((segment) => segment.text);
  return { japanese, vietnamese, segments, source: { pdfPage, printedPage } };
}

const replacements = {
  557: [example('「何をにやにやしているんだ。気持ち悪い」', 'Đang cười nhăn nhở cái gì vậy. Thật chẳng ra gì.', 'にやにや', 'にやにや', 154, 151)],
  558: [
    example('緊張で胸がどきどきする。', 'Tim đập thình thịch vì căng thẳng.', 'どきどき', 'どきどき', 155, 152),
    example('隠していたことを指摘されて、どきりとした。', 'Tim đã đập thình thịch vì bị chỉ ra việc đang che giấu.', 'どきり', 'どきり', 155, 152),
  ],
  559: [
    example('桜の花びらがはらはらと散った。', 'Cánh hoa anh đào rơi rụng là tả.', 'はらはら', 'はらはら', 155, 152),
    example('少女ははらはらと涙を流した。', 'Cô gái đã khóc sau khi bị kích động.', 'はらはら', 'はらはら', 155, 152),
    example('【はらはらする】綱渡りを見ながらはらはらした。', 'Vừa xem màn trình diễn đi bộ trên dây, vừa bồn chồn lo lắng. (hồi hộp)', 'はらはら', 'はらはら', 155, 152),
  ],
  561: [
    example('洗面台の周りがびしょびしょだ。', 'Xung quanh bồn rửa ướt nhẹp nước.', 'びしょびしょ', 'びしょびしょ', 155, 152),
    example('にわか雨に降られ、びっしょり濡れてしまった。', 'Bỗng nhiên trời đổ mưa, ướt sũng cả người.', 'びっしょり', 'びっしょり', 155, 152),
    example('私は暑がりなので、ちょっと運動しただけで汗びっしょりになる。', 'Tôi máu nóng nên chỉ vận động có chút thôi mà mồ hôi đã chảy ra ướt sũng người.', 'びっしょり', 'びっしょり', 155, 152),
  ],
  562: [
    example('友人の家の場所がわからず、30分もうろうろ（と）歩き回った。', 'Không biết vị trí nhà của bạn thân nên tôi đã lượn đi lượn lại loanh quanh mất 30 phút.', 'うろうろ', 'うろうろ', 155, 152),
    example('あやしい男が家の周りをうろうろしている。', 'Người đàn ông đáng ngờ đang lảng vảng quanh nhà tôi.', 'うろうろ', 'うろうろ', 155, 152),
  ],
  563: [
    example('渋滞で、車はのろのろとしか進まなかった。', 'Vì tắc đường nên ô tô chỉ tiến lên phía trước một cách chậm chạp.', 'のろのろ', 'のろのろ', 155, 152),
    example('老人はのろのろ（と）立ち上がった。', 'Người già đứng dậy một cách chậm chạp.', 'のろのろ', 'のろのろ', 156, 153),
  ],
  564: [
    example('熱で頭がふらふらする。', 'Vì bị sốt nên tôi cảm thấy chóng mặt.', 'ふらふら', 'ふらふら', 156, 153),
    example('向こうから、ふらふら（と）人が歩いて来る。', 'Từ phía bên kia, có người loạng choạng bước tới.', 'ふらふら', 'ふらふら', 156, 153),
    example('空腹のあまり、ついふらふらと万引きしてしまった。', 'Quá đói bụng, tôi lỡ ăn cắp ở các cửa hàng mà không hiểu mình đang làm gì.', 'ふらふら', 'ふらふら', 156, 153),
  ],
  565: [
    example('折れた木の枝がぶらぶら（と）揺れている。', 'Cành cây bị gãy đang đung đưa.', 'ぶらぶら', 'ぶらぶら', 156, 153),
    example('ひまだったので、近所をぶらぶら（と）歩いている。', 'Vì rảnh rỗi nên tôi đi dạo loanh quanh khu vực lân cận.', 'ぶらぶら', 'ぶらぶら', 156, 153),
    example('先月失業し、今は家でぶらぶらしている。', 'Vì tháng trước mất việc, nên bây giờ tôi ngồi không ở nhà.', 'ぶらぶら', 'ぶらぶら', 156, 153),
  ],
  746: [example('一滴も漏らさず水をバケツで運んだ。', 'Tôi vận chuyển nước bằng xô mà không làm tràn một giọt nào.', '漏らさず', 'もらさず', 212, 209)],
  887: [example('名詞は形のない抽象的なものごとも表す。', 'Danh từ cũng biểu thị những sự vật mang tính trừu tượng không có hình dạng.', '抽象的な', 'ちゅうしょうてきな', 258, 255)],
  990: [
    example('世界にはUFOの存在を信じる人が多くいる。', 'Trên thế giới có nhiều người tin tưởng rằng có sự tồn tại của người ngoài hành tinh.', '存在', 'そんざい', 292, 289),
    example('彼女はクラスの中では目立たない存在だ。', 'Cô ấy ở trong lớp không có gì nổi bật.', '存在', 'そんざい', 292, 289),
    example('初代の社長は、偉大な存在だった。', 'Vị giám đốc sáng lập công ty từng có sự hiện diện vĩ đại.', '存在', 'そんざい', 292, 289),
  ],
  1010: [
    example('台風の進路が北にそれた。', 'Đường đi của bão đã lệch về hướng bắc.', 'それた', 'それた', 303, 300),
  ],
  1089: [
    example('申し込みをためらっているうちに、締め切りが過ぎてしまった。', 'Trong khi đang chần chừ đăng kí thì đã quá hạn mất rồi.', 'ためらっているうちに', 'ためらっているうちに', 326, 323),
  ],
};
for (const [number, examples] of Object.entries(replacements)) byNumber.get(Number(number)).examples = examples;

function relation(label, japanese, vietnamese, reading = '', pdfPage, printedPage) {
  const blank = japanese.indexOf('＿');
  const segments = blank >= 0
    ? [{ text: '＿', reading: '＿', isUnderlined: true }, { text: japanese.slice(blank + 1), reading, isUnderlined: false }]
    : [{ text: japanese, reading, isUnderlined: false }];
  return { label, items: [{ japanese, vietnamese, segments, source: { pdfPage, printedPage } }] };
}

byNumber.get(887).relations = [
  relation('合', '抽象性', 'Tính trừu tượng', 'ちゅうしょうせい', 258, 255),
  relation('合', '抽象画', 'Tranh trừu tượng', 'ちゅうしょうが', 258, 255),
  relation('合', '＿化する', 'Trừu tượng hóa', 'かする', 258, 255),
  relation('対', '具体的な', 'Tính cụ thể, chi tiết', 'ぐたいてきな', 258, 255),
];
byNumber.get(990).relations = [
  relation('合', '＿感', 'Sự hiện diện (例. あの人は個性が強くてとても存在感がある。) (Ví dụ: Người kia cá tính mạnh mẽ nên mang tới sự hiện diện nổi bật.)', 'かん', 292, 289),
];

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Fixed N2 OCR-corrupted meanings, examples and relations.');
