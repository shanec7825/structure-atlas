(() => {
  'use strict';
  const button = (op, label, value = '', options = '') =>
    '<button type="button" data-op="'+esc(op)+'" data-v="'+esc(value)+'" '+options+'>'+esc(label)+'</button>';
  const nav = (s) => '<div class="fin-nav">'+button('prev','上一步','',s.pos===0?'disabled':'')+
    '<span>'+(s.pos+1)+' / '+s.frames.length+'</span>'+button('next','下一步','',s.pos===s.frames.length-1?'disabled':'')+
    (s.pos<s.frames.length-2 ? button('end','看结果') : '')+'</div>';
  function navigate(s,op) {
    if (!['next','prev','end'].includes(op)) return null;
    const pos=op==='end'?s.frames.length-1:s.pos+(op==='next'?1:-1);
    return {...s,pos:Math.max(0,Math.min(s.frames.length-1,pos)),error:''};
  }
  const priority = (a,b) => a.p>b.p || a.p===b.p && a.id<b.id;
  const sampleRequests = [{id:0,name:'键盘返听',p:3},{id:1,name:'主唱话筒',p:7},{id:2,name:'和声轨',p:3}];
  function heapFrame(a,note,code,focus=[],sent='') {return {a:a.slice(),note,code,focus,sent};}
  function heapTrace(source,op,entry) {
    const a=source.slice(),f=[];
    const add=(note,code,focus=[],sent='')=>f.push(heapFrame(a,note,code,focus,sent));
    if(op==='add'){
      let i=a.length;a.push(entry);
      add('「'+entry.name+'」先占最后一个槽。新出现的违例只可能发生在它与父结点之间。','heap.push_back(job); i = heap.size()-1;',[i]);
      while(i>0){
        const p=Math.floor((i-1)/2),up=priority(a[i],a[p]);
        add('比较「'+a[i].name+'」和父结点「'+a[p].name+'」。'+(up?'子结点应先处理。':'父结点仍应先处理，上滤停止。'),
          'p = (i-1)/2; if (!before(heap[i], heap[p])) break;',[i,p]);
        if(!up) break;
        [a[i],a[p]]=[a[p],a[i]];
        add('交换两项，「'+entry.name+'」往舞台顶端升一层。','std::swap(heap[i],heap[p]); i=p;',[p,i]);
        i=p;
      }
    }else{
      const winner=a[0];
      if(a.length===1){a.pop();add('调度「'+winner.name+'」，待处理的请求已清空。','out=heap.front(); heap.pop_back();',[],winner.name);return f;}
      a[0]=a.pop();
      add('调度「'+winner.name+'」。把最后的请求临时放在根，接下来修复堆序。','out=heap.front(); heap[0]=heap.back(); heap.pop_back(); i=0;',[0],winner.name);
      let i=0;
      while(2*i+1<a.length){
        const left=2*i+1,right=left+1,c=right<a.length && priority(a[right],a[left])?right:left;
        add('在现有孩子中选出「'+a[c].name+'」，它最有资格向上移动。','c=2*i+1; if (c+1<n && before(heap[c+1],heap[c])) ++c;',[i,left,...(right<a.length?[right]:[])],winner.name);
        if(!priority(a[c],a[i])){add('「'+a[i].name+'」可以留在原位，下滤结束。','if (!before(heap[c],heap[i])) break;',[i,c],winner.name);break;}
        [a[i],a[c]]=[a[c],a[i]];
        add('提升「'+a[i].name+'」，原来的根沿这一支继续向下。','std::swap(heap[i],heap[c]); i=c;',[i,c],winner.name);i=c;
      }
    }
    return f;
  }
  const heapInitial=()=>({frames:[heapFrame([sampleRequests[1],sampleRequests[0],sampleRequests[2]],'舞台上有三个请求。若只按到达次序，键盘返听先处理；按紧急程度，主唱话筒先处理。','// before(a,b): a.p>b.p || (a.p==b.p && a.id<b.id)')],pos:0,seq:3,name:'',p:'5',selected:null,history:[],error:''});
  function heapAct(s,op,v,fields={}){
    s={...s,name:String(fields.request??s.name),p:String(fields.urgency??s.p)};
    const moved=navigate(s,op);if(moved)return moved;
    if(op==='inspect')return {...s,selected:Number(v),error:''};
    const a=s.frames[s.pos].a;
    if(!['add','pop'].includes(op))return s;
    if(s.pos!==s.frames.length-1)return {...s,error:'先走完这次调整，或点“看结果”。'};
    if(op==='pop'&&!a.length)return {...s,error:'没有待处理的请求。'};
    const name=s.name.trim(),p=Number(s.p);
    if(op==='add'&&(!name||Array.from(name).length>12||!s.p.trim()||!Number.isInteger(p)||p<0||p>9))return {...s,error:'给请求取 1–12 字的名字，紧急度填 0–9 的整数。'};
    if(op==='add'&&a.length>=15)return {...s,error:'舞台有 15 个请求位，先调度一个。'};
    const frames=heapTrace(a,op,{id:s.seq,p,name});
    return {...s,frames,pos:0,seq:s.seq+(op==='add'?1:0),selected:null,name:op==='add'?'':s.name,
      history:op==='pop'?[...s.history,a[0].name]:s.history,error:''};
  }
  function heapView(s){
    const f=s.frames[s.pos],a=f.a,choice=a.find(x=>x.id===s.selected);
    const fifo=a.slice().sort((x,y)=>x.id-y.id);
    const rows=a.length?Math.floor(Math.log2(a.length))+1:1, rigWidth=Math.max(250,(2**(rows-1))*99+12);
    const position=i=>{const row=Math.floor(Math.log2(i+1)),first=2**row-1;return [((i-first+.5)/2**row)*rigWidth,37+row*75];};
    const lines=a.slice(1).map((_,n)=>{const i=n+1,[x,y]=position(i),[px,py]=position((i-1)>>1);return '<path d="M'+px+' '+py+' L'+x+' '+y+'"/>';}).join('');
    const nodes=a.map((job,i)=>{const [x,y]=position(i),n=Array.from(job.name),short=n.length>5?n.slice(0,4).join('')+'…':job.name;
      return '<g class="fin-job '+(f.focus.includes(i)?'focus':'')+'" role="button" tabindex="0" data-op="inspect" data-v="'+job.id+'" aria-label="'+esc(job.name+'，紧急度 '+job.p+'，槽 '+i)+'" transform="translate('+x+' '+y+')"><title>'+esc(job.name)+'</title><rect x="-42" y="-23" width="84" height="46" rx="9"/><text class="fin-priority" text-anchor="middle" y="-3">'+job.p+'</text><text class="name" text-anchor="middle" y="15">'+esc(short)+'</text></g>';
    }).join('');

    const fig='<div class="fin fin-stage"><p class="fin-source">调度顺位 <span>数字为紧急度</span></p><div class="fin-pan"><svg class="fin-rig" style="height:'+(rows*75)+'px;--rig-width:'+rigWidth+'px" viewBox="0 0 '+rigWidth+' '+(rows*75)+'" role="group" aria-label="现场请求的二叉堆"><g class="fin-lines">'+lines+'</g>'+nodes+'</svg></div>'+
      (!a.length?'<p>舞台暂时安静。加入一个请求。</p>':'')+
      (choice?'<p>'+esc(choice.name)+' · 紧急度 '+choice.p+' · 第 '+(choice.id+1)+' 个到达</p>':'')+
      '<div class="fin-strip"><span>按到达顺序</span> '+(fifo.length?fifo.map(x=>esc(x.name)).join('　›　'):'空')+'</div>'+
      (s.history.length?'<div class="fin-strip"><span>已调度</span> '+s.history.map(x=>esc(x)).join('　›　')+'</div>':'')+'</div>';
    const locked=s.pos!==s.frames.length-1;
    return {scene:fig,controls:nav(s)+'<div class="fin-inputs"><label>请求名<input name="request" maxlength="24" value="'+esc(s.name)+'" placeholder="例如：贝斯返听"></label><label>紧急度<input name="urgency" type="number" min="0" max="9" step="1" value="'+esc(s.p)+'"></label>'+button('add','加入请求','',locked?'disabled':'')+button('pop','调度堆顶','',locked||!a.length?'disabled':'')+'</div>',
      caption:s.error||f.note,math:'先比较紧急度，平局先到者优先。当前 '+a.length+' 项，槽 i 的孩子是 2i+1 和 2i+2。',cpp:f.code,
      why:'舞台架的层级对应完全二叉树的数组位置。每次操作结束，父请求都优先于孩子；兄弟之间不必全局有序。看堆顶 Θ(1)，插入与删除的堆序调整 O(log n)。',
      challenge:'为两位乐手各加一个同为 9 的请求。先预测谁先上场，再连调度两次验证。'};
  }
  JOURNEY[10]={title:'音乐节调度台',invite:'一位歌手要换话筒，一位贝斯手要返听。让最急的请求先上台。',form:'现场调度',related:['heap-up','heap-down','leftist-meld'],initial:heapInitial,act:heapAct,view:heapView};

  const rhythmTokens=text=>{
    const s=String(text??'').trim().normalize('NFC');
    return !s?[]:/[\s,，]/u.test(s)?s.split(/[\s,，]+/u).filter(Boolean):Array.from(s);
  };
  function rhythmTrace(text,pattern){
    const pi=Array(pattern.length).fill(0),frames=[],matches=[];
    for(let i=1,k=0;i<pattern.length;i++){
      while(k>0 && pattern[i]!==pattern[k])k=pi[k-1];
      if(pattern[i]===pattern[k])++k;
      pi[i]=k;
    }
    const add=(i,j,note,code,ti=-1,pj=-1)=>frames.push({i,j,matches:matches.slice(),note,code,ti,pj});
    add(0,0,'从第一格开始比对。匹配指针 j 表示动机开头已有几格吻合。','std::size_t i=0, j=0;');
    if(!pattern.length){
      for(let i=0;i<=text.length;i++)matches.push(i);
      add(0,0,'空动机占零格，所以每个边界都能放下它。','if (m==0) for (size_t b=0; b<=n; ++b) emit(b);');
      return {pi,frames};
    }
    for(let i=0,j=0;i<text.length;){
      const ti=i,pj=j;
      if(text[i]===pattern[j]){
        ++i;++j;
        add(i,j,'「'+text[ti]+'」对上了，两支游标一起前进。','++i; ++j;',ti,pj);
        if(j===pattern.length){
          const begin=i-j;matches.push(begin);j=pi[j-1];
          add(i,j,'在第 '+(begin+1)+' 格找到动机。留下 '+j+' 格可复用的后缀，还能继续找重叠。','emit(i-m); j=pi[m-1];',ti,pj);
        }
      }else if(j>0){
        j=pi[j-1];
        add(i,j,'这一格没有对上，作品游标留在原位。动机退回 '+j+' 格已匹配前缀。','j=pi[j-1]; // i stays',ti,pj);
      }else{
        ++i;add(i,0,'动机开头也没有对上，跳到作品的下一格。','++i; // j==0',ti,0);
      }
    }
    add(text.length,frames.at(-1).j,'已经读完整段作品，共发现 '+matches.length+' 处。','// i == n; all occurrences have been reported');
    return {pi,frames};
  }
  function rhythmState(source,motif,origin){
    const text=rhythmTokens(source),pattern=rhythmTokens(motif),{pi,frames}=rhythmTrace(text,pattern);
    return {source,motif,text,pattern,pi,frames,pos:0,origin,error:''};
  }
  function importRhythm(ctx){
    const voices=(ctx?.voices||[]).filter(v=>v===0||v===1||v===2);
    return (voices.length?voices.slice(0,48):[0,1,0,1,0,2]).map(v=>'咚啪嚓'[v]).join(' ');
  }
  function rhythmInitial(ctx){
    const source=importRhythm(ctx),tokens=rhythmTokens(source);
    return rhythmState(source,tokens.slice(0,Math.min(3,tokens.length)).join(' '),ctx?.personal?'我的录音':'示例鼓点');
  }
  function rhythmAct(s,op,v,fields={},ctx={}){
    let source=String(fields.source??s.source),motif=String(fields.motif??s.motif);
    s={...s,source,motif};
    const moved=navigate(s,op);if(moved)return moved;
    if(op==='record')source=importRhythm(ctx);
    if(op!=='record'&&op!=='search')return s;
    const text=rhythmTokens(source),pattern=rhythmTokens(motif);
    if(text.length>48||pattern.length>16||[...text,...pattern].some(t=>Array.from(t).length>14))return {...s,error:'作品最多 48 格，动机最多 16 格。每个符号最多 14 个字符。'};
    const origin=op==='record'?(ctx.personal?'我的录音':'示例鼓点'):source===s.text.join(' ')||text.join('\0')===s.text.join('\0')?s.origin:'自写作品';
    return rhythmState(source,motif,origin);
  }
  const drumVoices = new Map([
      ['0',0],['咚',0],['底鼓',0],
      ['1',1],['哒',1],['啪',1],['军鼓',1],
      ['2',2],['嚓',2],['踩镲',2]
  ]);
  function audibleMotif(text,pattern){
    const map = new Map(drumVoices);
    const vocabulary = new Set([...text,...pattern]);
    // Reserve conventional sounds first, regardless of where they occur in the score.
    const used = new Set([...vocabulary].filter(t=>map.has(t)).map(t=>map.get(t)));
    const free = [0,1,2].filter(v=>!used.has(v));
    for(const token of vocabulary){
      if(!map.has(token) && free.length)map.set(token,free.shift());
    }
    return pattern.every(t=>map.has(t)) ? pattern.map(t=>map.get(t)) : null;
  }
  function rhythmView(s){
    const f=s.frames[s.pos],m=s.pattern.length,covered=new Set();
    f.matches.forEach(start=>{for(let k=0;k<m;k++)covered.add(start+k);});
    const row=(tokens,active,score)=>tokens.map((t,k)=>
      '<span class="fin-bead '+(k===active?'active ':'')+(score&&covered.has(k)?'matched':'')+'" data-voice="'+(drumVoices.get(t)??'custom')+'"><small>'+(k+1)+'</small><b>'+esc(t)+'</b></span>').join('');
    const range=f.matches.map(n=>m?String(n+1):String(n)).join('、');
    const hits=audibleMotif(s.text,s.pattern);
    const audition = m && f.matches.length ? (hits ?
      '<button type="button" data-audition="'+hits.join(',')+'">试听命中音型</button>' :
      '<p>三种鼓声已分配完，这个动机含有尚未配音的符号。</p>') : '';
    return {scene:'<div class="fin fin-score"><p class="fin-source">'+esc(s.origin)+(f.ti>=0?'　<span>本次比对第 '+(f.ti+1)+' 格</span>':'')+'</p><div class="fin-staff">'+(row(s.text,f.ti,true)||'<em>空作品</em>')+'</div><div class="fin-motif"><span>动机</span><div class="fin-staff">'+(row(s.pattern,f.pj,false)||'<em>空串 ε</em>')+'</div></div>'+
      '<p class="fin-hitlist">'+(m?'已命中起始格（从 1 起）':'已命中边界（从 0 起）')+'　'+(range||'尚无')+'</p>'+
      audition+'</div>',
      controls:nav(s)+'<div class="fin-inputs"><label>作品（空格分词，连续文字逐字）<input name="source" value="'+esc(s.source)+'" maxlength="720"></label><label>想找的动机<input name="motif" value="'+esc(s.motif)+'" maxlength="230"></label>'+button('search','重新查找')+button('record','载入'+(s.origin==='我的录音'?'我的':'录音台')+'鼓点')+'</div>',
      caption:s.error||f.note,math:'已消费 i='+f.i+' 格，匹配长度 j='+f.j+'。前缀函数 π=['+s.pi.join(', ')+']。',cpp:f.code,
      why:'每格是一枚符号，查找按符号原文比较。失配时复用最长相等真前后缀，已读作品不用倒带。预处理 O(m)，扫描 O(n)，另计输出量。试听时，0 或咚是底鼓，1、哒或啪是军鼓，2 或嚓是踩镲。自写符号按整段中的出现次序各取一种剩余音色，分完即止。',
      challenge:'把作品改成「咚 咚 咚 咚」，动机改成「咚 咚」。先画出所有重叠的位置，再试着把动机清空。'};
  }
  JOURNEY[11]={title:'给节奏找签名',invite:'挑出一句想记住的鼓点，在整段作品中找齐它的每一次出现。',form:'动机采样',related:['kmp-prefix','kmp-match','rolling-match'],initial:rhythmInitial,act:rhythmAct,view:rhythmView};

  const metricNames={quick:'完整快排',select:'快速选位',shell:'希尔排序'};
  function scoreTrace(values,mode,k,pivotRule) {
    const a=values.map((v,id)=>({v,id})),frames=[],placed=new Set();
    let comparisons=0,swaps=0,pivot=null,gap=null,span=null,answer=null;
    const add=(note,code,focus=[])=>frames.push({a:a.slice(),placed:[...placed],comparisons,swaps,pivot,gap,span:span&&span.slice(),answer,note,code,focus});
    const swap=(i,j,note,code)=>{
      if(i===j)return;
      [a[i],a[j]]=[a[j],a[i]];++swaps;add(note,code,[i,j]);
    };
    add('每条成绩带着原始字母。即使数值相同，也能跟踪同一条记录。','// a contains records in input order');
    function partition(lo,hi){
      span=[lo,hi];const at=pivotRule==='middle'?lo+Math.floor((hi-lo)/2):hi;
      pivot=a[at];
      add('本段从第 '+(lo+1)+' 格到第 '+(hi+1)+' 格，选「'+String.fromCharCode(65+pivot.id)+'」的 '+pivot.v+' 为基准。','pivot=a[chosen];',[at]);
      swap(at,hi,'先把所选基准暂放段尾。','std::swap(a[chosen],a[hi]);');
      let wall=lo;
      for(let j=lo;j<hi;j++){
        ++comparisons;
        const smaller=a[j].v<pivot.v;
        add(a[j].v+(smaller?' < ':' ≥ ')+pivot.v+(smaller?'，它属于较小的一侧。':'，这一轮留在较大或相等的一侧。'),'if (a[j].value < pivot.value) { /* extend left partition */ }',[j,hi]);
        if(smaller){
          swap(wall,j,'把这条较小记录放到左区末端。','std::swap(a[wall],a[j]);');
          ++wall;
        }
      }
      if(wall!==hi){[a[wall],a[hi]]=[a[hi],a[wall]];++swaps;}
      placed.add(wall);
      add('基准落在第 '+(wall+1)+' 格。它左侧较小，右侧大于或等于它。','std::swap(a[wall],a[hi]); return wall;',[wall]);
      return wall;
    }
    if(mode==='shell'){
      for(gap=Math.floor(a.length/2);gap>0;gap=Math.floor(gap/2)){
        add('把间隔改成 '+gap+'，只在同一条间隔跑道里做插入。','for (gap=n/2; gap>0; gap/=2)');
        for(let i=gap;i<a.length;i++){
          for(let j=i;j>=gap;j-=gap){
            ++comparisons;
            const out=a[j-gap].v>a[j].v;
            add('隔 '+gap+' 格比 '+a[j-gap].v+' 和 '+a[j].v+'。'+(out?'顺序相反，需要交换。':'已经有序，这一项停在这里。'),
              'if (a[j-gap].value <= a[j].value) break;',[j-gap,j]);
            if(!out)break;
            swap(j-gap,j,'较小记录沿这条跑道向左移一个间隔。','std::swap(a[j-gap],a[j]);');
          }
        }
      }
      gap=null; a.forEach((_,i)=>placed.add(i));
    } else if(mode==='quick') {
      function sort(lo,hi){
        if(lo>hi)return;
        if(lo===hi){placed.add(lo);return;}
        const p=partition(lo,hi);sort(lo,p-1);sort(p+1,hi);
      }
      sort(0,a.length-1);
      pivot=null;span=null;
    }else{
      let lo=0,hi=a.length-1;
      while(lo<=hi){
        if(lo===hi){answer=a[lo];placed.add(lo);span=[lo,hi];break;}
        const p=partition(lo,hi);
        if(p===k-1){answer=a[p];break;}
        if(k-1<p)hi=p-1;else lo=p+1;
        span=[lo,hi];pivot=null;
        add('目标名次只可能在第 '+(lo+1)+' 至 '+(hi+1)+' 格；另一段不用排序。','if (k-1<p) hi=p-1; else lo=p+1;');
      }
      pivot=null;
    }
    const done=mode==='select'?(answer?'第 '+k+' 项的数值是 '+answer.v+'。其余位置无需全部排好。':'空样本没有可选名次。'):'所有样本已按数值非降序排列。';
    add(done,mode==='select'?(answer?'return a[k-1].value;':'// no element to select'):'// finished: a is in nondecreasing order',answer?[k-1]:[]);
    return frames;
  }
  function sortState(values,mode,k,rule,unit,origin){
    const all=Object.fromEntries(Object.keys(metricNames).map(m=>[m,scoreTrace(values,m,k,rule)]));
    const totals=Object.fromEntries(Object.entries(all).map(([m,frames])=>{const f=frames.at(-1);return [m,[f.comparisons,f.swaps]];}));
    return {values,raw:values.join(' '),mode,rule,k,rank:String(k),origin,unit,pos:0,frames:all[mode],totals,error:''};
  }
  const sortInitial=()=>sortState([12,9,12,8,11,10],'quick',3,'last','秒','示例跑步成绩');
  function sortAct(s,op,v,fields={},ctx={}){
    const raw=String(fields.values??s.raw),rank=String(fields.rank??s.rank),rule=String(fields.pivot??s.rule)==='middle'?'middle':'last';
    s={...s,raw,rank,draftRule:rule};const moved=navigate(s,op);if(moved)return moved;
    if(!['run','median','reverse','ties','beats','race'].includes(op))return s;
    let values=[],unit=s.unit,origin=s.origin;
    if(op==='beats'){
      const valid=(ctx.gaps||[]).filter(x=>Number.isFinite(x)&&x>0);
      if(!valid.length)return {...s,error:'录音台暂时没有可导入的间隔。'};
      values=valid.slice(0,16);unit='毫秒';origin=(ctx.personal?'我的鼓点间隔':'示例鼓点间隔')+(valid.length>16?'（前 16 拍）':'');
    }else if(op==='race'){
      values=[12,9,12,8,11,10];unit='秒';origin='示例跑步成绩';
    }else{
      const parts=raw.trim()?raw.trim().split(/[\s,，]+/u):[];
      if(parts.length>16||parts.some(n=>!/^\d+(?:\.\d+)?$/u.test(n)||!Number.isFinite(Number(n))||Number(n)>1000000))
        return {...s,error:'请输入最多 16 个 0 至 1000000 的数，用空格或逗号隔开。'};
      values=parts.map(Number);
      if(values.join(',')!==s.values.join(','))origin='自编样本';
      if(op==='reverse'){values.sort((a,b)=>b-a);origin+=' · 逆序';}
      if(op==='ties'){
        if(!values.length)values=[10,10];
        else if(values.length===1)values.push(values[0]);
        else values[1]=values[0];
        origin+=' · 同值';
      }
    }
    let k=Number(rank);
    const mode=op==='median'?'select':op==='run'&&Object.hasOwn(metricNames,v)?v:s.mode;
    if(op==='median'||op==='beats'||op==='race')k=Math.max(1,Math.ceil(values.length/2));
    if(mode==='select'&&op!=='beats'&&op!=='race'&&(!values.length||!Number.isInteger(k)||k<1||k>values.length))
      return {...s,error:'快速选位需要至少一个样本，且 k 为 1 至样本数之间的整数。'};
    if(!Number.isInteger(k)||k<1||k>values.length)k=Math.max(1,Math.ceil(values.length/2));
    return sortState(values,mode,k,rule,unit,origin);
  }
  function sortView(s){
    const f=s.frames[s.pos],max=Math.max(1,...s.values),rule=s.draftRule||s.rule;
    const bars=f.a.map((x,i)=>'<div class="fin-lane '+(f.focus.includes(i)?'active ':'')+(f.placed.includes(i)?'placed':'')+'"><span>'+String.fromCharCode(65+x.id)+'</span><div class="fin-meter"><i style="--width:'+(100*x.v/max)+'%"></i></div><b>'+esc(x.v)+'</b></div>').join('');
    const detail=Object.entries(s.totals).map(([m,[c,w]])=>'<tr><th>'+metricNames[m]+(m==='select'?'（k='+s.k+'）':'')+'</th><td>'+c+'</td><td>'+w+'</td></tr>').join('');
    return {scene:'<div class="fin fin-timing"><p class="fin-source">'+esc(s.origin)+' · '+esc(s.unit)+'</p><div class="fin-lanes">'+(bars||'<em>空样本</em>')+'</div><div class="fin-strip"><span>'+metricNames[s.mode]+'</span>本步累计 '+f.comparisons+' 次键比较，'+f.swaps+' 次交换'+(f.pivot?'　基准 '+esc(f.pivot.v):'')+(f.gap?'　间隔 '+f.gap:'')+'</div></div>',
      controls:nav(s)+'<div class="fin-inputs fin-sort-params"><label>样本（'+esc(s.unit)+'）<input name="values" value="'+esc(s.raw)+'" maxlength="280"></label><label>第 k 项<input name="rank" type="number" min="1" max="16" value="'+esc(s.rank)+'"></label><label>基准槽<select name="pivot"><option value="last" '+(rule==='last'?'selected':'')+'>末尾</option><option value="middle" '+(rule==='middle'?'selected':'')+'>中间</option></select></label></div><div class="fin-methods"><fieldset class="fin-actions"><legend>排好所有记录</legend>'+button('run','完整快排','quick')+button('run','希尔排序','shell')+'</fieldset><fieldset class="fin-actions"><legend>只查一个位置</legend>'+button('run','选第 k 项','select')+button('median','选下中位数')+'</fieldset></div><details class="fin-extra"><summary>换一组样本或比较总开销</summary><div class="fin-actions">'+button('beats','导入鼓点间隔')+button('race','载入成绩示例')+button('reverse','构造逆序')+button('ties','构造同值')+'</div><table><caption>本组输入完整运行后的实际计数</caption><thead><tr><th>算法</th><th>键比较</th><th>不同槽交换</th></tr></thead><tbody>'+detail+'</tbody></table></details>',
      caption:s.error||f.note,math:s.mode==='select'?'零基目标下标 k−1='+String(s.k-1)+'；偶数样本取排序后较小的中央项作为下中位数。':s.mode==='shell'?'间隔序列从 ⌊n/2⌋ 开始，每轮整除 2，最后的间隔为 1。':'每次划分后，基准左侧 < 它，右侧 ≥ 它。递归处理两个子段。',
      cpp:f.code,why:(s.unit==='毫秒' && s.origin.includes('鼓点') ?
        '每项是一个拍子自带的播放停留，重接链表时随拍子移动。原录音末拍的循环收尾也在样本内。手动停录时取最后一击到停录之间的等待，录满 16 击时取末两击间隔，收尾至少 70 毫秒。示例使用预设时值。' : '')+
        '每条跑道是一条数值记录，字母标出它最初的身份。只统计两条记录的键比较与不同槽之间的交换。互异键且输入顺序均匀随机或基准均匀随机时，快排期望 O(n log n)，快速选择期望 O(n)。两者最坏 O(n²)；全等键下本二路划分总把基准放在左端，随机换基准也无济于事。这里的折半间隔希尔排序最坏 O(n²)。',
      challenge:'导入你录下的鼓点间隔，选出下中位数作为这段节奏的典型停顿。再比较同一批数完全排好需要额外做哪些操作。'};
  }
  JOURNEY[12]={title:'终点线的名次',invite:'自己编一组成绩，或带上录音台的拍间时距。只挑出中间一项，需要排完整队吗？',form:'成绩策展',related:['sort-partition','sort-insertion','sort-stable-merge'],initial:sortInitial,act:sortAct,view:sortView};
})();
