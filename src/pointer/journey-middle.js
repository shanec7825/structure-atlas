(() => {
  'use strict';
  const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const str = (n,d=2) => Number(n.toFixed(d));
  const action = (op, text, options = {}) => '<button type="button" data-op="'+op+'"'+
    (options.v===undefined?'':' data-v="'+safe(options.v)+'"')+(options.disabled?' disabled':'')+
    (options.pressed===undefined?'':' aria-pressed="'+Boolean(options.pressed)+'"')+'>'+safe(text)+'</button>';
  const affordance = (op,v,label,pressed) => 'data-op="'+op+'" data-v="'+safe(v)+'" tabindex="0" role="button" aria-label="'+safe(label)+'"'+(pressed===undefined?'':' aria-pressed="'+Boolean(pressed)+'"');
  const svg = (label,box,body) => '<svg xmlns="http://www.w3.org/2000/svg" class="jm-canvas" viewBox="'+box+'" role="group" aria-label="'+safe(label)+'" style="display:block;width:100%;height:auto"><style>.jm-canvas text{font-family:system-ui,\'Microsoft YaHei\',sans-serif}.jm-canvas [data-op]{cursor:pointer;outline:none}.jm-canvas .jm-focus{opacity:0;pointer-events:none}.jm-canvas [data-op]:focus-visible .jm-focus{opacity:1}.jm-canvas [data-op]:hover .jm-rim{stroke-width:3.3}</style>'+body+'</svg>';
  const txt = (x,y,t,attrs='') => '<text x="'+x+'" y="'+y+'" '+attrs+'>'+safe(t)+'</text>';
  const row = content => '<div class="jm-actions" style="display:flex;align-items:center;flex-wrap:wrap;gap:.55rem">'+content+'</div>';

  // A single authored sequence feeds two independent readers: last-in-first-out and first-in-first-out.
  const base=22;
  const nameOf=n=>'ABCDE'[n%5]+(5-Math.floor(n/5));
  const pos=n=>[66+(n%5)*105+(Math.floor(n/5)%2)*10,48+Math.floor(n/5)*53];
  function canReach(a,b){return a!==b && Math.abs(a%5-b%5)<=1 && Math.abs(Math.floor(a/5)-Math.floor(b/5))<=1;}
  const wallColor=[['#c85d4b','#f7966e','#ffd19b'],['#315b74','#6bacc1','#a5d9d9'],['#6b6b39','#b0b262','#dedf98'],['#7b5579','#b78eb3','#dec3cf']];
  function climbingScene(s){
    const path=[base,...s.route],last=path.at(-1),chosen=new Set(path);
    const coords=path.map(n=>pos(n).join(',')).join(' ');
    const holds=[
      ['M-18 6Q-21-2-15-7Q-7-11 7-13Q17-13 19-5Q20 3 12 8Q0 14-11 12Z','M-17 2Q-17-5-11-8Q0-13 10-11Q17-9 16-5Q14 0 4 3Q-7 8-15 5Z','M-13-6Q-3-11 7-11'],
      ['M-19 5Q-22-1-16-7L4-15Q11-17 16-10L20-2Q21 2 17 6L0 12Q-12 15-19 5Z','M-17 1L-11-6 5-13Q10-14 14-8L15-4 2 2-8 4Z','M-12-5 4-12 9-12'],
      ['M-20-1Q-16-13-8-13Q-4-12 1-8L10-10Q18-9 20-2Q20 9 9 12L-6 12Q-19 10-20-1Z','M-18-2Q-14-11-8-11L-1-6 10-8Q16-7 17-3Q11 2 3 2L-10 5Q-17 5-18-2Z','M-15-6Q-10-13-6-9'],
      ['M-17 5Q-22-7-12-11Q1-14 14-8Q21-4 18 3Q15 12 3 13Q-12 13-17 5Z','M-17-1Q-16-10-7-10Q6-12 14-6Q19-4 14 0L5 3-8 5Q-15 5-17-1Z','M-12-7Q-3-12 7-8']
    ];
    let rock='';
    for(let n=0;n<25;n++){
      const [x,y]=pos(n),reach=canReach(last,n),c=wallColor[(n*3+Math.floor(n/5))%4],t=(n*31)%42-19;
      const shape=holds[(n+Math.floor(n/5))%holds.length];
      const active=n===last;
      rock+='<g '+affordance('hold',n,'岩点 '+nameOf(n)+(active?'，当前岩点':reach?'，可伸手抵达':'，超出一步范围'))+'>'+
        '<circle cx="'+x+'" cy="'+y+'" r="24" fill="transparent"/>'+
        (reach?'<circle cx="'+x+'" cy="'+y+'" r="20.5" stroke="#fff9d4" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>':'')+
        '<g transform="translate('+x+' '+y+') rotate('+t+')">'+
        '<path d="'+shape[0]+'" fill="#38383b" opacity=".39" transform="translate(2 4.5)"/>'+
        '<path class="jm-rim" d="'+shape[0]+'" fill="'+c[0]+'" stroke="'+c[0]+'" stroke-width="1.3"/>'+
        '<path d="'+shape[1]+'" fill="'+c[1]+'"/><path d="'+shape[1]+'" fill="url(#jm-grip-sand)"/>'+
        '<path d="'+shape[2]+'" fill="none" stroke="'+c[2]+'" stroke-width="2.2" stroke-linecap="round"/>'+
        '<circle cx="7" cy="-4" r="2.8" fill="#685f57"/><path d="M5.7 -4l2.2 -.5" stroke="#ddd1b7" stroke-width=".8"/></g>'+
        txt(x+21,y+15,nameOf(n),'font-size="11" fill="#30373d" font-weight="'+(chosen.has(n)?'800':'600')+'"')+
        (active?'<circle cx="'+x+'" cy="'+y+'" r="22" fill="none" stroke="#f7efba" stroke-width="3.5"/>':'')+
        '<circle class="jm-focus" cx="'+x+'" cy="'+y+'" r="24" stroke="#171d32" fill="none" stroke-width="3"/></g>';
    }
    const [lx,ly]=pos(last);
    const rope='<g fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="'+coords+'" stroke="#4b4140" stroke-opacity=".7" stroke-width="6.6"/><polyline points="'+coords+'" stroke="#ffcc58" stroke-width="4.5"/><polyline points="'+coords+'" stroke="#fff7ba" stroke-width="2.3" stroke-dasharray="2 7"/></g>';
    const peek=(arr)=>arr.length?arr.slice(0,3).map(nameOf).join('  '):'空';
    const p=s.read,stk=s.route.slice(0,s.route.length-p).reverse(),queue=s.route.slice(p);
    return svg('攀岩编线墙与两个取步器','0 0 570 345',
      '<defs><pattern id="jm-grip-sand" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1.3" r=".7" fill="#fff9dd" opacity=".5"/><circle cx="4.5" cy="6.2" r=".55" fill="#49383d" opacity=".64"/><circle cx="6.8" cy="3" r=".55" fill="#fff9dd" opacity=".45"/></pattern><pattern id="jm-wall-pits" width="24" height="21" patternUnits="userSpaceOnUse"><circle cx="5" cy="4" r="1.3" fill="#dddaca"/><circle cx="5" cy="3.5" r="1.05" fill="#75827a"/><path d="M12 11l3-1m4 7 .7-.3" stroke="#fff5d7" stroke-width=".8" opacity=".55"/></pattern><linearGradient id="jm-rail" x2="0" y2="1"><stop stop-color="#586570"/><stop offset=".35" stop-color="#3d5158"/><stop offset="1" stop-color="#2b3843"/></linearGradient></defs>'+
      '<rect x="6" y="8" width="558" height="278" rx="18" fill="#675944"/><rect x="7" y="5" width="556" height="277" rx="18" fill="#bb9872" stroke="#8b7456"/><rect x="10" y="5" width="550" height="274" rx="16" fill="#a9b9b4"/>'+
      '<path d="M10 83L104 7H236L149 94L104 172L10 198Z" fill="#b9c6b9"/><path d="M242 7h166l-59 72-112 59-37 -55z" fill="#899fa5"/>'+
      '<path d="M10 229l150-74 87 1 96 122H23q-13 0-13-12z" fill="#91a9a2"/><path d="M559 93l-102 59-42 124h133q11 0 11-13z" fill="#b5beb0"/>'+
      '<rect x="11" y="7" width="548" height="269" rx="15" fill="url(#jm-wall-pits)" opacity=".67"/><g fill="none" stroke-linejoin="round"><path d="M14 118l97-22 89-89M154 278l42-87 83-41 62-96 63-46M402 279l36-85 117-85" stroke="#dbe0ce" stroke-width="2"/><path d="M14 116l97-22 89-89M154 276l42-87 83-41 62-96 63-46M402 277l36-85 117-85" stroke="#6e8587" stroke-width="1.6"/></g>'+
      [[22,21],[548,20],[23,264],[545,264]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3.4" fill="#647877"/><path d="M'+(x-1.4)+' '+(y+.4)+'l3-1" stroke="#d1d6c8"/>').join('')+
      rope+rock+'<g pointer-events="none"><path d="M'+(lx-6)+' '+(ly+10)+' q-9 9 0 14 q7 3 11-4" fill="none" stroke="#403e45" stroke-width="4"/><path d="M'+(lx-6)+' '+(ly+10)+' q-9 9 0 14 q7 3 11-4" fill="none" stroke="#ffe7a0" stroke-width="2"/></g>'+
      '<rect x="9" y="291" width="552" height="47" rx="11" fill="#29343a"/><rect x="9" y="289" width="552" height="47" rx="11" fill="url(#jm-rail)"/><path d="M285 297v31" stroke="#7e8e8c"/>'+
      txt(23,307,'下一次撤步','font-size="11" fill="#d5e2dd"')+txt(23,326,peek(stk),'font-size="15" fill="#fff0a9" font-weight="750"')+
      txt(300,307,'下一次回放','font-size="11" fill="#d5e2dd"')+txt(300,326,peek(queue),'font-size="15" fill="#e5f7ed" font-weight="750"'));
  }
  JOURNEY[4]={
    title:'攀岩路线编演',invite:'从亮圈里选一块岩点，为队友编一条能爬、能回放的路线。',form:'攀岩编线',related:['stack-top','ring-queue','recursive-stack'],
    initial:()=>({route:[],read:0,note:'从 C1 出发。虚线圈内都能到，可斜走、可折返。'}),
    act(s,op,v){
      if(op==='hold'){
        const n=Number(v),last=s.route.at(-1)??base;
        if(!Number.isInteger(n)||n<0||n>24||!canReach(last,n)) return {...s,note:'每步只能伸手到相邻的一块岩点。看当前岩点周围的虚线亮圈。'};
        if(s.route.length>=40)return {...s,note:'这块编线板最多记录 40 步。可以撤掉末步，或开始两种方向的回放。'};
        return {route:[...s.route,n],read:0,note:'已接上 '+nameOf(n)+'，同时进入栈顶和队尾。'};
      }
      if(op==='undo'&&s.route.length)return {route:s.route.slice(0,-1),read:0,note:'撤掉最后加入的 '+nameOf(s.route.at(-1))+'，可从上一块岩点改走另一条线。'};
      if(op==='compare'&&s.read<s.route.length){
        const n=s.route.length-1-s.read,m=s.read;
        return {...s,read:m+1,note:'第 '+(m+1)+' 次取出：撤步栈弹出 '+nameOf(s.route[n])+'（原第 '+(n+1)+' 步），回放队列取出 '+nameOf(s.route[m])+'（原第 '+(m+1)+' 步）。'};
      }
      if(op==='rewind')return {...s,read:0,note:'两份回放重新装入你写的完整路线，可以从第一个动作重新比较。'};
      return s;
    },
    view(s){
      const n=s.route.length,p=s.read,names=s.route.map(nameOf);
      const preceding=p?('上次取出为 '+nameOf(s.route[n-p])+' / '+nameOf(s.route[p-1])):'尚未取出';
      return {scene:climbingScene(s),controls:row(action('compare','同时取一步',{disabled:p>=n})+action('undo','撤销末步',{disabled:!n})+action('rewind','回放归零',{disabled:!p})),
        caption:s.note,math:'原路线 '+(names.join(' → ')||'空')+'。已从两份副本各取 '+p+'/'+n+' 步。'+preceding+'。',
        cpp:'// 每次攀到一个新点，分别记入两份结构\nbacktrack.push(hold); replay.push(hold);\n// 两份结构均非空时各取一步\nauto a = backtrack.top(); backtrack.pop();\nauto b = replay.front();  replay.pop();',
        why:'一条绳上的动作按添加顺序记录。复盘撤退时先撤最新一步，队友照谱攀爬时先走最早一步。各取 k 步后，剩余数都为 n−k，但下一步位置分别是原序列的 n−k−1 和 k（从 0 起算）。单次栈顶或队首操作为 O(1)。',
        challenge:'编一条至少五步的路线，让两台取步器的第一个结果不同、第三个结果相同。再试一条非空路线，使每次取出的岩点都相同。'};
    }
  };

  // Each merge keeps the user's ordering. Ties and deliberately non-greedy choices remain visible.
  function forest(s){
    const freq=new Map();for(const ch of s.score)freq.set(ch,(freq.get(ch)||0)+1);
    const pool=new Map([...freq].map(([symbol,w],k)=>['l'+k,{id:'l'+k,symbol,w,left:null,right:null,height:0}]));
    let roots=[...pool.values()],cost=0;
    s.merges.forEach(([a,b],i)=>{
      const l=roots.find(n=>n.id===a),r=roots.find(n=>n.id===b);if(!l||!r||l===r)return;
      const node={id:'m'+i,w:l.w+r.w,left:l,right:r,height:1+Math.max(l.height,r.height)};
      cost+=node.w;pool.set(node.id,node);roots=roots.filter(n=>n!==l&&n!==r);roots.push(node);
    });
    const order=(a,b)=>a.w-b.w||a.id.localeCompare(b.id);
    const weights=[...freq.values()].sort((a,b)=>a-b);let optimal=0;
    while(weights.length>1){const w=weights.shift()+weights.shift();optimal+=w;weights.push(w);weights.sort((a,b)=>a-b);}
    if(freq.size===1)optimal=weights[0];
    const codes=new Map();
    function visit(node,bits){if(!node.left){codes.set(node.symbol,bits||'0');return;}visit(node.left,bits+'0');visit(node.right,bits+'1');}
    if(roots.length===1)visit(roots[0],'');
    return {freq,pool,roots,cost,optimal,codes,light:[...roots].sort(order).slice(0,2).map(r=>r.id)};
  }
  function applyMerge(s,pair,method){
    const f=forest(s),l=f.roots.find(n=>n.id===pair[0]),r=f.roots.find(n=>n.id===pair[1]);
    if(!l||!r||l===r)return s;
    const score=s.score,merges=[...s.merges,[l.id,r.id,method]],ready=f.roots.length===2;
    return {...s,score,merges,sel:[],note:'合并权重 '+l.w+' 和 '+r.w+'，新结点重 '+(l.w+r.w)+'。'+(ready?'整棵树完成，你的乐句已经可以编码。':'左边记 0，右边记 1。')};
  }
  function codingScene(s,f){
    const roots=f.roots, coords=new Map(),nodes=[],links=[];
    let count=0;const leafX=i=>f.freq.size===1?280:53+i*(452/(f.freq.size-1));
    function place(n){
      let x;if(n.left){const l=place(n.left),r=place(n.right);x=(l+r)/2;}else{x=leafX(count++);}
      coords.set(n.id,[x,213-n.height*41]);return x;
    }
    roots.forEach(place);
    function draw(n){
      const [x,y]=coords.get(n.id),root=roots.includes(n),selected=s.sel.includes(n.id);
      if(n.left){[n.left,n.right].forEach((kid,index)=>{
        const [kx,ky]=coords.get(kid.id),mx=(x+kx)/2,my=(y+ky)/2;
        links.push('<path d="M'+x+' '+y+' C'+x+' '+(y+13)+' '+kx+' '+(ky-16)+' '+kx+' '+ky+'" fill="none" stroke="'+(index?'#c49bbb':'#91b9bf')+'" stroke-width="2.5"/>'+
          '<circle cx="'+mx+'" cy="'+my+'" r="7.1" fill="#242238"/>'+txt(mx,my+3.3,index,'font-size="10" text-anchor="middle" fill="#fff2d4" font-weight="750"'));draw(kid);
      });}
      const leaf=!n.left,fill=selected?'#edac76':leaf?'#49435d':'#746677';
      const code=f.codes.get(n.symbol);
      nodes.push('<g '+(root&&roots.length>1?affordance('select',n.id,(selected?'取消选择':'选择')+(leaf?'音符 '+n.symbol:'合并束')+'，权重 '+n.w,selected):'')+'>'+
        '<rect x="'+(x-23)+'" y="'+(y-17)+'" width="46" height="34" rx="9" fill="transparent"/>'+
        '<rect x="'+(x-22)+'" y="'+(y-11)+'" width="44" height="24" rx="7" fill="#191a29"/>'+
        '<rect class="jm-rim" x="'+(x-22)+'" y="'+(y-14)+'" width="44" height="24" rx="7" fill="'+fill+'" stroke="'+(root?'#e4bd8b':'#9f97a1')+'" stroke-width="'+(root?2:1)+'"/>'+
        txt(x,y+3.1,leaf?n.symbol:n.w,'text-anchor="middle" fill="'+(selected?'#302638':'#f7edcf')+'" font-size="14" font-weight="760"')+
        (leaf?txt(x,y+27,code!==undefined?'×'+n.w+' · '+code:'×'+n.w,'text-anchor="middle" fill="#ede0cd" font-size="12" font-weight="640"'):'')+
        '<rect class="jm-focus" x="'+(x-25)+'" y="'+(y-18)+'" width="50" height="33" rx="8" stroke="#fff1a4" fill="none" stroke-width="2.5"/></g>');
    }
    roots.forEach(draw);
    const headline=roots.length===1?'编码树已接通':'点选两个金边接头';
    return svg('乐句编码接线台','0 0 560 277',
      '<rect x="6" y="8" width="548" height="263" rx="17" fill="#302a41"/><rect x="9" y="5" width="542" height="257" rx="15" fill="#474259"/>'+
      '<rect x="20" y="17" width="520" height="232" rx="10" fill="#282638" stroke="#75677c" stroke-width="1.2"/>'+
      '<path d="M24 59H535 M24 102H535 M24 145H535 M24 188H535 M24 231H535" stroke="#61586c" opacity=".29" stroke-dasharray="2 5"/>'+
      [[16,12],[544,12],[16,254],[544,254]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="2" fill="#baadac"/>').join('')+
      txt(32,41,headline,'fill="#f6dfb8" font-size="14" font-weight="700"')+links.join('')+nodes.join(''));
  }
  const drumSymbols='咚啪嚓', recordedSource='你的鼓点录制';
  const asRhythm=ctx=>(Array.isArray(ctx?.voices)?ctx.voices:[]).filter(v=>[0,1,2].includes(v)).slice(0,32).map(v=>drumSymbols[v]).join('');
  const newScore=(score,source,note)=>({score,draft:score,source,merges:[],sel:[],note});
  function mergeCode(s){
    const last=s.merges.at(-1);
    const snippets=[];
    if(last){
      if(last[2]==='light')snippets.push('// 刚才从当前各束中取出最轻的两束','auto a = popMin(pool), b = popMin(pool);');
      else snippets.push('// 按手选顺序取出当前两束，先选者走左支','auto a = takeRoot("'+last[0]+'");','auto b = takeRoot("'+last[1]+'");');
    }else{
      snippets.push('// 手选两束后的合并；先选者接左支','auto a = takeRoot(firstChoice);','auto b = takeRoot(secondChoice);');
    }
    snippets.push('pool.add(join(a, b, a->weight + b->weight));','// 从根沿左 0 右 1 走到叶，得到对应音符的码字。');
    return snippets.join('\n');
  }
  JOURNEY[5]={
    title:'给你的节奏接一棵编码树',invite:'把自己的乐句接成一棵二叉树，听得多的音可以用更短的编码。',form:'乐句编码',related:['huffman','tree-inorder','binary-bound'],
    initial:ctx=>newScore(asRhythm(ctx)||'咚咚啪咚嚓咚啪',ctx?.personal&&asRhythm(ctx)?recordedSource:'示例节奏','每种音符是一个接头，下面的 × 数是它在乐句中出现的次数。点两束再合并。'),
    act(s,op,v,fields={},ctx){
      if(typeof fields.score==='string')s={...s,draft:fields.score};
      if(op==='draft')return s;
      if(op==='recording'){
        const phrase=ctx?.personal?asRhythm(ctx):'';
        if(!phrase)return {...s,note:'节奏室里暂时没有可载入的个人录音。'};
        return newScore(phrase,recordedSource,'已按最新录音的音色顺序重新统计 '+phrase.length+' 击，并打开一块新的接线台。咚是底鼓，啪是军鼓，嚓是踩镲。');
      }
      if(op==='score'){
        const seq=[...String(s.draft??s.score)].filter(c=>!(/\s/u.test(c)));
        if(!seq.length||seq.length>32||new Set(seq).size>5||seq.some(c=>/[\u0000-\u001f\u007f-\u009f]/u.test(c)))return {...s,note:'请输入 1 至 32 个非空白字符，最多用 5 种不同符号。每个符号按一个 Unicode 码点计。'};
        return newScore(seq.join(''),'手写乐句','载入了 '+seq.length+' 个音符。每一种符号的频数已重新统计。');
      }
      const f=forest(s);
      if(op==='select'&&f.roots.some(n=>n.id===v)&&f.roots.length>1){
        const next=s.sel.includes(v)?s.sel.filter(k=>k!==v):s.sel.length<2?[...s.sel,v]:[s.sel[0],v];
        return {...s,sel:next,note:next.length===2?'两个接头已选中。先选的束接左支 0，后选的接右支 1。':'再选另一束，或让机器合并当前最轻的两束。'};
      }
      if(op==='merge')return applyMerge(s,s.sel,'manual');
      if(op==='light')return applyMerge(s,f.light,'light');
      if(op==='unmerge'&&s.merges.length)return {...s,merges:s.merges.slice(0,-1),sel:[],note:'最后一次合并已拆开，可以换另一对接头。'};
      return s;
    },
    view(s,ctx){
      const f=forest(s),complete=f.roots.length===1,score=[...s.score],fixed=score.length*Math.max(1,Math.ceil(Math.log2(f.freq.size)));
      const code=complete?score.map(ch=>f.codes.get(ch)).join(' '):'',bits=complete?code.replace(/ /g,'').length:0;
      const sounds=score.map(c=>c==='哒'?1:drumSymbols.indexOf(c));
      const drumSounds=sounds.every(v=>v>=0)?sounds.join(','):'';
      return {scene:codingScene(s,f),controls:row('<label>'+safe(s.source||'乐句')+' <input name="score" value="'+safe(s.draft??s.score)+'" aria-label="乐句，最多 32 个音符和 5 种符号" style="max-width:100%;width:12rem"></label>'+action('score','载入乐句')+
        (ctx?.personal&&asRhythm(ctx)?action('recording','载入最新录音'):'')+
        (drumSounds?'<button type="button" data-audition="'+drumSounds+'">等拍试听乐句</button>':''))+
        row(action('merge','合并选中两束',{disabled:s.sel.length!==2})+action('light','合并最轻两束',{disabled:complete})+action('unmerge','拆开上一次',{disabled:!s.merges.length})),
        caption:s.note,
        math:complete?'你的编码（空格仅作分隔）：'+code+'。共 '+bits+' 位；这组频数的最优值 '+f.optimal+' 位，等长编码 '+fixed+' 位。':
          '已有 '+s.merges.length+' 次合并，当前合并权重之和 '+f.cost+'。'+score.length+' 个音符的最优前缀编码为 '+f.optimal+' 位；固定宽度需 '+fixed+' 位。',
        cpp:mergeCode(s),
        why:'音符只放在叶子，所以没有一个码字是另一个的前缀。每合并一对，它们所有叶的深度加一，增加的总位数正好等于新束权重。重复选择最轻两束可使加权路径长度最小。此处单一符号约定用 0 编码；比较仅计乐句位数，未计码表和符号边界元数据。k 种符号用堆建树需 O(k log k)。',
        challenge:'写一个包含四种符号、频数悬殊的乐句。先自己合并，让它比等长编码更长；拆回去，再试着达到面板给出的最优位数。'};
    }
  };

  // Undirected passes cost one. Keep every shortest predecessor so equally short routes can be replayed.
  const playerPos=[[75,144],[187,67],[185,224],[351,68],[349,223],[493,146]];
  const pname=v=>String(v+1)+'号';
  const edgeId=(a,b)=>Math.min(a,b)+'-'+Math.max(a,b);
  function routes(s){
    const adj=Array.from({length:6},()=>[]);s.edges.forEach(e=>{const [a,b]=e.split('-').map(Number);adj[a].push(b);adj[b].push(a);});
    adj.forEach(r=>r.sort((x,y)=>x-y));
    const d=Array(6).fill(-1),prev=Array.from({length:6},()=>[]),q=[s.start];d[s.start]=0;
    for(let i=0;i<q.length;i++)for(const w of adj[q[i]]){
      if(d[w]<0){d[w]=d[q[i]]+1;q.push(w);}
      if(d[w]===d[q[i]]+1)prev[w].push(q[i]);
    }
    const all=[];
    function trace(w,r){if(w===s.start){all.push([s.start,...r]);return;}prev[w].forEach(v=>trace(v,[w,...r]));}
    if(d[s.goal]>=0)trace(s.goal,[]);
    return {dist:d,all,path:all[s.variant%Math.max(1,all.length)]||[]};
  }
  function playScene(s,f){
    const visible=new Set(f.path.slice(1,s.step+1).map((v,i)=>edgeId(f.path[i],v)));
    const strokes=s.edges.map(e=>{
      const [a,b]=e.split('-').map(Number),[x1,y1]=playerPos[a],[x2,y2]=playerPos[b],lit=visible.has(e);
      return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(lit?'#242d55':'#315f60')+'" stroke-width="'+(lit?8:5)+'" stroke-linecap="round"/>'+
        '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(lit?'#ffd26d':'#bbdcce')+'" stroke-width="'+(lit?4.2:2)+'" stroke-linecap="round" '+(lit?'':'stroke-dasharray="5 5"')+'/>';
    });
    const ball=f.path[s.step]??s.start;
    const players=playerPos.map(([x,y],i)=>{
      const home=i===s.start,goal=i===s.goal,sel=i===s.pick,fill=home?'#f8b667':goal?'#acacd9':'#fdf1d4';
      return '<g '+affordance('player',i,pname(i)+(home?'，起点':'')+(goal?'，目标':'')+'，'+({edge:'选作传球路线端点',start:'设为持球起点',goal:'设为接应目标'}[s.mode]))+'>'+
      '<circle cx="'+x+'" cy="'+y+'" r="25" fill="transparent"/>'+
      (sel?'<circle cx="'+x+'" cy="'+y+'" r="25" fill="none" stroke="#ffe081" stroke-dasharray="4 3" stroke-width="3"/>':'')+
      '<ellipse cx="'+(x+1)+'" cy="'+(y+15)+'" rx="18" ry="5.4" fill="#193f39" opacity=".38"/>'+
      '<g transform="translate('+x+' '+y+')"><path d="M-10 -16l-10 5 -4 9 7 4 4 -5 1 20q12 4 24 0l1-20 4 5 7-4 -4-9 -10-5q-10 8-20 0z" fill="#1d5857" transform="translate(1 3)"/>'+
      '<path class="jm-rim" d="M-10 -16l-10 5 -4 9 7 4 4 -5 1 20q12 4 24 0l1-20 4 5 7-4 -4-9 -10-5q-10 8-20 0z" fill="'+fill+'" stroke="#31535c" stroke-width="1.7"/>'+
      '<path d="M-10 -15q10 13 20 0M-11 13q11 2 22 0" fill="none" stroke="#b9a78f" stroke-width="1.5"/><path d="M-18 -6l6 -6m25 0 6 6M-11 -6l1 16" fill="none" stroke="#fff8dd" opacity=".82" stroke-width="1.4"/><path d="M11 -6l-1 16M-19 -1l3 1m33 -1 3 -1" fill="none" stroke="#9a9186" stroke-width="1"/>'+
      txt(0,7,i+1,'text-anchor="middle" fill="#273d4b" font-size="15" font-weight="800"')+'</g>'+
      ((home||goal)?'<rect x="'+(x-(home&&goal?29:17))+'" y="'+(y-38)+'" width="'+(home&&goal?58:34)+'" height="16" rx="5" fill="#244f46" stroke="#82ab8a" stroke-width=".7"/>'+txt(x,y-26.6,home&&goal?'起点 / 目标':home?'起点':'目标','text-anchor="middle" fill="#fffbdb" font-size="10.5" font-weight="700"'):'')+
      '<circle class="jm-focus" cx="'+x+'" cy="'+y+'" r="27" stroke="#fff5a3" fill="none" stroke-width="3"/></g>';
    }).join('');
    const [bx,by]=playerPos[ball];
    return svg('传球战术板，选两件球衣可连接或拆除路线','0 0 570 292',
      '<defs><linearGradient id="jm-turf" x2="1" y2="1"><stop stop-color="#629983"/><stop offset=".48" stop-color="#4d8372"/><stop offset="1" stop-color="#397063"/></linearGradient><pattern id="jm-turf-fiber" width="9" height="8" patternUnits="userSpaceOnUse"><path d="M1 4l.6-1.5m5 4 .5-1.3" stroke="#c8d9af" stroke-width=".6" opacity=".54"/><path d="M4 2l.9-1.1" stroke="#214c42" stroke-width=".7" opacity=".55"/></pattern><pattern id="jm-goal-net" width="3.5" height="3.5" patternUnits="userSpaceOnUse"><path d="M0 0h3.5v3.5" stroke="#ebede0" stroke-width=".65" fill="none"/></pattern></defs>'+
      '<rect x="6" y="8" width="558" height="280" rx="19" fill="#373c3d"/><rect x="7" y="4" width="556" height="280" rx="19" fill="#7a8680" stroke="#4f5d59"/><rect x="11" y="7" width="548" height="271" rx="15" fill="url(#jm-turf)" stroke="#204d42" stroke-width="1.6"/>'+
      [0,1,2,3].map(i=>'<rect x="'+(28+i*130)+'" y="16" width="65" height="250" fill="#a8c39d" opacity=".21"/>').join('')+
      '<rect x="14" y="10" width="542" height="266" rx="13" fill="url(#jm-turf-fiber)"/>'+
      '<g fill="none" stroke="#e1e8d4" stroke-width="2" opacity=".85"><rect x="24" y="19" width="522" height="244" rx="2"/><path d="M285 19v244"/><circle cx="285" cy="141" r="42"/><path d="M24 82h56v117H24m522-117h-56v117h56M24 110h18v61H24m522-61h-18v61h18"/><path d="M80 112q32 29 0 58m410-58q-32 29 0 58M24 31q12-1 12-12m498 0q0 12 12 12M24 251q12 1 12 12m498 0q0-12 12-12"/></g>'+
      '<g fill="url(#jm-goal-net)" stroke="#d6dfce" stroke-width="1.5"><path d="M24 125h-9v32h9zM546 125h9v32h-9z"/></g><g fill="#e0e4cf"><circle cx="285" cy="141" r="2.5"/><circle cx="63" cy="141" r="1.7"/><circle cx="507" cy="141" r="1.7"/></g>'+
      strokes.join('')+players+'<g pointer-events="none" transform="translate('+(bx+19)+' '+(by+14)+')"><circle r="9.2" fill="#ffe6a1" stroke="#50453e" stroke-width="1.4"/><path d="M-3 -1l2-3 4 1 1 4-4 2zM-8 -3l2-3 2 .3-.4 2.4zM6 -5l1.7 1.5.9 2.7-2 .4zM-3 7l2 1.2 3 -.5-.7-1.4z" fill="#615348"/><path d="M-4 -4l2.5 1M3 -2l3 -1M0 3l-.1 3" stroke="#887852" stroke-width=".6"/></g>');
  }
  JOURNEY[6]={
    title:'画一套传球战术',invite:'点两件球衣连线，再点同一对拆线。让球用最少的传递到达目标。',form:'球场战术板',related:['graph-bfs','graph-dfs','graph-dijkstra'],
    initial:()=>({edges:['0-1','0-2','1-3','2-4','3-5','4-5'],start:0,goal:5,mode:'edge',pick:null,variant:0,step:0,note:'1 号开球，6 号接应。现有两条同长的最短传法。'}),
    act(s,op,v){
      if(op==='mode'&&['edge','start','goal'].includes(v))return {...s,mode:v,pick:null,note:{edge:'点两位不同队员。已有的线路会拆除，尚未连通的线路会接通。',start:'点一位队员，把球交给他开场。',goal:'点一位队员，把他设为接应目标。'}[v]};
      if(op==='player'){
        const a=Number(v);if(!Number.isInteger(a)||a<0||a>5)return s;
        if(s.mode!=='edge')return {...s,[s.mode]:a,pick:null,mode:'edge',variant:0,step:0,note:pname(a)+(s.mode==='start'?' 成为开场持球队员。':' 成为接应目标。')+'路线已重新计算。'};
        if(s.pick===null)return {...s,pick:a,note:'已选 '+pname(a)+'。再点另一人，就可以接通或拆掉一条路线。'};
        if(s.pick===a)return {...s,pick:null,note:'已取消端点选择，可以重新选两位队员。'};
        const key=edgeId(s.pick,a),exists=s.edges.includes(key);
        return {...s,edges:exists?s.edges.filter(k=>k!==key):[...s.edges,key],pick:null,step:0,variant:0,note:(exists?'拆掉':'接通')+'了 '+pname(s.pick)+' 和 '+pname(a)+' 之间的双向路线。球回到开场位置。'};
      }
      const f=routes(s);
      if(op==='pass'&&s.step+1<f.path.length)return {...s,step:s.step+1,note:pname(f.path[s.step])+' 将球传给 '+pname(f.path[s.step+1])+'。'+(s.step+2===f.path.length?'已抵达目标。':'')};
      if(op==='variant'&&f.all.length>1)return {...s,variant:(s.variant+1)%f.all.length,step:0,note:'切换到另一条同样短的传法，球回到起点。'};
      if(op==='kickoff')return {...s,step:0,note:'球回到起点，可以再走一次当前最短路线。'};
      return s;
    },
    view(s){
      const f=routes(s),distance=f.dist[s.goal],names=f.path.map(pname),levels=f.dist.map((n,i)=>pname(i)+'='+ (n<0?'∞':n)).join('，');
      return {scene:playScene(s,f),controls:row(action('pass','传下一球',{disabled:s.step+1>=f.path.length})+action('variant','换一条同长传法',{disabled:f.all.length<2})+action('kickoff','球回起点',{disabled:!s.step}))+
        row([['edge','连线 / 拆线'],['start','换起点'],['goal','换目标']].map(([v,t])=>action('mode',t,{v,pressed:s.mode===v})).join('')),
        caption:s.note,math:distance<0?'当前不可达。各队员距起点的传球数：'+levels+'。':
          '最少 '+distance+' 次，共 '+f.all.length+' 种最短传法。当前第 '+(s.variant%f.all.length+1)+' 种：'+names.join(' → ')+'。已传 '+s.step+' 次。',
        cpp:'dist[start] = 0; q.push(start);\nwhile (!q.empty()) {\n    int v = q.front(); q.pop();\n    for (int w : adj[v]) {\n        if (dist[w] == -1) { dist[w] = dist[v]+1; q.push(w); }\n        if (dist[w] == dist[v]+1) pred[w].push_back(v);\n    }\n}',
        why:'每条无向边代表一次允许的传球，传球次数相同。BFS 用队列逐层传播，第一次发现队员时就确定最少传球数。保留所有从上一层进入的前驱，就能还原并列最短传法。本例固定六人；BFS 本身耗时 O(V+E)，列出全部最短路线的成本另计。同一人作起点和目标需要 0 次传球。',
        challenge:'保持起点与目标不同，设计恰好三条长度为 2 的最短路线。只拆一条边让答案变成两条，再把接应者与全队隔开，观察不可达时的距离。'};
    }
  };
})();
