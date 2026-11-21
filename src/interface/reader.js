const courseSections=[...SECTIONS_EARLY,...SECTIONS_MIDDLE,...SECTIONS_LATE];
const sectionById=new Map(courseSections.map(section=>[section.id,section]));
const sectionsIn=n=>courseSections.filter(s=>Number(s.id.split('.')[0])===n);
let readerId='1.1',readerPreset=0,readerFrame=0,sectionOrigin='',contentsQuery='';
let readerInput='',readerDraft='',readerFrames=[];
const readerSessions=new Map();
function rememberReader(){
 readerSessions.set(readerId,{readerInput,readerDraft,readerPreset,readerFrame,open:[...document.querySelectorAll('.section-reader details')].map(d=>d.open)});
}
function startReader(id){
 readerId=id;readerPreset=0;readerFrame=0;
 const section=sectionById.get(id),saved=readerSessions.get(id);
 if(section.demo){
  setReaderInput(saved?saved.readerInput:section.presets[0].input);
  if(saved){readerDraft=saved.readerDraft;readerPreset=saved.readerPreset;readerFrame=saved.readerFrame}
 }
}
function setReaderInput(input){
 readerInput=String(input);readerDraft=readerInput;readerFrame=0;
 readerFrames=sectionById.get(readerId).demo(readerInput);
}

