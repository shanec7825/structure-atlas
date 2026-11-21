
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const atlas=globalThis.ATLAS;
const groupNames=['指针与链表','线性结构','树与堆','图与散列','查找与排序','字符串与算法策略'];
const groups=groupNames.filter(g=>atlas.some(l=>l.group===g));
const modes={map:'节奏室',method:'节奏室',journey:'全书工坊',contents:'全书目录',read:'分节研习',shelf:'课程架',lab:'逐步实验',compare:'双屏对照',sandbox:'指针沙盒',exam:'期末自测',paper:'纸笔练习',book:'阅读指南'};
const byId=new Map(atlas.map(l=>[l.id,l]));
const names=['指针与链表','线性结构','树与堆','图与散列','查找与排序','串与算法策略'];
const paths=['M3 12h7l4-7h7M13 15l4 4 5-5','M3 7h18v10H3zM9 7v10m6-10v10','M12 3v6M5 16v-4l7-3 7 3v4M2 17h6v4H2zm14 0h6v4h-6z','m3 16 7-11 10 8-7 7zM3 16l17-3','M3 19h3v-4H3zm7 0h3V9h-3zm7 0h3V4h-3z','m8 4-5 8 5 8m8-16 5 8-5 8M14 5l-4 14'];
function glyph(i){return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[i]||paths[0]}"/></svg>`}
let mode='map',lesson=byId.get('list-insert')||atlas[0],step=0,timer=0,speed=1400,compareStep=0,pair=0,selection=null,openGroup='',search='',sceneCounter=0;
const byGroup=g=>atlas.filter(l=>l.group===g);
let memo={},persistOK=true;
function storageNote(){return persistOK?"草稿、自评与选择题答案保存在当前浏览器。更换文件位置或浏览器可能使用另一份记录。":"当前浏览器无法保存。离开页面前，请把需要保留的草稿复制出来。"}
try{memo=JSON.parse(localStorage.getItem('structure-atlas-progress-v1')||'{}')||{};if(typeof memo!=='object'||Array.isArray(memo))memo={}}catch{persistOK=false}
function save(){try{localStorage.setItem('structure-atlas-progress-v1',JSON.stringify(memo));persistOK=true}catch{persistOK=false}const note=$('#storage-note');if(note)note.textContent=storageNote()}
function titleBlock(title,desc){return `<section class="intro"><h1>${esc(title)}</h1><p>${esc(desc)}</p></section>`}
function btn(label,attr,classes=''){return `<button class="btn ${classes}" ${attr}>${label}</button>`}
function lessonLink(l,text){return l?btn(esc(text||l.title),`data-lesson="${esc(l.id)}"`):''}
function catalog(){const box=$('#catalog');if(box)box.innerHTML=shelfRows()}
function stop(){clearInterval(timer);timer=0}
function navigate(m,id){
 if(!Object.hasOwn(modes,m)) return;
 if(mode==='read')rememberReader();
 if(m==='read'&&!sectionById.has(id))m='contents';
 if(m==='lab'&&mode==='read')sectionOrigin=readerId;
 else if(m!=='lab')sectionOrigin='';
 if(m==='read')startReader(id);
 const requested=Number(id||memo.lastChapter||4);
 const nextChapter=Number.isInteger(requested)&&requested>=1&&requested<=12?requested:4;
 if(activeToyScreen()&&m!=='map'&&m!=='method'&&!(m==='journey'&&nextChapter===3))leaveStudio();
 if(previewTimers.length)cancelAudition();
 if(mode==='journey'&&m==='lab')journeyOrigin=journeyChapter;
 else if(m!=='lab')journeyOrigin=0;
 if(m==='journey'){
  if(journeyChapter!==nextChapter||mode!==m)journeyFold='';
  journeyChapter=nextChapter;memo.lastChapter=nextChapter;save();
 }
 stop();mode=m;selection=null;
 if(m==='lab'){
  if(id&&byId.has(id)){lesson=byId.get(id);step=0}
  openGroup=lesson.group;
 }else if(m==='map'){openGroup=''}
 const hash=m==='lab'?`lab/${lesson.id}`:m==='journey'?`journey/${journeyChapter}`:m==='read'?`read/${readerId}`:m;
 if(location.hash.slice(1)!==hash)history.replaceState(null,'','#'+hash);
 paint();window.scrollTo(0,0);
 if(m==='read'){
  const opened=readerSessions.get(readerId)?.open;
  if(opened)document.querySelectorAll('.section-reader details').forEach((d,i)=>{d.open=!!opened[i]});
 }
 if(m==='contents'||m==='read')$('#main').focus({preventScroll:true});
}
function paint(){
 document.body.dataset.page=mode;
 const onToy=activeToyScreen();
 const activeNav=['journey','read','contents'].includes(mode)?'journey':onToy?'map':'shelf';
 $('#modes').innerHTML=[['map','节奏室'],['journey','全书工坊'],['shelf','课程架']].map(([key,text])=>'<button data-mode="'+key+'" '+(key===activeNav?'aria-current="page" class="active"':'')+'>'+text+'</button>').join('');
 $('#audio-toggle').hidden=!onToy&&!(mode==='journey'&&[5,11].includes(journeyChapter));
 audioButton();
 renderBody();
}
function renderBody(){
 sceneCounter=0;
 const draw={map:toyView,method:toyView,journey:journeyView,contents:contentsView,read:readerView,shelf:shelfView,lab:quietLabView,compare:compareView,sandbox:sandboxView,exam:examView,paper:methodView,book:bookView};
 const back=mode==='lab'&&sectionOrigin?sectionLink(sectionOrigin,'回到 §'+sectionOrigin+' 的推演'):mode==='lab'&&journeyOrigin?chapterLink(journeyOrigin,'回到第 '+journeyOrigin+' 章工坊','return-chapter'):'';
 $('#content').innerHTML=back+draw[mode]()+((mode==='map'||mode==='method')&&!recording?journeyHub():'');
}
function stage(frame,name,tag,options={}){
 const nodes=frame.nodes||[],focus=new Set(frame.focus||[]),uid='draw'+(++sceneCounter);
 const lookup=new Map(nodes.map(n=>[n.id,n]));
 const edges=frame.edges||[];
 function edgePath(e){
  const a=lookup.get(e.from),b=lookup.get(e.to);if(!a||!b)return '';
  const dx=b.x-a.x,dy=b.y-a.y;
  let d,lx,ly;
  if(a===b){
   d=`M ${a.x+43} ${a.y-26} C ${a.x+91} ${a.y-67},${a.x+100} ${a.y+30},${a.x+56} ${a.y+12}`;
   lx=a.x+80;ly=a.y-22;
  }else{
   const f=1/Math.max(Math.abs(dx)/55,Math.abs(dy)/31),rev=edges.some(o=>o.from===e.to&&o.to===e.from);
   const x1=a.x+dx*f,y1=a.y+dy*f,x2=b.x-dx*f,y2=b.y-dy*f;
   const middle=(x1+x2)/2,midY=(y1+y2)/2;
   const obstruct=nodes.some(n=>n!==a&&n!==b&&Math.abs(dy)<5&&Math.abs(n.y-midY)<37&&(n.x-a.x)*(n.x-b.x)<0);
   const bend=obstruct?(midY>145?80:-90):0, side=rev?28:0;
   const length=Math.hypot(dx,dy);
   const cx=middle-dy/length*side,cy=midY+dx/length*side+bend;
   d=`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
   lx=(middle+cx)/2;ly=(midY+cy)/2+(rev&&cy>midY?15:-7);
  }
  const hot=focus.has(e.from)&&focus.has(e.to);
  return `<path class="graph-edge ${hot?'hot':''}" d="${d}" ${e.directed===false?'':`marker-end="url(#${uid}${hot?'h':'m'})"`}/>${e.label?`<text x="${lx}" y="${ly}" class="edge-label" text-anchor="middle">${esc(e.label)}</text>`:''}`;
 }
 function fit(t,max,size){const units=Array.from(String(t??'')).reduce((s,ch)=>s+(ch.charCodeAt(0)>255?1.75:1),0);return units*size*.6>max?` textLength="${max}" lengthAdjust="spacingAndGlyphs"`:''}
 const digits=x=>`<marker id="${uid}${x}" viewBox="0 0 10 10" refX="8.8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="${x==='h'?'#dbf893':'#a8baab'}"/></marker>`;
 const objects=nodes.map(n=>{
  const hot=focus.has(n.id),col=hot?'#d6f590':'#d2e6d7';
  const exactAddress=String(n.label).match(/^(?:[a-zA-Z]+ · )?(0x[0-9a-f]+)$/i)?.[1];
  const aliases=exactAddress?(frame.vars||[]).filter(([k,v])=>/^(head|p|q|n|tmp|prev|curr|next|slow|fast|cur|victim|tail)$/.test(k)&&String(v)===exactAddress).map(([k])=>k):[];
  const pointerTag=aliases.length?`<text class="edge-label" y="50" text-anchor="middle">↑ ${esc(aliases.join(' · '))}</text>`:'';
  const rb=n.detail==='红色'||n.detail==='黑色'?`<circle cx="-41" cy="-12" r="6" fill="${n.detail==='红色'?'#a53236':'#253129'}"/>`:'';
  const desc=`${n.label}，值 ${n.value}，${n.detail||''}`;
  return `<g class="node-hit ${hot?'node-active':''}" tabindex="0" role="button" aria-label="${esc(desc)}" data-node="${esc(desc)}" transform="translate(${n.x},${n.y})"><title>${esc(desc)}</title><text class="nlab" y="-37" text-anchor="middle"${fit(n.label,114,13)}>${esc(n.label)}</text><path d="M-54 -26h108v52l-7 8h-94l-7-8z" fill="${hot?'#7ca25b':'#6f9780'}"/><rect class="face" x="-54" y="-28" rx="6" width="108" height="54" fill="${col}" stroke="${hot?'#dafa9f':'#a5bfb0'}"/><path d="M-52 4h104" stroke="${hot?'#9ab96d':'#acc9b5'}"/><text class="nval" y="-3" text-anchor="middle"${fit(n.value,98,24)}>${esc(n.value)}</text><text class="ndetail" y="19" text-anchor="middle"${fit(n.detail,100,12)}>${esc(n.detail)}</text>${rb}${pointerTag}</g>`;
 }).join('');
 const empty=nodes.length?'':'<text x="400" y="148" text-anchor="middle" fill="#d3dfcc" font-size="18">当前图中没有结点</text>';
 return `<section class="stage" aria-label="${esc(name)}"><div class="stage-top"><span class="stage-title"><i></i>${esc(name)}</span><span class="stage-tag">${esc(tag)}</span></div><div class="scene"><svg viewBox="0 -12 800 319" role="group" aria-label="${esc(frame.title||name)}"><defs>${digits('m')}${digits('h')}</defs>${edges.map(edgePath).join('')}${objects}${empty}</svg></div><div class="varbar"><small>变量</small>${(frame.vars||[]).map(([k,v])=>`<span class="var-chip">${esc(k)} <b>${esc(v)}</b></span>`).join('')||'<small>尚未赋值</small>'}<small class="pan-note">可横滑图面</small></div>${options.footer||''}</section>`;
}
function transport(n,last){
 return `<div class="transport"><button id="prev" aria-label="上一步" ${n===0?'disabled':''}>上一步</button><button class="play" id="play">${timer?'暂停':n===last?'重播':'播放'}</button><button id="next" aria-label="下一步" ${n===last?'disabled':''}>下一步</button><input id="timeline" type="range" min="0" max="${last}" value="${n}" aria-label="步骤时间线"><output>${String(n).padStart(2,'0')} / ${String(last).padStart(2,'0')}</output><select id="speed" aria-label="播放速度">${[[2300,'慢速'],[1400,'标准'],[700,'快速']].map(([v,k])=>`<option value="${v}" ${speed===v?'selected':''}>${k}</option>`).join('')}</select></div>`;
}
const nodeRead='<div id="nodeRead" class="noderead" role="status" hidden></div>';
function move(to){
 const last=mode==='lab'?lesson.frames.length-1:comparison().length-1;
 const next=Math.max(0,Math.min(to,last));
 if(mode==='lab')step=next;else compareStep=next;
 if(next===last) stop();
 const active=document.activeElement?.id;
 const sceneScroll=[...document.querySelectorAll('.scene')].map(s=>s.scrollLeft);
 renderBody();
 document.querySelectorAll('.scene').forEach((s,i)=>s.scrollLeft=sceneScroll[i]||0);
 if(active)document.getElementById(active)?.focus({preventScroll:true});
 const row=$('.cline.current');if(row){const box=row.parentNode;box.scrollTop=Math.max(0,row.offsetTop-box.clientHeight/2)}
}
function play(){
 if(timer){stop();renderBody();return}
 const last=mode==='lab'?lesson.frames.length-1:comparison().length-1;
 if((mode==='lab'?step:compareStep)===last)move(0);
 timer=setInterval(()=>move((mode==='lab'?step:compareStep)+1),speed);renderBody()
}
