const fs=require('node:fs');
const path=require('node:path');
const {computeCandidateHash}=require('../vocabulary/validateN2Vocabulary');
const file=path.resolve(__dirname,'../../file/n2_vocabulary.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const kana=/[ぁ-ゖァ-ヺー]/u;
const kanji=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const iRow={う:'い',く:'き',ぐ:'ぎ',す:'し',つ:'ち',ぬ:'に',ぶ:'び',む:'み',る:'り'};
function bases(word){
 const out=[];
 for(const raw of [word.kanji,word.hiragana]) for(const v of String(raw||'').split(/[／/]/u)){
  const b=v.replace(/（[^）]*）/gu,'').replace(/\([^)]*\)/gu,'').trim(); if(!b)continue;
  out.push(b);
  const last=b.at(-1);
  if(last==='な') out.push(b.slice(0,-1));
  if(iRow[last]) { const stem=b.slice(0,-1); out.push(stem); out.push(stem+iRow[last]); }
  if(!kanji.test(b) && b.length>2) out.push(b.slice(0,-1));
 }
 return [...new Set(out)].sort((a,b)=>b.length-a.length);
}
function locate(j,word){
 for(const b of bases(word)){const at=j.indexOf(b); if(at<0)continue; let end=at+b.length; while(end<j.length&&kana.test(j[end]))end++; return {at,end};}
 return null;
}
let repaired=0, unresolved=[];
const words=data.units.flatMap(u=>(u.parts||[]).flatMap(p=>p.words||[]));
for(const w of words) for(const e of w.examples||[]){
 if(!Array.isArray(e.segments)||e.segments.length!==1||!e.segments[0]?.isUnderlined||e.segments[0].text!==e.japanese)continue;
 const hit=locate(e.japanese,w); if(!hit){unresolved.push({n:w.sourceNumber,j:e.japanese});continue;}
 const before=e.japanese.slice(0,hit.at), target=e.japanese.slice(hit.at,hit.end), after=e.japanese.slice(hit.end);
 const reading=kanji.test(target)?String(w.hiragana||'').split(/[／/]/u)[0]:'';
 e.segments=[]; if(before)e.segments.push({text:before,reading:'',isUnderlined:false}); e.segments.push({text:target,reading,isUnderlined:true}); if(after)e.segments.push({text:after,reading:'',isUnderlined:false}); repaired++;
}
data.verification.candidateHash=computeCandidateHash(data); fs.writeFileSync(file,`${JSON.stringify(data,null,2)}\n`,'utf8'); console.log(`repaired ${repaired}; unresolved ${unresolved.length}`); console.log(JSON.stringify(unresolved.slice(0,40),null,2));