function sectionLink(id,text){
 return `<a class="reader-link" href="#read/${esc(id)}">${esc(text||id+'　'+sectionSubject(id))}</a>`;
}
function chapterContents(n){
 return `<details class="chapter-index"><summary>本章各节</summary><div>${sectionsIn(n).map(s=>sectionLink(s.id)).join('')}</div></details>`;
}
function directoryRows(){
 const normalized=v=>String(v).normalize('NFKC').toLowerCase().replace(/[\s–—-]/g,'');
 const needle=normalized(contentsQuery);
 let count=0;
 const rows=chapterNames.slice(1).map((title,index)=>{
  const items=sectionsIn(index+1).filter(s=>!needle||[title,s.id,sectionSubject(s.id),s.title,s.premise,s.mechanism,...s.topics,...(s.drills||[]).map(d=>d.title)].some(v=>normalized(v).includes(needle)));
  if(!items.length)return '';
  count+=items.length;
  return `<details class="directory-chapter" ${needle?'open':''}><summary><span class="chapter-num">${String(index+1).padStart(2,'0')}</span><strong>${esc(title)}</strong><small>${items.length} 节</small></summary><div class="directory-links">${items.map(s=>sectionLink(s.id)).join('')}<a class="reader-link workshop-link" href="#journey/${index+1}">进本章工坊</a></div></details>`;
 }).join('');
 return (needle?`<p class="search-result" role="status">${count?'匹配 '+count+' 节':'没有匹配的章节。试试节号、中文名称或算法缩写。'}</p>`:'')+rows;
}
function resourceIndex(){
 const topics=[...new Set(courseSections.flatMap(s=>s.topics))].sort((a,b)=>a.localeCompare(b,'zh-Hans'));
 const graphics=chapterNames.slice(1).map((t,i)=>`<a class="reader-link" href="#journey/${i+1}">${esc(t)} · ${esc(stationTitles[i+1]||'鼓点接线')}</a>`).join('');
 const refs='<a href="https://dsa.cs.tsinghua.edu.cn/~deng/ds/dsacpp/" target="_blank" rel="noopener">作者教材、勘误及课程入口</a><a href="'+sourceContents+'" target="_blank" rel="noopener">出版社第 3 版目录</a>';
 const models=Object.entries(worldCases).map(([n,c])=>`<a class="reader-link" href="#journey/${n}">${n}　${esc(c.title)}</a>`).join('');
 const labIndex=groups.map(g=>`<div><h3>${esc(g)}</h3><div class="reference-list">${byGroup(g).map(l=>`<a href="#lab/${esc(l.id)}">${esc(l.title)}</a>`).join('')}</div></div>`).join('');
 const bucket=(label,body)=>`<details><summary>${label}</summary><div class="reference-list">${body}</div></details>`;
 return `<section class="reference-index"><h2>本图志的索引</h2>${bucket('教材与参考资料',refs)}${bucket('工坊图示',graphics)}${bucket('对照数据表',models)}${bucket('算法与 C++ 轨迹',labIndex)}${bucket('关键词',topics.map(t=>`<button type="button" data-topic-find="${esc(t)}">${esc(t)}</button>`).join(''))}</section>`;
}
function contentsView(){
 return `<article class="reader-directory"><header class="reader-heading"><h1>全书目录</h1><p>邓俊辉《数据结构（C++语言版）》第 3 版 · 12 章 ${courseSections.length} 节</p></header><label class="shelf-search"><input id="contents-search" type="search" aria-label="搜索节号、算法或关键词" placeholder="搜索节号、算法或关键词" value="${esc(contentsQuery)}"></label><div id="directory-results">${directoryRows()}</div>${resourceIndex()}</article>`;
}
function demoPane(section){
 const frames=readerFrames;
 const position=Math.min(frames.length-1,readerFrame);
 return `<h2>运行一遍</h2><label>示例 <select id="reader-preset">${readerPreset===-1?'<option value="-1" selected disabled>自己的输入</option>':''}${section.presets.map((p,i)=>`<option value="${i}" ${i===readerPreset?'selected':''}>${esc(p.label)}</option>`).join('')}</select></label><form id="reader-input-form"><label>输入 <input id="reader-input" value="${esc(readerDraft)}" maxlength="320" autocomplete="off"></label><button>运行</button></form><p aria-live="polite" class="demo-state">${esc(frames[position])}</p><div class="reader-actions"><button data-demo-shift="-1" ${position===0?'disabled':''}>上一步</button><output>${position+1} / ${frames.length}</output><button data-demo-shift="1" ${position===frames.length-1?'disabled':''}>下一步</button></div>`;
}
function readerView(){
 const s=sectionById.get(readerId),n=Number(s.id.split('.')[0]),i=courseSections.indexOf(s);
 const links=s.labs.map(id=>`<a class="reader-link" href="#lab/${esc(id)}">${esc(byId.get(id).title)}</a>`).join('');
 const drills=(s.drills||[]).map(d=>`<details><summary>${esc(d.title)}</summary><p>${esc(d.task)}</p><details><summary>核对推理</summary><p>${esc(d.answer)}</p></details></details>`).join('');
 return `<article class="section-reader" data-section-id="${esc(s.id)}"><nav class="reader-crumb" aria-label="当前位置"><a href="#contents">全书目录</a><span>/</span><a href="#journey/${n}">${esc(chapterNames[n])}工坊</a><span>/</span><span>§ ${s.id}　${esc(sectionSubject(s.id))}</span></nav><header class="reader-heading"><h1>${esc(s.title)}</h1><p>${esc(s.premise)}</p></header><section class="worked"><h2>跟一次状态变化</h2><ol>${s.trace.map(line=>`<li>${esc(line)}</li>`).join('')}</ol><p class="reader-rule">${esc(s.mechanism)}</p></section>${s.demo?`<section class="reader-demo" id="reader-demo">${demoPane(s)}</section>`:''}<section class="reader-practice"><h2>合上答案，自己推</h2><p>${esc(s.check)}</p><details><summary>核对推理</summary><p>${esc(s.answer)}</p></details>${drills}</section>${links?`<section class="reader-related"><h2>逐步实验</h2><div class="reference-list">${links}</div></section>`:''}${chapterContents(n)}<nav class="reader-turn" aria-label="相邻章节">${i>0?sectionLink(courseSections[i-1].id,'上一节 · '+courseSections[i-1].title):'<a href="#contents">全书目录</a>'}${i+1<courseSections.length?sectionLink(courseSections[i+1].id,'下一节 · '+courseSections[i+1].title):'<a href="#exam">期末自测</a>'}</nav></article>`;
}
function updateDemo(focus){
 const box=$('#reader-demo');
 box.innerHTML=demoPane(sectionById.get(readerId));
 const next=box.querySelector(focus);
 (next&&!next.disabled?next:box.querySelector('[data-demo-shift]:not(:disabled)'))?.focus({preventScroll:true});
}
document.addEventListener('input',e=>{
 if(e.target.id==='reader-input'){readerDraft=e.target.value;return}
 if(e.target.id!=='contents-search')return;
 contentsQuery=e.target.value;$('#directory-results').innerHTML=directoryRows();
});
document.addEventListener('change',e=>{
 if(e.target.id!=='reader-preset')return;
 readerPreset=Number(e.target.value);setReaderInput(sectionById.get(readerId).presets[readerPreset].input);updateDemo('#reader-preset');
});
document.addEventListener('submit',e=>{
 if(e.target.id!=='reader-input-form')return;
 e.preventDefault();setReaderInput($('#reader-input').value);
 readerPreset=sectionById.get(readerId).presets.findIndex(p=>String(p.input)===readerInput);
 updateDemo('#reader-input-form button');
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-demo-shift],[data-topic-find]');if(!b)return;
 if(b.hasAttribute('data-topic-find')){
  const input=$('#contents-search');input.value=b.dataset.topicFind;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();input.scrollIntoView({block:'center'});return;
 }
 if(b.disabled||mode!=='read')return;
 readerFrame+=Number(b.dataset.demoShift);updateDemo('[data-demo-shift="'+b.dataset.demoShift+'"]');
});
