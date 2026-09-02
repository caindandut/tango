const fs = require('fs');
const path = require('path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const by = new Map(words.map((w) => [w.sourceNumber, w]));
const set = (number, exampleIndex, readings) => {
  const segments = by.get(number).examples[exampleIndex].segments;
  if (segments.length !== readings.length) throw new Error(`${number}/${exampleIndex}: ${segments.length} != ${readings.length}`);
  segments.forEach((segment, index) => { segment.reading = readings[index]; });
};
set(1, 0, ['しあわせ', '', 'じんせい', '', 'おくる', '']);
set(1, 1, ['じんせい', 'けいけん', 'がほうふなひとのはなしはおもしろい。']);
set(2, 0, ['にんげん', '', 'みな', '', 'びょうどう', '', '']);
set(2, 1, ['', 'さつじんはん', '', 'にんげん', '', 'こころ', '', '', '']);
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Corrected early example furigana readings.');
