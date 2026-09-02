const fs = require('node:fs');
const path = require('node:path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');

const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => (u.parts || []).flatMap((p) => p.words || []));

// These entries were visibly concatenated by the earlier OCR pass.  The source
// prints Sino-Vietnamese readings as separate syllables; preserve the source
// spelling and punctuation while restoring only the missing spaces/diacritics.
const corrections = new Map(Object.entries({
  151: 'CHI PHÁT',
  160: 'MẠI THIẾT',
  371: 'LẬP THƯỢNG',
  372: 'PHI THƯỢNG',
  373: 'PHÙ THƯỢNG',
  381: 'CAN THƯỢNG',
  384: 'KIẾN THƯỢNG',
  390: 'MA THƯỢNG',
  392: 'THƯ THƯỢNG',
  395: 'SỐ THƯỢNG',
  402: 'LIÊN XUẤT',
  408: 'THƯ XUẤT',
  415: 'CẬT NHẬP',
  419: 'CHÚ NHẬP',
  425: 'TỌA NHẬP',
  428: 'MẶC NHẬP',
  432: 'MẠI NHẬP',
  435: 'THOẠI HỢP',
  454: 'VĂN TRỰC',
  515: 'ĐA THIỂU',
  525: 'NHẤT ĐOẠN',
  542: 'ĐƯƠNG NHẬT',
  543: 'ĐƯƠNG THỜI',
  588: 'THƯƠNG KHỐ',
  603: 'LẬP TRƯỜNG',
  632: 'CÔNG PHU',
  665: 'KHAI NGHIỆP',
  666: 'KHAI THÔI',
  709: 'SĨ THƯỢNG',
  710: 'SĨ THƯỢNG',
  760: 'MỤC GIÁC',
  768: 'TRẤN',
  864: 'DỊ THƯỜNG',
  869: 'THỦ KHINH',
  878: 'KHOÁI THÍCH',
  903: 'KHỔ TÌNH',
  916: 'PHƯƠNG NGÔN',
  932: 'ĐỂ KHÁNG',
  937: 'ĐỐI SÁCH',
  945: 'NĂNG SUẤT',
  1093: 'THỰC',
  1094: 'TƯ THIẾT',
}));

for (const word of words) {
  const value = corrections.get(String(word.sourceNumber));
  if (value) word.hanVietMeaning = value;
}

data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`corrected ${corrections.size} Hán–Việt readings`);
