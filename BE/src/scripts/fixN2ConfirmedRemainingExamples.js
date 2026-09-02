const fs=require('node:fs');
const path=require('node:path');
const {computeCandidateHash}=require('../vocabulary/validateN2Vocabulary');
const file=path.resolve(__dirname,'../../file/n2_vocabulary.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const words=data.units.flatMap(u=>(u.parts||[]).flatMap(p=>p.words||[]));
const by=new Map(words.map(w=>[w.sourceNumber,w]));
const seg=(text,reading='',underlined=false)=>({text,reading,isUnderlined:underlined});
const mark=(w,i,target,reading='')=>{const e=w.examples[i]; const at=e.japanese.indexOf(target); if(at<0) return false; const end=at+target.length; e.segments=[]; if(at)e.segments.push(seg(e.japanese.slice(0,at))); e.segments.push(seg(target,reading,true)); if(end<e.japanese.length)e.segments.push(seg(e.japanese.slice(end))); return true;};

// OCR substitutions and shifted examples confirmed against the rendered source pages.
const w701=by.get(701); w701.examples[0].japanese='水にぬらしたタオルを絞る。'; w701.examples[0].vietnamese='Vắt khăn đã làm ướt.'; w701.examples[0].segments=[seg('水にぬらしたタオルを'),seg('絞る','しぼる',true),seg('。')];
const w714=by.get(714); w714.examples[0].japanese='ボーナスで毎月の赤字を補う。'; w714.examples[0].segments=[seg('ボーナスで毎月の赤字を'),seg('補う','おぎなう',true),seg('。')];
const w730=by.get(730); w730.examples=[{japanese:'自宅に友人を招いた。',vietnamese:'Tôi đã mời bạn đến nhà.',segments:[seg('自宅に友人を'),seg('招いた','まねいた',true),seg('。')],source:w730.source}];
const w729=by.get(729); w729.examples[0].segments=[seg('交通事故に'),seg('遭って','あって',true),seg('けがをした。')];
const w731=by.get(731); [['引っかかって',''],['引っかかる',''],['引っかかった',''],['引っかかる',''],['引っかかって','']].forEach(([t,r],i)=>mark(w731,i,t,r));
const w749=by.get(749); mark(w749,0,'反して','はんして');
const w762=by.get(762); mark(w762,0,'片寄った','かたよった');
const w766=by.get(766); w766.examples[0].japanese='川の水が透き通っている。'; w766.examples[0].vietnamese='Nước sông trong vắt.'; w766.examples[0].segments=[seg('川の水が'),seg('透き通って','すきとおって',true),seg('いる。')];
const w768=by.get(768); w768.examples[0].japanese='司会者は騒がしい場内を一言で静めた。'; w768.examples[0].vietnamese='Người dẫn chương trình đã làm cả hội trường im lặng chỉ bằng một câu nói.'; w768.examples[0].segments=[seg('司会者は騒がしい場内を一言で'),seg('静めた','しずめた',true),seg('。')];
const w777=by.get(777); mark(w777,4,'調える','ととのえる');
const w816=by.get(816); mark(w816,0,'インフレ');
const w817=by.get(817); mark(w817,0,'デモ');

data.verification.candidateHash=computeCandidateHash(data); fs.writeFileSync(file,`${JSON.stringify(data,null,2)}\n`,'utf8'); console.log('fixed confirmed OCR variants, shifted examples and underlines');
