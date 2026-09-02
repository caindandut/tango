const fs=require('node:fs');
const path=require('node:path');
const {computeCandidateHash}=require('../vocabulary/validateN2Vocabulary');
const file=path.resolve(__dirname,'../../file/n2_vocabulary.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const words=data.units.flatMap(u=>(u.parts||[]).flatMap(p=>p.words||[]));
const w=words.find(x=>x.sourceNumber===729); if(w){w.examples[0].japanese='交通事故に遭ってけがをした。';}
data.verification.candidateHash=computeCandidateHash(data); fs.writeFileSync(file,`${JSON.stringify(data,null,2)}\n`,'utf8'); console.log('aligned source 729 Japanese text with its repaired segments');
