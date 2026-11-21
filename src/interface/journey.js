
const JOURNEY=Object.create(null);
const chapterNames=['','绪论','向量','列表','栈与队列','二叉树','图','搜索树','高级搜索树','词典','优先级队列','串','排序'];
const sourceContents='https://www.tup.tsinghua.edu.cn/bookscenter/bookcatalog?id=05358102';
const journeyStates=new Map(),journeyLogs=new Map();
let journeyChapter=4,journeyFold='',journeyOrigin=0,previewTimers=[];
function journeyContext(){
 const source=currentChain&&beatOrder(currentChain);
 return {personal:!!(source?.length&&!fromDemo),voices:source?.length?source.map(n=>n.voice):[0,2,1,0,2,1],gaps:source?.length?source.map(n=>Math.round(n.gap)):[280,285,350,140,355,310]};
}
function cancelAudition(){for(const id of previewTimers)clearTimeout(id);previewTimers=[];studioSound.stop()}
function audition(pattern){
 cancelAudition();
 const voices=pattern.split(',').map(Number).filter(v=>Number.isInteger(v)&&v>=0&&v<=2).slice(0,64);
 const tag=$('#journey-audio-status');
 if(!audible){if(tag)tag.textContent='当前静音，可在页首开启声音。';return}
 if(!voices.length)return;
 if(tag)tag.textContent=`正在试听 ${voices.length} 击`;
 voices.forEach((v,i)=>{if(i===0)studioSound.hit(v);else previewTimers.push(setTimeout(()=>studioSound.hit(v),i*230))});
 previewTimers.push(setTimeout(()=>{if(tag)tag.textContent='试听结束'},voices.length*230));
}
function station(n){return JOURNEY[n]}
function chapterLink(n,label,cls=''){return `<button class="chapter-link ${cls}" data-chapter="${n}">${esc(label)}</button>`}
function selectChapter(n){
 const value=Number(n);if(!Number.isInteger(value)||value<1||value>12)return;
 navigate('journey',String(value));
}
function chapterSelector(){
 return `<div class="journey-bar"><label><select id="chapter-choice" aria-label="按教材章节跳转">${chapterNames.slice(1).map((n,i)=>`<option value="${i+1}" ${journeyChapter===i+1?'selected':''}>第 ${i+1} 章　${esc(n)}</option>`).join('')}</select></label><nav class="reader-shortcuts" aria-label="章节阅读"><a href="#read/${journeyChapter}.1">逐节学</a><a href="#contents">目录</a></nav></div>`;
}
function trailFooter(n){
 return `<nav class="journey-turn" aria-label="沿教材前进">${n>1?chapterLink(n-1,`上一章 · ${chapterNames[n-1]}`):'<span></span>'}${n<12?chapterLink(n+1,`下一章 · ${chapterNames[n+1]}`,'forward'):'<button class="chapter-link forward" data-mode="exam">进入期末自测</button>'}</nav>`;
}
function readFields(){
 const box=$('#station-work');if(!box)return {};
 return Object.fromEntries([...box.querySelectorAll('input[name],textarea[name],select[name]')].filter(el=>el.type!=='radio'||el.checked).map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]));
}
function getState(n,ctx){
 if(journeyStates.has(n))return journeyStates.get(n);
 const spec=station(n),key='structure-atlas-workshop-v1/'+n;
 let log={start:ctx,steps:[]},state=spec.initial(ctx);
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   const entry=JSON.parse(raw);
   const valid=c=>c&&typeof c.personal==='boolean'&&Array.isArray(c.voices)&&c.voices.length>0&&c.voices.length<=32&&c.voices.every(v=>[0,1,2].includes(v))&&Array.isArray(c.gaps)&&c.gaps.length===c.voices.length&&c.gaps.every(v=>Number.isFinite(v)&&v>=0);
   if(!valid(entry.start)||!Array.isArray(entry.steps)||entry.steps.length>3000)throw Error('invalid history');
   let replayCtx=entry.start,replay=spec.initial(replayCtx);
   for(const event of entry.steps){
    if(event.ctx){if(!valid(event.ctx))throw Error('invalid recording');replayCtx=event.ctx}
    if(typeof event.op!=='string'||typeof event.v!=='string'||!event.f||Object.getPrototypeOf(event.f)!==Object.prototype)throw Error('invalid action');
    replay=spec.act(replay,event.op,event.v,event.f,replayCtx);
   }
   spec.view(replay,replayCtx);
   state=replay;log=entry;
  }
 }catch{/* A damaged or unavailable local record starts a fresh workspace. */}
 journeyStates.set(n,state);journeyLogs.set(n,{log,ctx:log.steps.reduce((c,x)=>x.ctx||c,log.start)});
 return journeyStates.get(n);
}
function keepAction(n,op,v,f,ctx){
 const history=journeyLogs.get(n),event={op,v,f};
 if(JSON.stringify(history.ctx)!==JSON.stringify(ctx)){event.ctx=ctx;history.ctx=ctx}
 const previous=history.log.steps.at(-1);
 if(op==='draft'&&previous?.op==='draft'&&!event.ctx)previous.f=f;
 else history.log.steps.push(event);
 try{
  if(history.log.steps.length>3000)throw Error('long session');
  localStorage.setItem('structure-atlas-workshop-v1/'+n,JSON.stringify(history.log));
  return true;
 }catch{return false}
}
function supplementLinks(n,related){
 return [...new Set([...(related||[]),...({
  1:['loop-count','recursive-stack'],2:['vector-grow','vector-insert','binary-bound'],3:['list-walk','list-reverse','cycle-meet'],
  4:['expression-stacks','ring-queue','recursive-stack'],5:['tree-inorder','tree-reconstruct','huffman'],
  6:['graph-topological','graph-dijkstra','graph-prim','graph-kruskal','articulation-cut'],
  7:['bst-search','bst-insert','avl-rotate'],8:['btree-root-split','rb-insert-repair','splay-zig-zig'],
  9:['hash-probe','hash-tombstone','skip-list-find'],10:['heap-up','heap-down','leftist-meld'],
  11:['kmp-prefix','kmp-match','bm-bad-character','rolling-match'],12:['quicksort-recursive','shell-sort','sort-partition']
 })[n]])].filter(id=>byId.has(id));
}
function stationDisclosure(n,v,related){
 const shown=k=>journeyFold===k?' open':'';
 const practice=TRANSFERS[n];
 const paper=`<div class="paper-test"><b>${esc(practice.form)}</b><p>${esc(practice.task)}</p><p>${esc(practice.check)}</p><details><summary>核对我的推演</summary><p>${esc(practice.solution)}</p></details></div>`;
 return `<div class="journey-details"><details name="chapter-notes" data-journey-fold="reason"${shown('reason')}><summary>数学与 C++</summary><div class="reason-grid"><div><p class="journey-math">${esc(v.math)}</p><p>${esc(v.why)}</p></div><pre tabindex="0"><code>${esc(v.cpp)}</code></pre></div></details><details name="chapter-notes" data-journey-fold="transfer"${shown('transfer')}><summary>自己推一次</summary><p>${esc(v.challenge)}</p>${paper}</details><details name="chapter-notes" data-journey-fold="further"${shown('further')}><summary>相关算法</summary><div class="related-list">${supplementLinks(n,related).map(id=>lessonLink(byId.get(id))).join('')}</div></details></div>`;
}
function journeyView(){
 const n=journeyChapter,ctx=journeyContext();
 if(n===3)return `<div class="journey-view">${chapterSelector()}${toyView()}${worldPanel(3)}${stationDisclosure(3,{math:'P → Next(P) → … → ∅',why:'每一击有固定的节点身份。让原前驱接上后继，再把摘下的节点接到新位置。已知两个接入口时改写次数为常数，寻找它们可能要遍历全链。',cpp:'// oldLink 指向原入口；摘下后确定新入口 newLink\nNode* moved = *oldLink;\n*oldLink = moved->next;\nmoved->next = *newLink;\n*newLink = moved;',challenge:'录四击，让最初的第二击最后出现。听一圈，再核对头节点、尾节点和第二击的音色、间隔。'},[])}${trailFooter(n)}</div>`;
 const spec=station(n),state=getState(n,ctx),v=spec.view(state,ctx);
 return `<article class="journey-view station-${n}">${chapterSelector()}<header class="station-intro"><h1>${esc(stationTitles[n])}</h1><p>${esc(stationPremises[n])}</p></header><div class="station-work" id="station-work"><div class="station-scene">${v.scene}</div><div class="station-panel"><div class="station-controls">${v.controls}</div><p class="station-caption" aria-live="polite">${esc(v.caption)}</p><span id="journey-audio-status" class="tiny" role="status"></span></div></div>${worldPanel(n)}${stationDisclosure(n,v,spec.related)}${trailFooter(n)}</article>`;
}
function applyStation(t){
 const n=journeyChapter,ctx=journeyContext(),spec=station(n);
 if(!spec||!t||t.hasAttribute('disabled')||t.getAttribute('aria-disabled')==='true')return;
 const op=t.dataset.op,v=t.dataset.v??'',fields=readFields();
 const before=getState(n,ctx),next=spec.act(before,op,v,fields,ctx);journeyStates.set(n,next);
 const saved=next===before||keepAction(n,op,v,fields,ctx);
 const pane=$('#station-work'),scrolls=[...pane.querySelectorAll('*')].filter(x=>x.scrollLeft>0).map(el=>[el.className,el.scrollLeft]);
 const openDetails=[...document.querySelectorAll('#station-work details,.paper-test details,.world-proof')].map(el=>el.open);
 renderBody();
 document.querySelectorAll('#station-work details,.paper-test details,.world-proof').forEach((el,i)=>{el.open=Boolean(openDetails[i])});
 if(!saved)$('#station-work .station-caption').append(' 本次操作仅保留在当前页面。');
 for(const [cl,x] of scrolls){const el=[...$('#station-work').querySelectorAll('*')].find(el=>typeof cl==='string'&&el.className===cl);if(el)el.scrollLeft=x}
 const controls=[...$('#station-work').querySelectorAll('[data-op]')];
 const usable=controls.filter(el=>!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&el.getClientRects().length);
 const focus=usable.find(el=>el.dataset.op===op&&(el.dataset.v??'')===v)||usable.find(el=>el.dataset.op===op)||usable.find(el=>el.tagName==='BUTTON')||$('#chapter-choice');
 focus?.focus({preventScroll:true});
}
function journeyHub(){
 const n=Number(memo.lastChapter),next=Number.isInteger(n)&&n>=1&&n<=12?n:4;
 return `<div class="path-entry"><div><strong>继续学${esc(chapterNames[next])}</strong><small>${esc(stationPremises[next]||'调整两拍之间的连接，听听播放顺序。')}</small></div><div class="reader-shortcuts"><a href="#contents">全书目录</a>${chapterLink(next,`第 ${next} 章 · ${stationTitles[next]||'鼓点接线'}`,'forward')}</div></div>`;
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-chapter],[data-op],[data-audition]');if(!t)return;
 if(t.dataset.chapter!==undefined){selectChapter(t.dataset.chapter);return}
 if(mode!=='journey'||journeyChapter===3)return;
 if(t.dataset.audition!==undefined){audition(t.dataset.audition);return}
 applyStation(t);
});
document.addEventListener('keydown',e=>{
 if(mode!=='journey'||![' ','Enter'].includes(e.key))return;
 const t=e.target.closest('svg [data-op]');if(t){e.preventDefault();if(!e.repeat)applyStation(t)}
});
document.addEventListener('change',e=>{if(e.target.id==='chapter-choice')selectChapter(e.target.value)});
function rememberScore(field){
 if(mode!=='journey'||journeyChapter!==5||field.name!=='score')return;
 const ctx=journeyContext(),fields={score:field.value};
 journeyStates.set(5,station(5).act(getState(5,ctx),'draft','',fields,ctx));
 if(!keepAction(5,'draft','',fields,ctx))$('#journey-audio-status').textContent='这段输入暂时只保留在当前页面。';
}
document.addEventListener('input',e=>rememberScore(e.target));
document.addEventListener('toggle',e=>{
 const t=e.target;
 if(mode!=='journey'||!t.dataset?.journeyFold||!t.isConnected)return;
 if(t.open){
  journeyFold=t.dataset.journeyFold;
  document.querySelectorAll('[data-journey-fold][open]').forEach(other=>{if(other!==t)other.open=false});
 }else if(journeyFold===t.dataset.journeyFold)journeyFold='';
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&previewTimers.length)cancelAudition()});
window.addEventListener('pagehide',()=>{if(previewTimers.length)cancelAudition()});
