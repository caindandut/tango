const fs=require('node:fs');
const path=require('node:path');
const {computeCandidateHash}=require('../vocabulary/validateN2Vocabulary');
const file=path.resolve(__dirname,'../../file/n2_vocabulary.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const hasKanji=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
let fixed=0;
for(const unit of data.units) for(const part of unit.parts||[]) for(const word of part.words||[]) {
  const readings=String(word.hiragana||'').split(/[／/]/u).filter(Boolean);
  for(const example of word.examples||[]) for(const segment of example.segments||[]) {
    if(segment.isUnderlined && hasKanji.test(segment.text||'') && !String(segment.reading||'').trim()) {
      segment.reading=readings[0]||'';
      if(segment.reading) fixed+=1;
    }
  }
}
data.verification.candidateHash=computeCandidateHash(data);
fs.writeFileSync(file,`${JSON.stringify(data,null,2)}\n`,'utf8');
console.log(`restored readings for ${fixed} repaired example segments`);
