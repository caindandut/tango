const fs = require('node:fs');
const path = require('node:path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => (u.parts || []).flatMap((p) => p.words || []));
const byNumber = new Map(words.map((w) => [w.sourceNumber, w]));

// Corrections confirmed against the rendered source pages 335, 339, 341 and 344.
byNumber.get(1107).examples[4].vietnamese = 'Ngay cả người thích đồ cay như tôi quả nhiên cũng không thể ăn được món cà ri đỏ này.';
byNumber.get(1126).examples[0].vietnamese = 'Để không bị cô giáo thấy, tôi đã lén lút xem mail điện thoại.';
byNumber.get(1142).meaning = 'Thà... còn hơn, ngược lại';
byNumber.get(1148).meaning = 'Nhân tiện, tiện thể';
byNumber.get(1156).examples[0].vietnamese = 'Tòa nhà này vốn dĩ dự định hoàn thành vào năm trước nhưng do thiếu kinh phí nên vẫn chưa xong.';

data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('corrected final-page translations and punctuation');
