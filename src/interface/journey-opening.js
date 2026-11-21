(function(){

const control=(op,value,label,extra='')=>`<button type="button" data-op="${op}" data-v="${esc(value)}" ${extra}>${esc(label)}</button>`;
const char=i=>String.fromCharCode(65+i);
function pairs(n,all){const games=[];for(let i=0;i<n;i++){for(let j=i+1;j<(all?n:Math.min(n,i+2));j++)games.push([i,j])}return games}
function squadFigure(s){
 const coords=Array.from({length:s.n},(_,i)=>{const a=-Math.PI/2+2*Math.PI*i/s.n;return [300+193*Math.cos(a),162+111*Math.sin(a)]});
 const games=pairs(s.n,s.all);
 return `<svg viewBox="0 0 600 328" class="squad-court" role="group" aria-label="队员与本轮对阵关系，点队员查看其场次"><defs><pattern id="floorgrain" width="99" height="18" patternUnits="userSpaceOnUse"><path d="M0 17h99M41 0v17" stroke="#d5b38a" stroke-width=".7" fill="none"/></pattern></defs><rect x="7" y="8" width="586" height="312" rx="14" fill="#f0d5af"/><rect x="7" y="8" width="586" height="312" rx="14" fill="url(#floorgrain)"/><g fill="none" stroke="#fcf2d8" stroke-width="2"><path d="M35 31H565V297H35zM300 31v266"/><circle cx="300" cy="164" r="43"/><path d="M35 109h58v110H35m530-110h-58v110h58"/></g>${games.map(([i,j])=>{const on=i===s.pick||j===s.pick;return `<path d="M${coords[i]} L${coords[j]}" stroke="${on?'#695394':'#8d785b'}" stroke-opacity="${on?'.88':'.33'}" stroke-width="${on?3:1.6}" fill="none"/>`}).join('')}${coords.map(([x,y],i)=>`<g transform="translate(${x} ${y})" data-op="pick" data-v="${i}" role="button" tabindex="0" aria-label="查看队员 ${char(i)} 的对阵"><circle r="23" fill="transparent"/><circle cy="3" r="15" fill="#8f6945"/><circle r="15" fill="${i===s.pick?'#463c70':'#fdf7e9'}" stroke="#70614d"/><text y="5" text-anchor="middle" fill="${i===s.pick?'white':'#403b45'}" font-size="16">${char(i)}</text></g>`).join('')}</svg>`;
}
JOURNEY[1]={
 title:'排一场轮转赛',invite:'自己定人数和赛制。加入一名队员，看看你得多排几场。',form:'排赛',related:['loop-count','recursive-stack'],
 initial:()=>({n:5,all:true,pick:0,note:''}),
 act(s,op,val){
  if(op==='count'){const n=Math.max(2,Math.min(12,s.n+Number(val)));const diff=pairs(n,s.all).length-pairs(s.n,s.all).length;return {...s,n,pick:Math.min(s.pick,n-1),note:`从 ${s.n} 人改为 ${n} 人，这次${diff>=0?'增加':'减少'} ${Math.abs(diff)} 场。`}}
  if(op==='rule')return {...s,all:val==='all',note:''};
  if(op==='pick')return {...s,pick:Number(val),note:''};
  return s;
 },
 view(s){const games=pairs(s.n,s.all),partners=games.filter(p=>p.includes(s.pick)).map(([i,j])=>char(i===s.pick?j:i));
  return {scene:squadFigure(s),controls:`<div class="control-line"><b>${s.n} 名队员</b>${control('count','-1','减一人',s.n===2?'disabled':'')}${control('count','1','加一人',s.n===12?'disabled':'')}</div><div class="control-line">${control('rule','all','每两人打一场',`aria-pressed="${s.all}"`)}${control('rule','relay','仅相邻者交手',`aria-pressed="${!s.all}"`)}</div>`,caption:`${s.note}共 ${games.length} 场。队员 ${char(s.pick)} 的对手是 ${partners.join('、')}。`,
   math:s.all?`T(n) = 1 + 2 + … + (n−1) = n(n−1)/2；T(${s.n}) = ${games.length}`:`T(n) = n−1；T(${s.n}) = ${games.length}`,
   cpp:s.all?'for (int i = 0; i < n; ++i)\n    for (int j = i + 1; j < n; ++j)\n        schedule(i, j);':'for (int i = 0; i + 1 < n; ++i)\n    schedule(i, i + 1);',
   why:'一条线就是一次排赛。把登记一场的代价当作常数，全员两两交手需要 Θ(n²) 次登记，相邻交手需要 Θ(n) 次；两种规则安排的赛事也不同。',
   challenge:'先设四人，猜全员增加到八人时场数会不会正好翻两倍。再只数新增队员带来的边，解释为什么。'};
 }
};
const styles={'快跑':{fill:'#e68c6c',mark:'快'},'慢跑':{fill:'#b6abd7',mark:'慢'},'走路':{fill:'#80b4a0',mark:'走'}};
function numberSec(text){const n=Number(text);return Number.isInteger(n)&&n>=1&&n<=180?n:null}
function stripScene(s){
 const total=s.items.reduce((a,x)=>a+x.sec,0);
 let offset=0;
 const track=s.items.map((x,i)=>{const w=532*x.sec/total,left=34+offset;offset+=w;return `<g tabindex="0" role="button" aria-label="选择第 ${i+1} 段 ${x.type} ${x.sec} 秒" data-op="cut" data-v="${i}"><rect x="${left}" y="52" width="${Math.max(.1,w)}" height="62" fill="${styles[x.type].fill}" stroke="#faf4e8"/>${w>34?`<text text-anchor="middle" x="${left+w/2}" y="89">${styles[x.type].mark}</text>`:''}</g>`}).join('');
 const cells=Array.from({length:s.cap},(_,i)=>{let x=34+(i%8)*67,y=159+Math.floor(i/8)*52,v=s.items[i];return `<g ${i<=s.items.length?`tabindex="0" role="button" data-op="cut" data-v="${i}" aria-label="选择下标 ${i}"`:''}><rect x="${x}" y="${y}" width="60" height="34" rx="5" fill="${v?styles[v.type].fill:'#fffaf0'}" stroke="${i===s.pos?'#47376c':'#b4a693'}" stroke-width="${i===s.pos?3:1}" ${v?'':'stroke-dasharray="3 3"'}/><text x="${x+30}" y="${y+23}" text-anchor="middle">${v?v.sec+'s':'空'}</text><text x="${x+28}" y="${y+47}" text-anchor="middle" font-size="11">${i}</text></g>`}).join('');
 return `<svg viewBox="0 0 600 ${s.cap>8?279:234}" role="group" aria-label="按时间比例的训练带与底层等宽存储槽"><rect x="7" y="6" width="586" height="97%" rx="13" fill="#f1e8d8"/><text x="34" y="36" fill="#65594e">训练时间　${total} 秒</text>${track||'<text x="34" y="88">训练带为空</text>'}<text x="34" y="146" fill="#65594e">缓冲区 ${s.buffer}　·　${s.cap} 个槽</text>${cells}</svg>`;
}
JOURNEY[2]={
 title:'剪一条间歇训练带',invite:'给自己排一段快慢相间的训练。点中段落选插入位置，再把新动作放进去。',form:'时间剪辑',related:['vector-insert','vector-grow'],
 initial:()=>({items:[{type:'快跑',sec:15},{type:'慢跑',sec:30},{type:'快跑',sec:15},{type:'走路',sec:20}],cap:4,buffer:1,pos:1,kind:'快跑',secs:15,note:'四个槽刚好装满。试着在第二段前再插一段。',stats:null,op:'idle'}),
 act(s,op,val,fields){
  const i=s.pos,n=s.items.length;
  if(Object.hasOwn(styles,fields.kind))s={...s,kind:fields.kind,secs:fields.seconds??s.secs};
  if(op==='cut'){const p=Math.max(0,Math.min(n,Number(val)));return {...s,pos:p,op:'idle',stats:null,note:p===n?'剪口在末尾。':`剪口在第 ${p+1} 段前。`}}
  if(op==='appendpos')return {...s,pos:n,op:'idle',stats:null,note:'下一段将放在末尾。'};
  if(op==='insert'){
   const sec=numberSec(fields.seconds),type=fields.kind;
   if(sec===null||!Object.hasOwn(styles,type))return {...s,note:'请填入 1 到 180 的整数秒数并选择动作。'};
   if(n>=16)return {...s,note:'剪辑台最多展示 16 段。可以先取走一段。'};
   const grow=n===s.cap,items=s.items.slice();items.splice(i,0,{type,sec});const stats={n,i,copy:grow?n:0,shift:n-i};
   return {...s,items,cap:grow?s.cap*2:s.cap,buffer:s.buffer+(grow?1:0),kind:type,secs:sec,op:'insert',stats,note:`已在下标 ${i} 插入 ${sec} 秒${type}。${grow?`换到缓冲区 ${s.buffer+1}，先复制 ${n} 段，再`:'在当前缓冲区'}右移 ${n-i} 段。`};
  }
  if(op==='remove'&&i<n){const items=s.items.slice();items.splice(i,1);return {...s,items,pos:Math.min(i,items.length),op:'remove',stats:{n,i,copy:0,shift:n-i-1},note:`取走第 ${i+1} 段，其后 ${n-i-1} 段左移一格。`}}
  return s;
 },
 view(s){const n=s.items.length,a=s.stats,remove=s.op==='remove';
  return {scene:stripScene(s),controls:`<div class="control-line"><label>动作 <select name="kind">${Object.keys(styles).map(k=>`<option ${k===s.kind?'selected':''}>${k}</option>`).join('')}</select></label><label>秒数 <input type="number" name="seconds" min="1" max="180" value="${esc(s.secs)}"></label>${control('insert','','插进剪口',n>=16?'disabled':'')}</div><div class="control-line">${control('appendpos','','选末尾')}${control('remove','','取走选中段',s.pos>=n?'disabled':'')}</div>`,caption:s.note,
   math:a?`原长度 n = ${a.n}，下标 i = ${a.i}。额外复制 ${a.copy} 段，${remove?'左':'右'}移 ${remove?'n−i−1':'n−i'} = ${a.shift} 段。`:`0 ≤ i = ${s.pos} ≤ size = ${n} ≤ capacity = ${s.cap}`,
   cpp:remove?'for (int j = i; j + 1 < size; ++j)\n    a[j] = a[j+1];\n--size;':'if (size == capacity) growAndCopy();  // 容量翻倍\nfor (int j = size; j > i; --j)\n    a[j] = a[j-1];\na[i] = segment;\n++size;',
   why:'上排宽度代表持续时间；下排每个槽存一条等大小的记录。此实现先扩容复制，再在新缓冲区内右移。已知下标的读取是 O(1)，中间插入最坏 O(n)，连续尾插在倍增策略下均摊 O(1)。',
   challenge:'让相同的 15 秒快跑分别插在已满训练带的开头和末尾。两次都要复制，为什么右移次数会不同？再在有空槽时重复。'};
 }
};

})();
