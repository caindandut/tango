/* Manual transcription corrections from PDF pages 155-166. */
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));

function segments(japanese, target, reading) {
  const i = japanese.indexOf(target);
  if (i < 0) return [{ text: japanese, reading: '', isUnderlined: false }];
  return [
    { text: japanese.slice(0, i), reading: '', isUnderlined: false },
    { text: target, reading: reading || target, isUnderlined: true },
    { text: japanese.slice(i + target.length), reading: '', isUnderlined: false },
  ].filter((s) => s.text);
}

function setWord(number, patch) {
  const word = words.find((w) => w.sourceNumber === number);
  if (!word) throw new Error(`Missing word ${number}`);
  Object.assign(word, patch);
}

function ex(japanese, vietnamese, target, reading, pdfPage) {
  return {
    japanese,
    vietnamese,
    segments: segments(japanese, target, reading),
    source: { pdfPage, printedPage: pdfPage - 3 },
  };
}

setWord(567, {
  kanji: 'だが', hiragana: 'だが', hanVietMeaning: '', meaning: 'Tuy nhiên',
  examples: [
    ex('必死に勉強した。だが、不合格だった。', 'Đã cố gắng hết sức học tập. Tuy nhiên, lại trượt.', 'だが', 'だが', 157),
    ex('あの戦争は長く続くだろう。だが、私はあきらめない。', 'Cuộc chiến tranh đó có lẽ sẽ còn kéo dài. Tuy nhiên, tôi sẽ không bỏ cuộc.', 'だが', 'だが', 157),
  ], relations: [],
});
setWord(568, {
  kanji: 'ところが', hiragana: 'ところが', hanVietMeaning: '', meaning: 'Nhưng',
  examples: [
    ex('8時には到着する予定だった。ところが事故で渋滞し、9時過ぎになってしまった。', 'Đã dự định sẽ tới nơi vào lúc 8 giờ. Nhưng, vì tắc đường do tai nạn, nên đã hơn 9 giờ mới tới.', 'ところが', 'ところが', 157),
    ex('Aチームが勝つだろうと思っていた。ところが、意外にもBチームが大差で勝った。', 'Tôi đã nghĩ có lẽ là đội A sẽ thắng. Nhưng, không ngờ đội B đã thắng với tỷ số cách biệt.', 'ところが', 'ところが', 157),
  ], relations: [],
});
setWord(569, {
  kanji: 'しかも', hiragana: 'しかも', hanVietMeaning: '', meaning: 'Hơn thế nữa, ngoài ra',
  examples: [
    ex('このあたりの夏は気温が高く、しかも湿度も高い。', 'Mùa hè ở vùng này có nhiệt độ cao, hơn thế nữa độ ẩm cũng cao.', 'しかも', 'しかも', 157),
    ex('彼は英語が話せる。しかも、フランス語も話せる。', 'Anh ấy có thể nói tiếng Anh. Hơn thế nữa, còn có thể nói tiếng Pháp.', 'しかも', 'しかも', 157),
  ], relations: [],
});
setWord(570, {
  kanji: 'すると', hiragana: 'すると', hanVietMeaning: '', meaning: 'Lập tức, trong trường hợp đó',
  examples: [
    ex('カーテンを開けた。すると、目の前に海が見えた。', 'Mở rèm cửa. Lập tức có thể nhìn thấy biển trước mắt.', 'すると', 'すると', 157),
    ex('「この問題は難しいですね」「すると、私には解けないということですか」', '“Vấn đề này khó nhỉ.” “Trong trường hợp đó, có nghĩa là tôi không thể giải được sao?”', 'すると', 'すると', 157),
  ], relations: [],
});
setWord(571, {
  kanji: 'なぜなら', hiragana: 'なぜなら', hanVietMeaning: '', meaning: 'Bởi vì, do',
  examples: [
    ex('このあたりは禁煙だ。なぜなら、貝の化石が見つかっているからだ。', 'Khu vực này cấm hút thuốc. Bởi vì, hóa thạch sò đã được tìm thấy.', 'なぜなら', 'なぜなら', 157),
  ], relations: [{ label: '合', items: [{ japanese: 'なぜならと言うと', vietnamese: 'Bởi vì, do', segments: segments('なぜならと言うと', 'なぜなら', 'なぜなら'), source: { pdfPage: 157, printedPage: 154 } }] }],
});
setWord(572, {
  kanji: 'だって', hiragana: 'だって', hanVietMeaning: '', meaning: 'Vì',
  examples: [ex('「どうして食べないの？」「だって、嫌いなんだもん」', '“Tại sao không ăn?” “Vì ghét thôi.”', 'だって', 'だって', 158)], relations: [],
});
setWord(573, {
  kanji: '要するに', hiragana: 'ようするに', hanVietMeaning: '', meaning: 'Tóm lại',
  examples: [ex('要するに実力がなかったのだ。', 'Tóm lại là không có thực lực.', '要するに', 'ようするに', 158)], relations: [],
});
setWord(574, {
  kanji: 'すなわち', hiragana: 'すなわち', hanVietMeaning: '', meaning: 'Có nghĩa là, nói một cách khác',
  examples: [ex('一郎君は妻の兄の子ども、すなわち、おいに当たる。', 'Ichirou là một đứa con của anh trai vợ tôi, nói một cách khác là cháu trai.', 'すなわち', 'すなわち', 158)], relations: [],
});
setWord(575, {
  kanji: 'あるいは', hiragana: 'あるいは', hanVietMeaning: '', meaning: 'Hoặc là, có lẽ',
  examples: [ex('この書類にはサイン、あるいは印鑑が必要だ。', 'Tài liệu này cần có chữ kí hoặc dấu.', 'あるいは', 'あるいは', 158)], relations: [],
});
setWord(576, {
  kanji: 'さて', hiragana: 'さて', hanVietMeaning: '', meaning: 'Sau đây, nào',
  examples: [ex('「これで文法の説明を終わります。さて、次は聴解です」', '“Đến đây là kết thúc phần giải thích ngữ pháp. Sau đây, tiếp theo là nghe hiểu.”', 'さて', 'さて', 159)], relations: [],
});
setWord(577, {
  kanji: 'では', hiragana: 'では', hanVietMeaning: '', meaning: 'Vậy thì, trong trường hợp đó',
  examples: [
    ex('「みなさん、お集まりですね。では、出発しましょう」', '“Mọi người, tập trung lại rồi nhỉ. Vậy thì, xuất phát thôi.”', 'では', 'では', 159),
    ex('「今日のテーマは江戸時代の文化についてです。では、佐藤先生、よろしくお願いします」', '“Chủ đề của ngày hôm nay là về văn hóa thời Edo. Vậy thì, xin nhờ thầy Sato.”', 'では', 'では', 159),
    ex('「月曜日はちょっと……」「では、火曜日はどうですか」', '“Thứ 2 thì e rằng…” “Vậy thì, thứ 3 có được không?”', 'では', 'では', 159),
  ], relations: [],
});
setWord(578, {
  kanji: 'ところで', hiragana: 'ところで', hanVietMeaning: '', meaning: 'Nhân tiện, tiện đây',
  examples: [
    ex('「今日はお疲れ様でした。ところで、今晩のご予定は？」', '“Hôm nay, bạn đã vất vả rồi. Nhân tiện, tối nay bạn có dự định gì không?”', 'ところで', 'ところで', 159),
    ex('「いいえ、弟に聞いてみます。ところで、出発の前に食事をしていきませんか」', '“Không, để tôi hỏi em trai tôi thử. Tiện đây, chúng ta ăn cơm trước khi xuất phát nhé?”', 'ところで', 'ところで', 159),
  ], relations: [],
});
setWord(579, {
  kanji: 'そう言えば', hiragana: 'そういえば', hanVietMeaning: '', meaning: 'Nhắc mới nhớ',
  examples: [ex('「同窓会の会場、予約しました」「ありがとう。そう言えば、山口先生が本を出されたそうよ」', '“Đã đặt hội trường họp mặt cựu học sinh rồi.” “Cảm ơn. Nhắc mới nhớ, nghe nói thầy Yamaguchi đã xuất bản sách.”', 'そう言えば', 'そういえば', 159)], relations: [],
});
setWord(580, {
  kanji: 'ただ', hiragana: 'ただ', hanVietMeaning: '', meaning: 'Chỉ, vẹn chỉ',
  examples: [ex('あのレストランは味もいいし、値段も安い。ただ、場所がちょっと不便だ。', 'Nhà hàng đó vừa ngon vừa rẻ. Chỉ có điều, địa điểm hơi bất tiện.', 'ただ', 'ただ', 159)], relations: [],
});
setWord(582, {
  examples: [
    ex('ぶどうを一粒食べる。', 'Ăn một quả nho.', '一粒', 'ひとつぶ', 162),
    ex('イヤリングには真珠が一粒ついていた。', 'Mỗi bông tai có gắn một viên ngọc trai.', '一粒', 'ひとつぶ', 162),
    ex('大粒の涙', 'Giọt nước mắt lớn', '大粒', 'おおつぶ', 162),
    ex('今年の新人社員は粒ぞろいだ（全員優秀だ）。', 'Người mới vào công ty năm nay đều xuất sắc (=Toàn bộ nhân viên đều xuất sắc).', '粒ぞろい', 'つぶぞろい', 162),
  ], relations: [],
});
setWord(584, {
  examples: [ex('この畑では小麦を栽培している。', 'Cánh đồng này đang trồng lúa mỳ.', '栽培', 'さいばい', 162)],
});
setWord(599, {
  kanji: '人工', hiragana: 'じんこう', hanVietMeaning: 'NHÂN CÔNG', meaning: 'Nhân tạo',
  examples: [
    ex('このスキー場では人工の雪を降らせている。', 'Khu trượt tuyết này đang cho rơi tuyết nhân tạo.', '人工', 'じんこう', 165),
    ex('人工ダイヤモンドは工業用に使われる。', 'Kim cương nhân tạo được sử dụng trong công nghiệp.', '人工', 'じんこう', 165),
  ],
});

data.verification = { ...(data.verification || {}), approved: false, method: 'manual-page-by-page', issues: ['Manual audit continued through PDF page 166; remaining pages require review.'] };
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Updated N2 words 567-580, 582, 584, 599 from PDF pages 155-166.');
