
let examType='write',examTopic='全部',examIndex=0,showKey=false;
function pool(){let all=examType==='write'?globalThis.WRITTEN:atlas;return all.filter(q=>examTopic==='全部'||(q.topic||q.group)===examTopic)}
function answerKey(id){return 'a:'+id}
function examView(){
 const items=pool(),q=items[examIndex]||items[0],write=examType==='write',topics=[...new Set((write?globalThis.WRITTEN:atlas).map(q=>q.topic||q.group))];
 const choices=write?[]:q.quiz.choices,answer=memo[answerKey(q.id)],shown=write?showKey:answer!==undefined;
 const picked=q.points?.map((_,i)=>!!memo['p:'+q.id+':'+i])||[];
 const tally=items.filter(t=>write?!!memo['draft:'+t.id]:memo[answerKey(t.id)]!==undefined).length;
 const correct=write?0:items.filter(l=>memo[answerKey(l.id)]===l.quiz.answer).length;
 return titleBlock('期末自测','先在纸上推演，或把过程写在下方。选择题核对结果，主观题按得分点逐项自评。')+`<div class="ctrls"><label for="et">题型</label><select id="et"><option value="write" ${write?'selected':''}>主观题与评分点</option><option value="choice" ${!write?'selected':''}>实验预测题</option></select><label for="eg">主题</label><select id="eg">${['全部',...topics].map(g=>`<option ${g===examTopic?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
 <section class="exercise"><div class="sec-head"><span class="stepnum">第 ${examIndex+1} / ${items.length} 题</span><span class="tiny">${esc(q.kind||q.group)} · ${write?'5 分自评':'单选'}</span></div><h2>${esc(write?q.title:q.quiz.ask)}</h2>${write?`<p class="prompt">${esc(q.prompt)}</p><label for="draft" class="tiny">我的推演</label><textarea class="workpad" id="draft" placeholder="写下步骤、条件或代码…">${esc(memo['draft:'+q.id]||'')}</textarea><div class="ctrls">${btn(shown?'收起参考解':'核对参考解','id="reveal"','primary')}</div>${shown?`<div class="study"><h3>参考推演</h3><p>${esc(q.solution)}</p><h3 class="rubric-title">逐项勾选自己写到的得分点</h3>${q.points.map((p,i)=>`<label class="rubric"><input type="checkbox" data-point="${i}" ${picked[i]?'checked':''}> ${esc(p)}</label>`).join('')}<p class="progress-note">自评 ${q.points.reduce((s,p,i)=>s+(picked[i]?Number.parseInt(p,10)||0:0),0)} / 5 分</p></div>`:''}`:choices.map((c,i)=>`<button class="choice ${shown&&answer===i?(i===q.quiz.answer?'selected':'miss'):''}" data-exanswer="${i}" ${shown?'disabled':''}>${esc(c)}</button>`).join('')+ (shown?`<div class="feedback ${answer!==q.quiz.answer?'miss':''}">${answer===q.quiz.answer?'答对。':'正确答案是「'+esc(choices[q.quiz.answer])+'」。'}${esc(q.quiz.why)}</div>${btn('重新作答','id="retry"')}`:'')}
 <div class="ctrls">${btn('上一题',`id="exPrev" ${examIndex===0?'disabled':''}`)}${btn('下一题',`id="exNext" ${examIndex===items.length-1?'disabled':''}`)}${(write?q.related:q.id)?lessonLink(byId.get(write?q.related:q.id),'回到关联实验'):''}</div></section>
 <section class="section"><div class="sec-head"><h2>选题</h2><p id="examSummary">${write?`本专题已有 ${tally} 份草稿`:`已作答 ${tally} 题，当前答对 ${correct} 题`}</p></div><div class="examtrack">${items.map((t,i)=>{const a=memo[answerKey(t.id)];return `<button title="${esc(t.title)}" aria-label="第 ${i+1} 题 ${esc(t.title)}" data-jump="${i}" class="${i===examIndex?'on ':''}${write?(memo['draft:'+t.id]?'mark':''):(a===undefined?'':a===t.quiz.answer?'mark':'wrong')}">${i+1}</button>`}).join('')}</div><p class="tiny" id="storage-note" role="status">${esc(storageNote())}</p></section>`;
}
function bookView(){
 return titleBlock('阅读指南','用一本主教材串起概念，再用实验、证明和闭卷手算检查掌握程度。')+
 `<article class="guide"><h2>主线教材</h2><p>邓俊辉《数据结构（C++语言版）》第 3 版，清华大学出版社，ISBN 9787302330646。可以从作者提供的教材、勘误、基础和高级慕课跳到同一主题。图志的数值、轨迹和练习为原创，按主题重组。</p><div class="ctrls"><a href="https://dsa.cs.tsinghua.edu.cn/~deng/ds/dsacpp/" target="_blank" rel="noopener">作者教材与课程资源</a><a href="https://www.tup.tsinghua.edu.cn/bookscenter/book_05358102.html" target="_blank" rel="noopener">出版社书目</a><a href="${sourceContents}" target="_blank" rel="noopener">核对第 3 版逐章目录</a></div>
 <p><a href="#contents">按章、节和关键词查阅全书</a></p></article>
 <article class="guide"><h2>怎样用这本图志</h2><ol><li>看清一个状态。拿链表举例，结点上方是对象地址，中间是数据，下方是 next。比较变量栏里的 p 与结点地址，认出 p 指向谁。</li><li>点击“下一步”前先预测：哪一格会被读，哪一格会被写？按下后用代码和图核对。遇到只读或比较步骤，先找仍然成立的条件。</li><li>换一种表示。把路径画在纸上，或者在双屏对照中用同一输入比较两种算法。观察次数时，请区分访问、比较和写入。</li><li>关闭图，做一道主观题。把代码的前提、循环不变量、终止条件和复杂度写出来，用空输入、重复值或极端形状检查结论。</li></ol></article>
 <article class="guide"><h2>课程覆盖</h2><p>下表列出本库已经实现的逐步实验。专题名称按常见本科课程组织，具体期末范围以本校教学大纲、作业和试卷题型为准。</p>${groups.map(g=>`<details><summary>${esc(g)}　${byGroup(g).length} 个实验</summary><div class="ctrls">${byGroup(g).map(l=>lessonLink(l)).join('')}</div></details>`).join('')}</article>`;
}
function handleClick(ev){
 const targetEl=ev.target.closest('button,[data-node]');if(!targetEl)return;
 const d=targetEl.dataset,id=targetEl.id;
 if(d.mode){navigate(d.mode);return}
 if(d.lesson){navigate('lab',d.lesson);return}
 if(d.group){openGroup=openGroup===d.group?'':d.group;catalog();return}
 if(d.node){const n=$('#nodeRead');if(n){n.hidden=false;n.textContent=d.node}return}
 if(['prev','next','play'].includes(id)){if(id==='play')play();else{stop();move((mode==='lab'?step:compareStep)+(id==='prev'?-1:1))}return}
 if(d.answer!==undefined){selection=Number(d.answer);stop();renderBody();return}
 if(id==='assign'){assign();return}
 if(id==='undo'||id==='boxReset'){if(id==='undo'&&historyBox.length>1)historyBox.pop();if(id==='boxReset')historyBox=[initialBox()];boxError='';renderBody();return}
 if(mode==='exam'){
  const q=pool()[examIndex];
  if(d.jump!==undefined||id==='exNext'||id==='exPrev'){examIndex=d.jump!==undefined?Number(d.jump):examIndex+(id==='exNext'?1:-1);showKey=false;renderBody();return}
  if(id==='reveal'){showKey=!showKey;renderBody();return}
  if(d.exanswer!==undefined){memo[answerKey(q.id)]=Number(d.exanswer);save();renderBody();return}
  if(id==='retry'){delete memo[answerKey(q.id)];save();renderBody()}
 }
}
document.addEventListener('click',handleClick);
document.addEventListener('input',ev=>{
 const t=ev.target;
 if(t.id==='find'){search=t.value;catalog()}
 else if(t.id==='draft'){memo['draft:'+pool()[examIndex].id]=t.value;save();const n=pool().filter(q=>!!memo['draft:'+q.id]).length;$('#examSummary').textContent=`本专题已有 ${n} 份草稿`;document.querySelector(`[data-jump="${examIndex}"]`)?.classList.toggle('mark',!!t.value)}
 else if(t.id==='timeline'){scrub(Number(t.value))}
});
document.addEventListener('change',ev=>{
 const t=ev.target;
 if(t.id==='speed'){speed=Number(t.value);if(timer){stop();play()}}
 if(t.id==='pair'){stop();pair=Number(t.value);compareStep=0;inputError='';renderBody()}
 if(t.id==='lhs')lhs=t.value;
 if(t.id==='rhs')rhs=t.value;
 if(t.id==='et'||t.id==='eg'){if(t.id==='et'){examType=t.value;examTopic='全部'}else examTopic=t.value;examIndex=0;showKey=false;renderBody()}
 if(t.dataset.point!==undefined){memo['p:'+pool()[examIndex].id+':'+t.dataset.point]=t.checked;save();renderBody()}
});
document.addEventListener('submit',ev=>{
 if(ev.target.id!=='arrayForm')return;
 ev.preventDefault();
 const raw=$('#arr').value.trim(),a=raw.split(/[,，\s]+/).map(Number),k=Number($('#key').value);
 if(!/^[+-]?\d+(?:\s*[,，]\s*[+-]?\d+|\s+[+-]?\d+)*$/.test(raw)||a.length>6||a.some((n,i)=>!Number.isSafeInteger(n)||i>0&&n<a[i-1])||!Number.isSafeInteger(k)){inputError='请输入 1–6 个从小到大排列的安全整数，目标也须为整数。';ev.target.querySelector('[role=alert]').textContent=inputError;return}
 stop();inputValues=a;target=k;inputError='';compareStep=0;renderBody()
});
document.addEventListener('keydown',ev=>{
 if(ev.target.closest('[data-node]')&&[' ','Enter'].includes(ev.key)){ev.preventDefault();ev.target.closest('[data-node]').dispatchEvent(new MouseEvent('click',{bubbles:true}));return}
 if(ev.altKey||ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.target.closest('input,textarea,select,button,summary,a,[contenteditable]')||!['lab','compare'].includes(mode))return;
 if(ev.key==='ArrowRight'||ev.key==='ArrowLeft'){ev.preventDefault();stop();move((mode==='lab'?step:compareStep)+(ev.key==='ArrowRight'?1:-1))}
 if(ev.key===' '){ev.preventDefault();play()}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer){stop();renderBody()}});
function route(){const [m,id]=location.hash.slice(1).split('/');navigate(Object.hasOwn(modes,m)?m:'map',id)}
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView({block:'start'})});
window.addEventListener('hashchange',route);route();
