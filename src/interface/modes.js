
const comparePairs=['链表插入 · 交换两行','同图遍历 · BFS / DFS','同一路网 · Prim / Kruskal','自定数组 · 顺序 / 二分查找'];
let inputValues=[2,5,7,10,16,24],target=16,inputError='';
function lookupTrace(binary){
 const a=inputValues,steps=[];let probes=0;
 function frame(index,title,note,lo,hi,line,answer){
  return {line,title,note,nodes:a.map((v,i)=>({id:'a'+i,x:80+i*(640/Math.max(1,a.length-1)),y:135,label:`a[${i}]`,value:v,detail:i===index?'本次读取':i<lo||i>=hi?'区间外':'候选'})),edges:[],focus:index>=0?['a'+index]:[],vars:[['目标',target],['已读取',probes],['候选区间',`[${lo}, ${hi})`],...(answer===undefined?[]:[['结果',answer]])]};
 }
 steps.push(frame(-1,'准备查找','目标是找到第一个不小于目标值的位置。',0,a.length,-1));
 const code=binary?['int m = lo + (hi - lo) / 2; int value = a[m];','if (value < key) lo = m+1; else hi = m;','return lo;']:['if (a[i] >= key) return i;','++i;','return n;'];
 if(binary){let lo=0,hi=a.length;while(lo<hi){const m=lo+Math.floor((hi-lo)/2);probes++;steps.push(frame(m,'读取区间中点',`a[${m}] = ${a[m]}。现在比较它与 ${target}。`,lo,hi,0));if(a[m]<target)lo=m+1;else hi=m;steps.push(frame(-1,'更新半开区间',`下一轮在 [${lo}, ${hi}) 中检查；尾后下标也可以成为答案。`,lo,hi,1))}steps.push(frame(-1,'区间已空',`返回下标 ${lo}。`,lo,hi,2,lo))}
 else{let i=0;for(;i<a.length;i++){probes++;steps.push(frame(i,'依次读取',`比较 ${a[i]} 与 ${target}。${a[i]>=target?'这是第一个满足条件的位置，返回它。':'它太小，继续。'}`,i,a.length,0,a[i]>=target?i:undefined));if(a[i]>=target)break;steps.push(frame(-1,'游标右移',`下一次从下标 ${i+1} 开始。`,i+1,a.length,1))}if(i===a.length)steps.push(frame(-1,'到达尾后',`所有元素都小于目标，返回 ${i}。`,i,i,2,i))}
 return {title:binary?'二分查找':'顺序查找',code,frames:steps};
}
function comparison(){
 let left,right,ls,rs;
 if(pair===0){left=byId.get('list-insert');right=byId.get('list-insert-order');ls=left.frames.slice(1);rs=right.frames}
 else if(pair===1){left=byId.get('graph-bfs');right=byId.get('graph-dfs')}
 else if(pair===2){left=byId.get('graph-prim');right=byId.get('graph-kruskal')}
 else{left=lookupTrace(false);right=lookupTrace(true)}
 ls=ls||left.frames;rs=rs||right.frames;
 return Array.from({length:Math.max(ls.length,rs.length)},(_,i)=>[[left,ls[Math.min(i,ls.length-1)],i>=ls.length],[right,rs[Math.min(i,rs.length-1)],i>=rs.length]]);
}
function compareView(){
 const frames=comparison(),rows=frames[compareStep],desc=['两边都从新结点已分配的时刻开始。先猜交换两行后，原来的后继还能不能从 head 找到。','同一个起点、同一张图、相同的邻接顺序。观察队列和递归调用栈怎样改变访问次序。','路网和边权完全一样。左边沿当前树的边界向外生长，右边给全图的边排序并逐条尝试。','给两种方法同一组有序数，寻找第一个不小于目标的下标。比较“已读取”计数。'][pair];
 return titleBlock('双屏对照',desc)+`<div class="compare"><div class="ctrls"><label for="pair">比较主题</label><select id="pair">${comparePairs.map((p,i)=>`<option ${pair===i?'selected':''} value="${i}">${p}</option>`).join('')}</select></div>${pair===3?`<form id="arrayForm" class="ctrls"><label for="arr">非降序整数（1–6 项）</label><input id="arr" value="${inputValues.join(', ')}" required><label for="key">目标</label><input id="key" type="number" value="${target}" required style="width:85px"><button class="btn primary">应用输入</button><p class="miniword" role="alert">${esc(inputError)}</p></form>`:''}<div class="duet">${rows.map(([l,f,held])=>`<div>${stage(f,l.title,held?'停在终态':'同步步进')}<div class="observation"><h3>${esc(f.title)}</h3><code>${esc(l.code[f.line]||'// 初始状态')}</code><p>${esc(f.note)}</p></div></div>`).join('')}</div>${transport(compareStep,frames.length-1)}${nodeRead}<p class="tiny">每次推进两侧各一个记录状态。两种算法的单步工作量可能不同。</p></div>`;
}
const address={A:'0x2A0',B:'0x7C0',C:'0x410',N:'0x650'},payload={A:12,B:37,C:54,N:23};
function initialBox(){return {vars:{head:'A',p:'A',n:'N',tmp:null},next:{A:'B',B:'C',C:null,N:null},last:'初始时，p 和 head 同时指向 12，n 指向一个独立的 23。',focus:[]}}
let historyBox=[initialBox()],lhs='n->next',rhs='p->next',boxError='';
const ptrNames=['head','p','n','tmp'];
const exprs=[...ptrNames,...ptrNames.map(k=>k+'->next')];
const nameAddr=k=>k===null?'nullptr':address[k];
function visitBox(b){
 const path=[],seen=new Set();let id=b.vars.head;
 while(id!==null&&!seen.has(id)){path.push(id);seen.add(id);id=b.next[id]}
 return {path,cycle:id};
}
function sandboxView(){
 const b=historyBox.at(-1),reach=visitBox(b),points={A:[87,137],B:[474,137],C:[699,137],N:[278,226]};
 const nodes=Object.keys(address).map(id=>({id,label:address[id],value:payload[id],detail:'next '+nameAddr(b.next[id]),x:points[id][0],y:points[id][1]}));
 const frame={title:'指针写入试验',nodes,edges:Object.entries(b.next).filter(([,v])=>v!==null).map(([from,to])=>({from,to,label:'next'})),vars:ptrNames.map(k=>[k,nameAddr(b.vars[k])]),focus:b.focus};
 const targetReached=reach.path.join('')==='ANBC'&&reach.cycle===null;
 const dropdown=(id,arr,selected)=>`<select id="${id}">${arr.map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('')}</select>`;
 return titleBlock('指针沙盒','亲手把 23 插入 12 与 37 之间。选择等号两边，执行一次写入，再从 head 走一遍。')+`<div class="sandbox">${stage(frame,'可写内存','固定四个对象 · 示意地址')}${nodeRead}
 <div class="ctrls"><label for="lhs">写入位置</label>${dropdown('lhs',exprs,lhs)}<span>=</span><label for="rhs" class="sr">读取表达式</label>${dropdown('rhs',[...exprs,'nullptr'],rhs)}${btn('执行这一行','id="assign"','primary')}${btn('撤销一步',`id="undo" ${historyBox.length===1?'disabled':''}`)}${btn('回到初态','id="boxReset"')}</div>
 <div class="scratch-msg" role="status">${esc(boxError||b.last)}</div><div class="readout"><div class="study"><h3>沿 head 行走</h3><p>${reach.path.map(k=>payload[k]).concat([reach.cycle!==null?`再次遇到 ${payload[reach.cycle]}（有环）`:'nullptr']).join(' → ')}</p><span class="progress-note">${targetReached?'已完成插入，四个结点各经过一次。':`从 head 可达 ${reach.path.length} / 4 个结点。`}</span></div><div class="study"><h3>读写顺序</h3><p>先求右边表达式的值，再写入左边的变量或字段。尝试把两次赋值调换顺序，检查哪一个地址被覆盖。</p></div></div></div>`;
}
function assign(){
 const old=historyBox.at(-1),b=structuredClone(old);
 function resolve(expr){const [v,field]=expr.split('->');if(field&&b.vars[v]===null)throw new Error(`${v} 当前是 nullptr，无法访问 ${expr}。本次写入已拦住。`);return field?[b.next,b.vars[v]]:[b.vars,v]}
 try{
  let val=null;if(rhs!=='nullptr'){const [container,key]=resolve(rhs);val=container[key]}
  const [container,key]=resolve(lhs);const was=container[key];container[key]=val;
  b.focus=[...(lhs.includes('->')?[key]:[]),...(val===null?[]:[val])];b.last=`${lhs} = ${rhs};　${lhs} 的值由 ${nameAddr(was)} 变为 ${nameAddr(val)}。`;
  historyBox.push(b);boxError='';
 }catch(e){boxError=e.message}
 renderBody()
}
