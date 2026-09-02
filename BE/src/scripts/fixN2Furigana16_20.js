const fs = require('fs');
const path = require('path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = data.units.flatMap((u) => u.parts.flatMap((p) => p.words));
const by = new Map(words.map((w) => [w.sourceNumber, w]));
const seg = (text, reading = '', isUnderlined = false) => ({ text, reading, isUnderlined });
function replace(number, exampleIndex, original, parts) {
  const e = by.get(number).examples[exampleIndex];
  const i = e.segments.findIndex((s) => s.text === original);
  if (i < 0) throw new Error(`${number}/${exampleIndex}: missing ${original}`);
  e.segments.splice(i, 1, ...parts);
}
replace(16, 0, 'の希望は海外で働くことだ。', [seg('の'), seg('希望', 'きぼう'), seg('は'), seg('海外', 'かいがい'), seg('で'), seg('働く', 'はたらく'), seg('ことだ。')]);
replace(16, 2, 'が楽しみだ。', [seg('が'), seg('楽しみ', 'たのしみ'), seg('だ。')]);
replace(17, 0, '彼女には、音楽の', [seg('彼女', 'かのじょ'), seg('には、'), seg('音楽', 'おんがく'), seg('の')]);
replace(18, 0, '私にはこの問題を解決する', [seg('私', 'わたし'), seg('にはこの'), seg('問題', 'もんだい'), seg('を'), seg('解決', 'かいけつ'), seg('する')]);
replace(18, 1, 'このホールは100人以上の収容', [seg('このホールは100'), seg('人以上', 'にんいじょう'), seg('の'), seg('収容', 'しゅうよう')]);
replace(19, 0, '「あなたの性格の', [seg('「あなたの'), seg('性格', 'せいかく'), seg('の')]);
replace(19, 0, 'と短所を言ってください」', [seg('と'), seg('短所', 'たんしょ'), seg('を言ってください」')]);
replace(19, 1, 'この車の', [seg('この'), seg('車', 'くるま'), seg('の')]);
replace(19, 1, 'は燃費がいいことだ。', [seg('は'), seg('燃費', 'ねんぴ'), seg('がいいことだ。')]);
replace(20, 0, '子どもたちの', [seg('子どもたちの')]);
replace(20, 0, 'を伸ばすような教育がしたい。', [seg('を'), seg('伸ばす', 'のばす'), seg('ような'), seg('教育', 'きょういく'), seg('がしたい。')]);
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log('Added source furigana for N2 entries 16-20.');
