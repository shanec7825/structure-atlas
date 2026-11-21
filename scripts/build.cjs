const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const base=path.join(root,'src','interface'),load=p=>fs.readFileSync(path.join(base,p),'utf8').replace(/\r\n/g,'\n');
const modules=['../pointer/pointer.js','../structures/structures.js','../algorithms/algorithms.js','../pointer/advanced.js','../structures/supplement.js','../pointer/deep.js','../algorithms/journey-depth.js'];
const lessons=[];
for(const file of modules){
  const context={ATLAS:[]};vm.runInNewContext(load(file),context,{filename:file});
  lessons.push(...context.ATLAS.filter(l=>!(file.endsWith('/deep.js')&&l.id==='external-merge')));
}
const exam={};vm.runInNewContext(load('../algorithms/exam.js'),exam);
const ids=new Set(lessons.map(l=>l.id));assert.equal(ids.size,lessons.length);
const groupNames=['指针与链表','线性结构','树与堆','图与散列','查找与排序','字符串与算法策略'];
for(const l of lessons){
  assert(groupNames.includes(l.group)&&l.quiz.choices[l.quiz.answer]&&l.code.length&&l.frames.length>1,l.id);
  for(const f of l.frames){
    assert(f.line>=-1&&f.line<l.code.length,l.id+' line');const nodes=new Set(f.nodes.map(n=>n.id));assert.equal(nodes.size,f.nodes.length,l.id);
    assert(f.edges.every(e=>nodes.has(e.from)&&nodes.has(e.to))&&f.focus.every(n=>nodes.has(n)),l.id+' connections');
  }
}
for(const q of exam.WRITTEN)assert(!q.related||ids.has(q.related),q.id);
const encode=obj=>JSON.stringify(obj).replaceAll('<','\\u003c');
const data='<script>globalThis.ATLAS='+encode(lessons)+';globalThis.WRITTEN='+encode(exam.WRITTEN)+';</script>';
const worldModules=['../pointer/world-early.js','../structures/world-middle.js','../algorithms/world-late.js'];
const worldSource=worldModules.map(load).join('\n');
const cases=vm.runInNewContext(worldSource+'\nObject.assign({},WORLD_EARLY,WORLD_MIDDLE,WORLD_LATE)');
assert.equal(Object.keys(cases).length,12);
for(let n=1;n<=12;n++){
 const c=cases[n];assert(c.title&&c.question&&c.condition&&c.choices.length===2);
 const results=[0,1].map(i=>c.experiment(i));
 for(const r of results)assert(r.rows.length>=2&&r.rows.every(x=>x.label&&String(x.value).trim())&&r.observation&&r.mechanism&&r.limit);
 assert.notEqual(JSON.stringify(results[0].rows),JSON.stringify(results[1].rows));
}
const sectionFiles=['../pointer/sections-early.js','../structures/sections-middle.js','../algorithms/sections-late.js'];
const sections=vm.runInNewContext(sectionFiles.map(load).join('\n')+'\n[...SECTIONS_EARLY,...SECTIONS_MIDDLE,...SECTIONS_LATE]');
const chapterLengths=[5,8,5,6,5,12,4,4,4,3,5,3];
const targetIds=chapterLengths.flatMap((len,index)=>Array.from({length:len},(_,j)=>(index+1)+'.'+(j+1)));
assert.deepEqual(Array.from(sections,s=>s.id),targetIds,'chapter coverage and order');
const hasText=v=>typeof v==='string'&&v.trim().length>0;
let demos=0,drills=0;
for(const s of sections){
 for(const field of ['title','premise','mechanism','check','answer'])assert(hasText(s[field]),s.id+' '+field);
 assert(s.trace?.length>=3&&s.trace.every(hasText)&&s.topics?.length&&s.topics.every(hasText),s.id+' substance');
 assert(Array.isArray(s.labs)&&s.labs.every(id=>ids.has(id)),s.id+' lab reference: '+s.labs);
 for(const d of s.drills||[]){assert([d.title,d.task,d.answer].every(hasText),s.id+' exercise');drills++}
 if(s.demo||s.presets){
  assert(typeof s.demo==='function'&&s.presets.length>=2,s.id+' presets');
  const outcomes=s.presets.map(p=>{assert(hasText(p.label),s.id);const frames=s.demo(p.input);assert(Array.isArray(frames)&&frames.length>=2&&frames.every(hasText),s.id+' demonstration');return JSON.stringify(frames)});
  assert(new Set(outcomes).size>=2,s.id+' contrasting inputs');demos++;
 }
}
const subjects=vm.runInNewContext(load('subjects.js')+'\nsectionSubjects');
assert.deepEqual(Array.from(subjects,row=>row.length),chapterLengths,'subject index');
const scripts=['core.js','modes.js','method.js','../algorithms/groove-engine.js','../structures/groove-links.js','../algorithms/quietlab.js','groove.js','shelf.js','scrub.js','journey.js','journey-opening.js','../pointer/journey-middle.js','../structures/journey-index.js','../algorithms/journey-finale.js','../pointer/journey-transfer.js',...worldModules,'world.js',...sectionFiles,'subjects.js','reader.js','learning.js'];
const app='(function(){\n'+scripts.map(load).join('\n')+'\n})();';new vm.Script(app);
const photo='data:image/jpeg;base64,'+fs.readFileSync(path.join(base,'drum-studio.jpg')).toString('base64');
const styles=['style.css','atlas.css','playroom.css','../algorithms/quietlab.css','../structures/groove-links.css','journey.css','../structures/journey-index.css','../algorithms/journey-finale.css','fieldbook.css','reader.css'].map(load).join('\n').replace('__DRUM_PHOTO__',()=>photo);
const result=load('template.html').replace('/* ATLAS_STYLE */',()=>styles).replace('<!-- ATLAS_DATA -->',()=>data).replace('/* ATLAS_APP */',()=>app);
fs.writeFileSync(path.join(root,'index.html'),result);
const lessonTitles=new Map(lessons.map(l=>[l.id,l.title]));
const chapters=['绪论','向量','列表','栈与队列','二叉树','图','搜索树','高级搜索树','词典','优先级队列','串','排序'];
const directory=['# 结构图志 · 逐节学习目录','','节号对应邓俊辉《数据结构（C++语言版）》第 3 版。在下载的 index.html 地址末尾添加 `#read/6.9`，即可打开相应一节。',''];
const mdText=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(let i=0;i<chapters.length;i++){
 directory.push('## 第 '+(i+1)+' 章　'+chapters[i],'');
 for(const s of sections.filter(s=>s.id.startsWith((i+1)+'.'))){
  const subject=subjects[i][Number(s.id.split('.')[1])-1];
  directory.push('### '+s.id+'　'+subject+'　'+mdText(s.title),'',mdText(s.premise),'',mdText(s.mechanism),'',...Array.from(s.trace,(line,i)=>(i+1)+'. '+mdText(line)),'','**自己推**　'+mdText(s.check),'','<details><summary>核对推理</summary>','',mdText(s.answer),'','</details>','');
  for(const d of s.drills||[])directory.push('**'+mdText(d.title)+'**　'+mdText(d.task),'','<details><summary>核对推理</summary>','',mdText(d.answer),'','</details>','');
  if(s.labs.length)directory.push('关联实验　'+s.labs.map(id=>lessonTitles.get(id)).join('、'),'');
 }
}
fs.writeFileSync(path.join(root,'COURSE.md'),directory.join('\n').trimEnd()+'\n');
console.log(JSON.stringify({sections:sections.length,demos,additionalExercises:drills,lessons:lessons.length,frames:lessons.reduce((n,l)=>n+l.frames.length,0),written:exam.WRITTEN.length,bytes:Buffer.byteLength(result)}));
