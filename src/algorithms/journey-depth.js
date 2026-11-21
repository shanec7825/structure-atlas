(() => {
  'use strict';
  function quiz(ask,choices,answer,why){return {ask,choices,answer,why};}
  const vars = o => Object.entries(o).map(([name,v])=>[name,String(v)]);
  function leftistMeld(){
    const cells={
      A:{key:2,left:'B',right:'C',npl:2},B:{key:7,left:null,right:null,npl:1},
      C:{key:9,left:null,right:null,npl:1},D:{key:4,left:'E',right:null,npl:1},
      E:{key:8,left:null,right:null,npl:1}
    };
    const frames=[],stack=[];
    const npl=id=>id===null?0:cells[id].npl;
    const view=(line,title,note,focus=[],extra={})=>{
      let pos={A:[245,55],B:[90,174],C:[365,175],D:[565,53],E:[650,196]};
      if(cells.D.right==='C')pos={A:[300,52],B:[110,150],D:[550,145],E:[430,246],C:[705,246]};
      if(cells.A.left==='D')pos={A:[400,52],B:[635,146],D:[220,147],E:[85,246],C:[345,246]};
      const nodes=Object.entries(cells).map(([id,x])=>({id,label:'结点 '+id,value:String(x.key),detail:'npl = '+x.npl,x:pos[id][0],y:pos[id][1]}));
      const edges=[];
      for(const [id,c] of Object.entries(cells)){
        if(c.left)edges.push({from:id,to:c.left,label:'L'});
        if(c.right)edges.push({from:id,to:c.right,label:'R'});
      }
      const active=stack.at(-1);
      frames.push({line,title,note,nodes,edges,vars:vars({调用栈:stack.map(x=>x.call).join(' › ')||'空',a:active?.a??'∅',b:active?.b??'∅',...extra}),focus});
    };
    view(-1,'两棵独立的最小左式堆','A 和 D 是两个堆根。这里约定空链接的 npl 为 0，叶结点为 1。');
    function meld(a,b){
      const ctx={a,b,call:(a??'∅')+','+(b??'∅')};stack.push(ctx);
      if(a===null||b===null){
        const root=a??b;
        view(1,'碰到空堆，返回另一棵','这次调用只交回已有根，未创建新结点。',root?[root]:[],{返回:root??'∅'});
        stack.pop();return root;
      }
      if(cells[b].key<cells[a].key){
        [a,b]=[b,a];ctx.a=a;ctx.b=b;
        view(2,'较小的根接手','交换局部指针后，a 指向较小的根 '+a+'。结点仍住在原处。',[a,b]);
      }else view(2,'保留较小的根 '+a,'比较两个根，a 的键已最小，因而能放在合并结果的顶部。',[a,b]);
      view(3,'沿 '+a+' 的右路径递归','先计算 meld(a->right,b)，返回后才向 a->right 写入新根。',[a,...(cells[a].right?[cells[a].right]:[])]);
      const merged=meld(cells[a].right,b);cells[a].right=merged;
      view(3,'把返回值接到 '+a+' 的右侧','递归返回的根是 '+merged+'。当前调用更新自己的右链接，上一层仍在等待。',[a,merged]);
      const left=cells[a].left,right=cells[a].right;
      if(npl(left)<npl(right)){
        [cells[a].left,cells[a].right]=[right,left];
        view(4,'交换 '+a+' 的左右孩子','左边 npl 较短，交换孩子后较短的一侧在右边。键值无需互换。',[a,...[left,right].filter(Boolean)]);
      }else view(4,'孩子的左右次序已满足要求','左 npl '+npl(left)+' ≥ 右 npl '+npl(right)+'，保留两条链接。',[a]);
      cells[a].npl=1+npl(cells[a].right);
      view(5,'重算 '+a+' 的空路径长','右侧是较短侧，1 + npl(right) = '+cells[a].npl+'。',[a]);
      view(6,'交回堆根 '+a,'该子树的堆序和左高右低的 npl 关系均已恢复。',[a],{返回:a});
      stack.pop();return a;
    }
    meld('A','D');
    return {id:'leftist-meld',group:'树与堆',title:'左式堆合并',subtitle:'沿着短右链，把两场演出的等待队列接起来',chapter:'优先级队列 · 左式堆',
      goal:'追踪递归返回值，分清选择较小根、合并右子堆与交换两个孩子的职责。',
      invariant:'完成的子树满足父键不大于孩子，npl(left) ≥ npl(right)。采用 npl(空)=0 时，npl(x)=1+min(npl(left),npl(right))。',
      cost:'右路径结点数等于根的 npl，含 n 个结点时不超过 log₂(n+1)。合并沿两棵堆的右路径，时间与递归栈空间均为 O(log(n₁+1)+log(n₂+1)+1)。',
      boundary:'示例是两棵互不共享结点的最小左式堆，执行破坏式合并。某些教材取空堆 npl 为 −1，所有 npl 数值会平移一位。',
      code:['Node* meld(Node* a, Node* b) {','  if (!a || !b) return a ? a : b;','  if (b->key < a->key) std::swap(a,b);','  a->right = meld(a->right,b);','  if (npl(a->left) < npl(a->right)) std::swap(a->left,a->right);','  a->npl = 1 + npl(a->right);','  return a;','}'],frames,
      quiz:quiz('在 A 的右侧接上 D 之后，为什么还要交换它的两个孩子？',['D 的根键比 A 小','右侧 npl=2，左侧 npl=1，左式性质暂时失效','每次合并都必须无条件交换'],1,'堆序已经满足。调整孩子朝向是为了让右路径保持短，重算后的 A.npl=2。')};
  }

  function rollingMatch(){
    const text='162323',pattern='23',m=2,mod=7,weight=3,frames=[],found=[];
    let h=null,hp=null,window=0,s=null;
    const digest=word=>Array.from(word).reduce((v,ch)=>(10*v+Number(ch))%mod,0);
    function add(line,title,note,focus=[],extra={}){
      const nodes=Array.from(text,(v,i)=>({id:'c'+i,label:'T['+i+']',value:v,
        detail:i>=window&&i<window+m?'当前窗口':'窗口外',x:70+i*132,y:149}));
      frames.push({line,title,note,nodes,edges:[],vars:vars({模式:pattern,模式指纹:hp??'—',窗口指纹:h??'—',哈希窗口:'['+window+','+(window+1)+']',s:s??'—',已命中:found.join('、')||'无',...extra}),focus:focus.map(i=>'c'+i)});
    }
    add(-1,'在六位数字里找 23','每次移动两格宽的窗口。这个很小的模数有意制造碰撞，便于观察。');
    hp=digest(pattern);h=digest(text.slice(0,m));add(0,'两个不同数字串的指纹相同','16 mod 7 和 23 mod 7 都为 2。weight=10 mod 7=3。',[0,1]);
    for(s=0;s<=text.length-m;s++){
      add(2,h===hp?'指纹命中，准备逐字核对':'指纹不同，排除窗口',
        h===hp?'相同指纹只说明它是候选，仍需验证原始字符。':'相同串必有相同指纹；现在无需逐字比较。',[s,s+1]);
      if(h===hp){
        let k=0;add(3,'从第一个字符核对','k 从 0 起计数。',[s],{k});
        while(k<m&&text[s+k]===pattern[k]){
          const pos=s+k;++k;
          add(4,'字符相同，已核对 '+k+' 个','这个字符与模式的相应位置相同，向后一格。',[pos],{k});
        }
        if(k<m)add(4,'出现假阳性','窗口字符 '+text[s+k]+' 与模式字符 '+pattern[k]+' 不同，没有产生真正命中。',[s+k],{k});
        else{found.push(s);add(5,'确认命中下标 '+s,'两个字符都核对成功，才记录窗口起点。',[s,s+1],{k});}
      }
      if(s+m<text.length){
        const out=Number(text[s]),inc=Number(text[s+m]),old=h;
        const base=((h-out*weight)%mod+mod)%mod;
        h=(10*base+inc)%mod;window=s+1;
        add(8,'移出 '+out+'，移入 '+inc,'旧指纹 '+old+' 去掉高位贡献后乘 10，再加新字符得到 '+h+'。此刻 s 仍是旧循环下标，指纹已对应下一窗口。',[s,s+m]);
      }
    }
    s=null;add(10,'返回两个真正匹配的位置','返回的是下标 2、4。开头的 16 虽然指纹相同，但逐字核对已经排除它。');
    return {id:'rolling-match',group:'字符串与算法策略',title:'滚动散列与假阳性',subtitle:'指纹碰巧相同，字符串真的相同吗',chapter:'串 · Karp–Rabin',
      goal:'把窗口从 16 滑到 62，观察指纹的 O(1) 更新，并区分候选命中与逐字确认。',
      invariant:'每轮开始，h 为 T[s..s+m) 的多项式指纹模 M。不同指纹必非同串；相同指纹须逐字核对才能断言相等。',
      cost:'初始化 O(m)，各窗口滚动共 O(n)。若有 c 个候选，逐字核对最坏 O(cm)，总计 O(n+m+cm)，密集碰撞或大量真匹配可能达到 O(nm)。',
      boundary:'本例只处理十进制字符、m=2、非空且 m≤n；digit 将字符转成 0–9，digitHash 按十进制累积再模 7。现实实现要约定空模式并避免乘法溢出。',
      code:['int hp=digitHash(P,2), h=digitHash(T,2), weight=10%7;','for (int s=0; s+2<=n; ++s) {','  if (h == hp) {','    int k=0;','    while (k<2 && T[s+k]==P[k]) ++k;','    if (k==2) found.push_back(s);','  }','  if (s+2<n)','    h=(10*(((h-digit(T[s])*weight)%7+7)%7)+digit(T[s+2]))%7;','}','return found;'],frames,
      quiz:quiz('如果省掉逐字核对，本例会多报告哪个下标？',['0','2','4'],0,'下标 0 开始是 16，它和 23 的指纹同为 2，但首字符不同。')};
  }

  function articulationCut(){
    const graph={A:['B','C','F'],B:['A','D','E'],C:['A','F'],D:['B','E'],E:['B','D'],F:['A','C']};
    const positions={A:[410,51],B:[190,139],C:[505,170],D:[77,246],E:[303,245],F:[715,235]};
    const ids=Object.keys(graph),parent={},dfn={},low={},cut=new Set(),stack=[],frames=[];
    const arcs=ids.flatMap(u=>graph[u].filter(v=>u<v).map(v=>[u,v]));
    let clock=0;
    function add(line,title,note,focus=[]){
      const active=stack.at(-1);
      const nodes=ids.map(id=>({id,label:'顶点 '+id,value:id in dfn?dfn[id]+' / '+low[id]:'—',
        detail:cut.has(id)?'已判割点':id in dfn?'dfn / low':'尚未发现',x:positions[id][0],y:positions[id][1]}));
      const edges=arcs.map(([from,to])=>({from,to,directed:false,label:parent[from]===to||parent[to]===from?'树边':''}));
      frames.push({line,title,note,nodes,edges,vars:vars({DFS栈:stack.map(c=>c.u).join(' › ')||'空',当前顶点:active?.u??'—',父亲:active?.p??'∅',当前树孩子数:active?.child??'—',割点:[...cut].sort().join('、')||'无'}),focus});
    }
    add(-1,'删掉哪一站会把路网拆开','图是连通无向简单图。每个顶点里依次显示发现时间 dfn 与最低可回到的时间 low。把 A 作为 DFS 根。');
    function dfs(u,p){
      const ctx={u,p,child:0};stack.push(ctx);dfn[u]=low[u]=++clock;
      add(1,'发现 '+u,'给 '+u+' 分配发现次序 '+dfn[u]+'，初始 low 与 dfn 相等。',[u]);
      for(const v of graph[u]){
        if(!(v in dfn)){
          parent[v]=u;++ctx.child;
          add(4,v+' 成为 '+u+' 的 DFS 树孩子','记录树边并递归。只有首次发现新顶点才增加孩子数。',[u,v]);
          dfs(v,u);
          const old=low[u];low[u]=Math.min(low[u],low[v]);
          add(6,'回收孩子 '+v+' 的 low','low['+u+'] 由 '+old+' 更新为 min('+old+', '+low[v]+') = '+low[u]+'。',[u,v]);
          if(p!==null&&low[v]>=dfn[u]){
            cut.add(u);
            add(7,u+' 是非根割点','low['+v+']='+low[v]+' ≥ dfn['+u+']='+dfn[u]+'。孩子子树无法绕到 '+u+' 的严格祖先，删除 '+u+' 就会切断这一路。',[u,v]);
          }else{
            add(7,p===null?'根要另作判断':'子树有路绕到祖先',p===null?'即使孩子的 low 不小于根的 dfn，也要等 DFS 完成后数根的树孩子。':'子树能到达当前点的严格祖先，这个孩子没有构成判定 '+u+' 为割点的证据。',[u,v]);
          }
        }else if(v!==p){
          const old=low[u];low[u]=Math.min(low[u],dfn[v]);
          add(9,'查看已访问邻点 '+v,'跳过父边后，以邻点的发现时间更新：min('+old+', '+dfn[v]+') = '+low[u]+'。',[u,v]);
        }
      }
      if(p===null){
        if(ctx.child>=2)cut.add(u);
        add(12,u+' 有 '+ctx.child+' 个 DFS 树孩子','不同 DFS 子树之间没有绕开根的边。根有至少两个树孩子时，删除根会把它们分开。',[u]);
      }
      stack.pop();
    }
    dfs('A',null);
    add(15,'割点为 A 与 B','A 有三个邻点，却只有两个 DFS 树孩子。B 的孩子 D 满足 low[D]=dfn[B]，等号也会判割点。',['A','B']);
    return {id:'articulation-cut',group:'图与散列',title:'DFS 与割点',subtitle:'一座换乘站关闭，哪些站会断开联系',chapter:'图 · 双连通性',
      goal:'观察孩子返回时的 low 值，区分根的树孩子数与普通顶点的祖先回路判定。',
      invariant:'DFS 结束时，low[u] 是从 u 的子树沿树边向下，至多再走一条非树边所能到达的最小发现时间，包含 dfn[u] 本身。',
      cost:'邻接表中每条无向边被考察两次，时间 Θ(V+E)，发现时间、low、标记与递归栈共 O(V) 额外空间。',
      boundary:'这里使用无重边、无自环的无向简单图。一般非连通图要从每个未访顶点启动 DFS。含平行边时应按边 ID 跳过父边，保留另一条平行边。',
      code:['void dfs(Vertex u, Vertex p) {','  dfn[u]=low[u]=++clock; int child=0;','  for (auto v : adj[u]) {','    if (!dfn[v]) {','      parent[v]=u; ++child;','      dfs(v,u);','      low[u]=std::min(low[u],low[v]);','      if (p!=NONE && low[v]>=dfn[u]) cut[u]=true;','    } else if (v!=p) {','      low[u]=std::min(low[u],dfn[v]);','    }','  }','  if (p==NONE && child>=2) cut[u]=true;','}','dfs(A,NONE); // connected example','return cut;'],frames,
      quiz:quiz('根 A 有三个邻点。判定它为割点时，实际应该数什么？',['所有邻点','所有非树边','它在 DFS 树中直接发现的孩子数'],2,'本图 A 的树孩子是 B、C。F 由 C 首先发现，所以 A–F 不增加根的树孩子数。')};
  }
  globalThis.ATLAS.push(leftistMeld(),rollingMatch(),articulationCut());
})();
