
const drumNames=['底鼓','军鼓','踩镲'];
const studioSound=makeDrumAudio();
let audible=true, recording=false, take=[],lastHits=[],beatTimer=0,echoTimer=0,playToken=0;
let running=false,currentBeat=null, selectedBeat=0,connections=false,recordAt=0,undoChain=null,padMessage='';
let currentChain=null,baseChain=null,fromDemo=false;
function isChain(c){
 if(!c||!Array.isArray(c.nodes)||c.nodes.length<1||c.nodes.length>16)return false;
 if(!c.nodes.every((n,i)=>n&&typeof n==='object'&&n.id===i&&Number.isInteger(n.voice)&&n.voice>=0&&n.voice<3&&Number.isFinite(n.gap)&&n.gap>0&&n.gap<=60000&&(n.next===null||Number.isInteger(n.next)&&n.next>=0&&n.next<c.nodes.length)))return false;
 const order=beatOrder(c);
 return order.length===c.nodes.length&&order.at(-1).next===null;
}
if(isChain(memo.beatOriginal)&&isChain(memo.beatChain)){currentChain=memo.beatChain;baseChain=memo.beatOriginal;selectedBeat=currentChain.head}
function activeToyScreen(){return mode==='map'||mode==='method'||(mode==='journey'&&journeyChapter===3)}
function iconSound(on){return `<svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M3 9h5l5-4v14l-5-4H3z"/>${on?'<path d="M16 9q4 3 0 6m2-9q8 6 0 12"/>':'<path d="m17 9 5 6m0-6-5 6"/>'}</svg>`}
function playIcon(name,size){return name==='book'?'<span aria-hidden="true">⌕</span>':iconSound(true)}
function audioButton(){const b=$('#audio-toggle');b.innerHTML=iconSound(audible)+(audible?'声音开':'静音');b.setAttribute('aria-pressed',String(audible))}
function rememberBeat(){memo.beatOriginal=baseChain;memo.beatChain=currentChain;save()}
function stopLoop(){
 clearTimeout(beatTimer);playToken++;running=false;currentBeat=null;studioSound.stop();
 clearTimeout(echoTimer);
}
function leaveStudio(){
 stopLoop();
 if(recording&&take.length)finishTake(false);
 recording=false;take=[];lastHits=[];
}
function illuminate(v){

 const root=$('.object-visual');if(!root)return;
 const groups=[...root.querySelectorAll('[data-drum]')];
 groups.forEach(g=>g.classList.remove('beat-active'));
 const hit=groups.find(g=>Number(g.dataset.drum)===v);
 if(hit){hit.getBoundingClientRect();hit.classList.add('beat-active')}
 clearTimeout(echoTimer);echoTimer=setTimeout(()=>{groups.forEach(g=>g.classList.remove('beat-active'))},400);
}
function strikeDrum(v){
 if(!Number.isInteger(v)||v<0||v>2)return;
 const now=performance.now();
 if(recording){
  if(!take.length)recordAt=now;
  take.push({voice:v,time:now-recordAt});
 }
 studioSound.hit(v);illuminate(v);
 lastHits.push(v);if(lastHits.length>16)lastHits.shift();
 if(recording&&take.length===16){finishTake(true);return}
 const live=$('#beat-live');if(live)live.textContent=recording?`第 ${take.length} 击 · ${drumNames[v]}`:drumNames[v];
 const tape=$('#live-tape');if(tape)tape.innerHTML=bodyMarks(recording?take.map(h=>h.voice):lastHits);
}
function bodyMarks(voices){return voices.map(v=>`<i class="hit-dot v${v}" aria-hidden="true"></i>`).join('')}
function startTake(){
 stopLoop();recording=true;take=[];lastHits=[];connections=false;padMessage='';
 redrawGroove();$('#finish-take')?.focus({preventScroll:true});
}
function finishTake(paint=true){
 if(take.length){
  const raw=performance.now()-(recordAt+take.at(-1).time);
  const previous=take.length>1?take.at(-1).time-take.at(-2).time:420;
  const tail=take.length===16?previous:raw;
  currentChain=makeBeatChain(take,Math.max(70,tail));
  baseChain=currentChain;undoChain=null;selectedBeat=currentChain.head;fromDemo=false;
  rememberBeat();padMessage=take.length===16?'16 击已录好。':'录好了。';
 }else padMessage='想好了就敲，第一下才开始计时。';
 recording=false;take=[];lastHits=[];
 if(paint&&activeToyScreen()){redrawGroove();($('#start-loop')||$('#begin-take'))?.focus({preventScroll:true})}
}
function toggleLoop(){
 if(running){stopLoop();redrawGroove();$('#start-loop')?.focus({preventScroll:true});return}
 if(!currentChain)return;
 running=true;const token=++playToken;
 redrawGroove();$('#start-loop')?.focus({preventScroll:true});
 let intended=performance.now(),position=0;
 function tick(id){
  if(token!==playToken||!running||!activeToyScreen())return;
  const n=currentChain.nodes[id];if(!n){stopLoop();redrawGroove();return}
  currentBeat=id;studioSound.hit(n.voice);illuminate(n.voice);
  document.querySelectorAll('[data-route-id]').forEach(el=>el.classList.toggle('now',Number(el.dataset.routeId)===id));
  const label=$('#beat-live');if(label)label.textContent=`第 ${position+1} 拍 · P${id+1} ${drumNames[n.voice]}`;
  position=n.next===null?0:position+1;
  intended+=n.gap;const now=performance.now();if(intended<now)intended=now;
  beatTimer=setTimeout(()=>tick(n.next===null?currentChain.head:n.next),intended-now);
 }
 tick(currentChain.head);
}
function demoTake(){
 stopLoop();
 const hits=[{voice:0,time:0},{voice:2,time:280},{voice:1,time:565},{voice:0,time:915},{voice:2,time:1055},{voice:1,time:1410}];
 currentChain=makeBeatChain(hits,310);baseChain=currentChain;fromDemo=true;selectedBeat=currentChain.head;undoChain=null;connections=false;padMessage='';lastHits=[];toggleLoop()
}
function playbackRibbon(){
 const order=beatOrder(currentChain);
 const total=order.reduce((a,n)=>a+n.gap,0);
 const intervals=order.map(n=>`<i class="tone-${n.voice}" style="flex:${n.gap} 1 0" title="P${n.id+1} · ${Math.round(n.gap)} 毫秒"></i>`).join('');
 return `<div class="take-scale"><div class="take-meter" aria-hidden="true">${intervals}</div><div class="take-ticks"><span>0 秒</span><span>一圈 ${(total/1000).toFixed(2)} 秒</span></div></div><div class="record-strip" aria-label="按播放顺序排列的节点与停留时长">${order.map((n,i)=>`<span class="beat-event v${n.voice} ${currentBeat===n.id?'now':''}" data-route-id="${n.id}" title="第 ${i+1} 拍 · P${n.id+1}，${drumNames[n.voice]}，停留 ${Math.round(n.gap)} 毫秒"><i></i><span>P${n.id+1}　${drumNames[n.voice]}　${Math.round(n.gap)} ms</span></span>`).join('')}</div>`;
}
function photoPads(){
 return `<div class="photo-bench" role="group" aria-label="三个可敲击的鼓面">${drumNames.map((name,v)=>`<button type="button" class="photo-pad pad-${v}" data-drum="${v}" aria-label="${name}，键盘 ${v+1}"><span class="pad-tag"><kbd>${v+1}</kbd>${name}</span></button>`).join('')}</div>`;
}
function toyView(){
 const ready=!!currentChain&&!recording;
 const size=ready?currentChain.nodes.length:0;
 const tip=recording?'敲击之间的等待也会录下。最后一击之后，按结束留下收尾。':size===1?'这一击可以循环。重新录两击，就能交换它们的顺序。':size===2?'把第一击放到第二击后面，再听这一圈。':size>2?'把第二击移到末尾，再听原来的停顿落在了哪里。':'点鼓面，敲一段熟悉的步频。录好后改变下一拍的指向，听同一组声音怎样变成另一句。';
 return `<div class="toyhome groove-home"><section class="playfield drum-stage"><div class="toy-ledger"><i class="led ${recording?'rec':''}"></i>${recording?'录音中':ready?(running?'循环播放中':fromDemo?'示例录音':'个人录音'):'节奏室'}</div><div class="toy-copy"><h1>${recording?'录下这一句':ready?(size===1?'听这一拍':'换一拍的位置'):'鼓点接线'}</h1><p class="toy-prompt">${tip}</p><div class="toy-actions">${recording?'<button id="finish-take" class="knob-button"><i class="stop-sign"></i>结束录制</button>':ready?`<button class="knob-button" id="start-loop">${running?'暂停循环':'循环播放'}</button><button class="theory-switch" id="begin-take">重新录一段</button>`:'<button class="knob-button" id="begin-take"><i class="rec-sign"></i>录一段鼓点</button><button class="theory-switch" id="demo-take">听示例</button>'}</div></div>
 <div class="object-mount"><div class="object-visual">${photoPads()}</div></div></section>
 ${ready?`<section class="take-sheet"><div class="sheet-line"><h2>${fromDemo?'示例音轨':'我的音轨'}</h2><span id="beat-live">${running?'循环中':esc(padMessage)}</span></div>${playbackRibbon()}${!fromDemo&&!persistOK?'<p role="status">浏览器未能保存这段节奏，当前页面还能回放。</p>':''}<div class="edit-actions"><button ${size===1?'hidden':''} id="open-connections" class="edit-groove" aria-expanded="${connections}">${connections?'收起接线':'移动一拍'}</button>${undoChain?'<button id="undo-splice">撤销上次接线</button>':''}</div>${connections?grooveConnections(currentChain,selectedBeat):''}</section>`:`<div class="live-journal"><span id="beat-live" role="status">${recording?'等待第一击，最多 16 击。':''}</span><div id="live-tape">${bodyMarks(recording?take.map(h=>h.voice):lastHits)}</div></div>`}
 </div>`;
}
function redrawGroove(){
 const field=mode==='journey'&&journeyChapter===3?document.querySelector('.groove-home'):null;
 if(field)field.outerHTML=toyView();
 else renderBody();
}
function rerenderStudio(focus){
 redrawGroove();if(focus)$(focus)?.focus({preventScroll:true});
}
function handleStudio(t){
 const d=t.dataset,id=t.id;
 if(id==='audio-toggle'){audible=!audible;studioSound.setEnabled(audible);audioButton();return}
 if(!activeToyScreen())return;
 if(d.drum!==undefined){strikeDrum(Number(d.drum));return}
 if(id==='begin-take')startTake();
 if(id==='finish-take')finishTake();
 if(id==='demo-take')demoTake();
 if(id==='start-loop')toggleLoop();
 if(id==='open-connections'){connections=!connections;rerenderStudio('#open-connections');if(connections)$('#apply-splice')?.closest('section,article')?.scrollIntoView({block:'nearest'})}
 if(d.beatSelect!==undefined){selectedBeat=Number(d.beatSelect);rerenderStudio(`[data-beat-select="${selectedBeat}"]`)}
 if(id==='apply-splice'){
  const num=Number($('#beat-after').value),next=moveBeatAfter(currentChain,selectedBeat,num<0?null:num);
  if(beatOrder(next).map(n=>n.id).join()===beatOrder(currentChain).map(n=>n.id).join()){const live=$('#beat-live');if(live)live.textContent='这一击已经在这个位置。';return}
  const resume=running;stopLoop();undoChain=currentChain;currentChain=next;padMessage='已重新接好。听听这次的顺序。';
  if(!fromDemo)rememberBeat();if(resume)toggleLoop();else rerenderStudio('#apply-splice');
 }
 if(id==='undo-splice'&&undoChain){const resume=running;stopLoop();currentChain=undoChain;undoChain=null;padMessage='已恢复上一次顺序。';if(!fromDemo)rememberBeat();if(resume)toggleLoop();else rerenderStudio('#open-connections')}
}
const studioControls='[data-drum],[data-beat-select],#audio-toggle,#begin-take,#finish-take,#demo-take,#start-loop,#open-connections,#undo-splice,#apply-splice';
document.addEventListener('pointerdown',e=>{
 const pad=e.target.closest('[data-drum]');if(!activeToyScreen()||!pad||e.button!==0)return;
 strikeDrum(Number(pad.dataset.drum));
});
document.addEventListener('click',e=>{const t=e.target.closest(studioControls);if(!t)return;
 if(t.hasAttribute('data-drum')&&window.PointerEvent&&e.detail>0)return;
 handleStudio(t);
});
document.addEventListener('keydown',e=>{
 if(!activeToyScreen()||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(['1','2','3'].includes(e.key)){e.preventDefault();if(!e.repeat)strikeDrum(Number(e.key)-1);return}
 const pad=e.target.closest('[data-drum]');if(pad&&['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)strikeDrum(Number(pad.dataset.drum))}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&activeToyScreen()&&(running||recording)){leaveStudio();redrawGroove()}});
window.addEventListener('pagehide',()=>{if(activeToyScreen())leaveStudio()});
