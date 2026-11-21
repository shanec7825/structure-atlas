(() => {
  'use strict';
  const lessons = [];
  const strategy = '字符串与算法策略', graph = '图与散列', sort = '查找与排序';
  const cell = (id, label, value, detail, x, y) => ({id, label, value:String(value), detail, x, y});
  const row = i => 83 + i * 158;
  const snap = (line, title, note, nodes, vars = [], focus = [], edges = []) =>
    ({line, title, note, nodes, edges, vars:vars.map(([k,v])=>[k,String(v)]), focus});
  const test = (ask, choices, answer, why) => ({ask, choices, answer, why});
  const add = lesson => lessons.push(lesson);

  add({
    id:'kmp-prefix',group:strategy,title:'手算 KMP 前缀表',subtitle:'让 ababb 的前缀与后缀对齐',
    chapter:'串 · KMP 预处理',goal:'求出每个前缀的最长相等真前后缀长度，跟踪失配时 j 为什么可以跳跃。',
    invariant:'处理 P[i] 前，j 是上一前缀的最长匹配边界长度。失配后，π[j−1] 给出的更短边界仍可能接上 P[i]。真前缀必须短于当前串。',
    cost:'m 个字符的预处理时间 O(m)，前缀表 O(m) 空间。j 的每次回退都抵消了先前的增长。',
    boundary:'这里使用从 0 开始的 π 长度表，π[0] = 0。有些教材的 next 表使用 −1 哨兵，索引含义需先转换。',
    code:['vector<int> pi(P.size(), 0);','for (int i = 1, j = 0; i < m; ++i) {','    while (j > 0 && P[i] != P[j])','        j = pi[j - 1];','    if (P[i] == P[j]) ++j;','    pi[i] = j;','}'],
    frames:(()=>{
      const p='ababb', pi=Array(p.length).fill(0); let j=0;
      const frame=(l,t,s,i,done,ids=[])=>snap(l,t,s,[...p].map((c,k)=>cell('p'+k,'P['+k+']',c,k<=done?'π = '+pi[k]:'π 待定',row(k),143)),
        i===null?[]:[['i',i],['j',j]],ids);
      const out=[frame(-1,'定义一个边界','例如 abab 的前两位和后两位都是 ab，因此它有长度为 2 的边界。图中先列出模式串。',null,-1),
        frame(0,'单字符边界为零','整张表先置零。P[0] 只有一个字符，已可确定 π[0] = 0，其余位置尚待计算。',null,0,['p0'])];
      for(let i=1;i<p.length;i++){
        out.push(frame(1,'处理前缀 '+p.slice(0,i+1),'试着用本轮字符 '+p[i]+' 延长长度为 '+j+' 的候选边界。',i,i-1,['p'+i,'p'+j]));
        while(j>0 && p[i]!==p[j]){
          const old=j; j=pi[j-1];
          out.push(frame(3,'退到更短边界','P['+i+'] 与 P['+old+'] 不同。令 j = π['+(old-1)+'] = '+j+'；i 保持原位。',i,i-1,['p'+i,'p'+j]));
        }
        const old=j,match=p[i]===p[j]; if(match)j++;
        out.push(frame(4,match?'边界延长一格':'没有可延长的边界','本次比较 P['+i+'] 与 P['+old+']，'+(match?'字符相同。':'字符不同，且 j 已为 0。'),i,i-1,['p'+i,'p'+old]));
        pi[i]=j;out.push(frame(5,'填入 π['+i+']','前缀 '+p.slice(0,i+1)+' 的最长相等真前后缀长度为 '+j+'。',i,i,['p'+i]));
      }
      return out;
    })(),
    quiz:test('已知 π[3] = 2。求 ababb 的 π[4] 时，P[4] 与 P[2] 失配，下一次尝试的 j 是多少？',['1','0','2'],1,'取 π[2−1] = π[1] = 0。长度为 2 的已知边界 ab 本身没有非空真边界。')
  });
  add({
    id:'kmp-match',group:strategy,title:'KMP 失配时谁后退',subtitle:'在 aaaab 中寻找 aab',
    chapter:'串 · KMP 模式匹配',goal:'在同一张图上看文本位置 i 与已经匹配的长度 j，解释为何无需倒退文本。',
    invariant:'比较 T[i] 之前，P 的前 j 个字符已与紧邻 i 左侧的 j 个文本字符相同。回退保留其中仍可作为前缀的后缀。',
    cost:'已给定 π 时，匹配耗时 O(n)，工作指针 O(1)；包含预处理则总时间 O(n+m)，表空间 O(m)。',
    boundary:'此片段约定 P 非空，m、n 分别是模式和文本长度，返回首次匹配的 0 基位置，失败返回 −1。空模式可在入口单独返回 0。',
    code:['int j = 0;', 'for (int i = 0; i < n; ++i) {','    while (j > 0 && T[i] != P[j])','        j = pi[j - 1];','    if (T[i] == P[j]) ++j;','    if (j == m) return i - m + 1;','}', 'return -1;'],
    frames:(()=>{
      const t='aaaab',p='aab',pi=[0,1,0];let j=0;
      function frame(l,title,note,i,shift,focus) {
        const nodes=[...t].map((ch,k)=>cell('t'+k,'T['+k+']',ch,'文本串',row(k),80));
        for(let k=0;k<p.length;k++)nodes.push(cell('p'+k,'P['+k+']',p[k],'π = '+pi[k],row(shift+k),210));
        return snap(l,title,note,nodes,[['i',i??'尚未进入'],['j',l<0?'待初始化':j]],focus);
      }
      const out=[frame(-1,'观察模式和文本','上排为文本，下排为模式。模式下方的 π 已预先算好。',null,0,[]),frame(0,'从空前缀出发','已匹配长度 j 为 0。',null,0,[])];
      for(let i=0;i<t.length;i++){
        out.push(frame(1,'比较第 '+(i+1)+' 个文本字符','当前候选起点是 i − j = '+(i-j)+'。观察同一列中的两个字符。',i,i-j,['t'+i,'p'+j]));
        while(j>0&&t[i]!==p[j]){
          const old=j;j=pi[j-1];
          out.push(frame(3,'移动模式，保留文本位置','刚才在模式位置 '+old+' 失配。j 回退到 π['+(old-1)+'] = '+j+'，下一次仍然比较 T['+i+']。',i,i-j,['t'+i,'p'+j]));
        }
        const before=j,shift=i-j,match=t[i]===p[j];if(match)j++;
        out.push(frame(4,match?'接受本次匹配':'跳过此字符','本次比较后，已匹配长度为 '+j+'。',i,shift,['t'+i,'p'+before]));
        if(j===p.length){out.push(frame(5,'找到完整模式','最后一个字符的下标是 '+i+'，首次出现的起点为 '+i+' − '+j+' + 1 = '+(i-j+1)+'。',i,i-j+1,['t2','t3','t4']));break;}
      }
      return out;
    })(),
    quiz:test('匹配到两个 a 后，模式的 b 与文本中的第三个 a 失配。下一步先做什么？',['把 i 退回 0','保持 i，把 j 从 2 改为 1','i 和 j 一起跳过一格'],1,'模式前缀 aa 的最长相等真前后缀是 a。保留这个 a，就可以在同一文本位置继续比较。')
  });
  add({
    id:'union-find-compress',group:graph,title:'并查集压缩查找路径',subtitle:'沿父指针找根，再让整条路直达根',
    chapter:'集合 · 并查集拓展',goal:'看懂 find 如何加快以后的查询，同时保留原先的集合划分。',
    invariant:'每个集合由唯一的根代表，根满足 parent[r] == r。仅将沿途结点的父指针改为同一棵树的根，集合归属保持不变。',
    cost:'本次完整压缩的时间为 O(h)，h 是原路径高度，迭代版额外空间 O(1)。配合按秩或大小合并，一串操作的均摊时间可达 O(α(n))。',
    boundary:'这是 find 的局部片段，合法下标为 0 至 3，父关系是森林。只做这一次查询时，不能把最坏耗时写成 O(1)。',
    code:['int r = x;', 'while (r != parent[r]) r = parent[r];','while (x != r) {','    int up = parent[x];','    parent[x] = r;','    x = up;','}', 'return r;'],
    frames:(()=>{
      const p=[1,2,3,3],pos=[[90,170],[290,85],[490,228],[690,110]];let x=0,r;
      function frame(l,t,s,focus,up) {
        const nodes=p.map((v,k)=>cell('v'+k,'元素 '+k,k,'parent = '+v,...pos[k]));
        const edges=p.flatMap((v,k)=>v===k?[]:[{from:'v'+k,to:'v'+v,label:'父'}]);
        const vars=[['x',x]];if(r!==undefined)vars.push(['r',r]);if(up!==undefined)vars.push(['up',up]);
        return snap(l,t,s,nodes,vars,focus.map(k=>'v'+k),edges);
      }
      const out=[frame(-1,'观察查询路径','从元素 0 沿父指针经过 1、2，最终到达根 3。根的自指写在卡片内。',[0])];
      r=x;out.push(frame(0,'派游标找代表','暂时保留 x，从 r 开始向父结点移动。',[r]));
      while(r!==p[r]){r=p[r];out.push(frame(1,'上移一层','r 现在位于 '+r+'。父数组暂时没有被改写。',[r]));}
      while(x!==r){
        const up=p[x];out.push(frame(3,'暂存原父结点','要改写当前父边，先保留旧方向 '+up+'。',[x,up],up));
        p[x]=r;out.push(frame(4,'直连代表','把 parent['+x+'] 改为 '+r+'。',[x,r],up));
        x=up;out.push(frame(5,'沿旧方向继续','通过刚才保存的 up 进入原路径上的下一站。',[x],up));
      }
      out.push(frame(7,'返回代表 3','再查询 0，只需沿一条父边就能抵达根。',[0,r]));
      return out;
    })(),
    quiz:test('路径压缩完成之后，元素 1 所属的集合发生了什么变化？',['分裂成了单元素集合','仍属于以 3 为代表的集合','成为元素 3 的新根'],1,'压缩仅将元素 1 的父指针直接指向原来的根 3。那棵树仍表示同一组元素。')
  });
  add({
    id:'floyd',group:graph,title:'Floyd 的中转站',subtitle:'逐个开放中间顶点，更新全源最短路矩阵',
    chapter:'图 · 全源最短路径',goal:'看出 k 必须在最外层，以及候选 d[i][k]+d[k][j] 究竟经过哪里。',
    invariant:'完成中转站 k 这一轮后，d[i][j] 表示所有内部顶点均取自 {0,…,k} 的 i 到 j 最短距离。',
    cost:'三层遍历共 O(V³) 时间；距离矩阵 O(V²) 空间，原地更新只用 O(1) 附加标量。',
    boundary:'本例采用有向图，无负环。∞ 参与加法前要跳过；实际整数实现须保证有限距离相加不溢出。负环会让部分顶点对不存在有限最短路。',
    code:['for (int k = 0; k < V; ++k)', '    for (int i = 0; i < V; ++i)', '        for (int j = 0; j < V; ++j) {','            if (d[i][k] == INF || d[k][j] == INF) continue;','            d[i][j] = min(d[i][j], d[i][k] + d[k][j]);','        }'],
    frames:(()=>{
      const d=[[0,4,12],[Infinity,0,3],[2,Infinity,0]],name='ABC',id=(i,j)=>'d'+i+j,fmt=x=>Number.isFinite(x)?String(x):'∞';
      function frame(line,title,note,vars,focus){
        const nodes=d.flatMap((arr,i)=>arr.map((v,j)=>cell(id(i,j),name[i]+' → '+name[j],fmt(v),'距离',[155,400,645][j],[51,148,245][i])));
        return snap(line,title,note,nodes,vars,focus);
      }
      const out=[frame(-1,'先填直接边','行是起点，列是终点。初始时 A→B 为 4，B→C 为 3，C→A 为 2，A→C 为 12；对角线为零。',[],[])];
      for(let k=0;k<3;k++){
        out.push(frame(0,'开放中转站 '+name[k],'本轮允许路径经过 '+name[k]+'。依次考察矩阵中的全部 9 对起终点。',[['k',name[k]]],[id(k,k)]));
        for(let i=0;i<3;i++)for(let j=0;j<3;j++){
          const vars=[['k',name[k]],['i',name[i]],['j',name[j]]],focus=[...new Set([id(i,k),id(k,j),id(i,j)])];
          const a=d[i][k],b=d[k][j],old=d[i][j];
          if(!Number.isFinite(a+b)){out.push(frame(3,'中转的两段尚未接通',name[i]+'→'+name[k]+' 为 '+fmt(a)+'，'+name[k]+'→'+name[j]+' 为 '+fmt(b)+'，跳过这次更新。',vars,focus));continue;}
          d[i][j]=Math.min(old,a+b);
          out.push(frame(4,d[i][j]<old?'发现更短路径':'保留原距离',name[i]+'→'+name[j]+' 比较原距离 '+fmt(old)+' 与经 '+name[k]+' 的 '+a+' + '+b+'，得到 '+d[i][j]+'。',vars,focus));
        }
      }
      return out;
    })(),
    quiz:test('开放 B 作为中转站时，为什么能把 A→C 从 12 改成 7？',['路径 A→B→C 的两段距离为 4 和 3','B 的下标恰好等于 1','A 与 C 的顶点编号之差为 2'],0,'两段已知路径通过同一中转站 B 连接，总长为 7，严格小于原来的直接边权 12。')
  });
  add({
    id:'critical-path',group:graph,title:'找出工程关键路径',subtitle:'正向最早时间与反向最迟时间',
    chapter:'图 · AOE 网与关键活动',goal:'由事件时间计算每项活动可推迟的时长，找出决定总工期的活动。',
    invariant:'按拓扑序求 ve 时，事件要等所有前驱完成，取最大值。逆序求 vl 时，各后继的截止约束都要满足，取最小值。',
    cost:'给定拓扑序和邻接表时，计算事件时间与活动余量共 O(V+E) 时间。事件数组 O(V)，若保存全部活动余量还要 O(E) 空间。',
    boundary:'本例是单源单汇、工期非负的有向无环网。多个源或汇可增设零工期虚拟源汇。事件的时间差和活动的总时差是不同的量。',
    code:['fill(ve.begin(), ve.end(), 0);','for (int u : topo) for (auto [v,w] : adj[u])','    ve[v] = max(ve[v], ve[u] + w);','fill(vl.begin(), vl.end(), ve[sink]);','for (int u : reverseTopo) for (auto [v,w] : adj[u])','    vl[u] = min(vl[u], vl[v] - w);','for (auto [u,v,w] : edges)','    slack[u][v] = vl[v] - w - ve[u];'],
    frames:(()=>{
      const name='ABCD',edges=[[0,1,2],[0,2,3],[1,3,3],[2,3,4]],pos=[[95,150],[395,65],[395,232],[690,150]];
      const ve=[0,0,0,0],vl=[0,0,0,0]; let earlyReady=false,lateReady=false;
      const seen=new Map();
      function frame(line,title,note,k,extra=[]){
        const nodes=pos.map(([x,y],i)=>cell(name[i],'事件 '+name[i],earlyReady?'早 '+ve[i]:'早 ?',lateReady?'迟 '+vl[i]:'迟 待定',x,y));
        const arcs=edges.map(([a,b,w],idx)=>({from:name[a],to:name[b],label:seen.has(idx)?w+' / 余'+seen.get(idx):String(w)}));
        const focus=k===null?[]:edges[k].slice(0,2).map(v=>name[v]);
        return snap(line,title,note,nodes,extra,focus,arcs);
      }
      const out=[frame(-1,'活动画在边上','A 是开工，D 是完工。每条边标注所需时间；只有前驱活动全部结束，事件才会发生。',null)];
      earlyReady=true;out.push(frame(0,'最早时间从零开始','按 A、B、C、D 的顺序检查出边。',null));
      edges.forEach(([a,b,w],k)=>{const old=ve[b];ve[b]=Math.max(old,ve[a]+w);
        out.push(frame(2,'正向检查 '+name[a]+'→'+name[b],'取 max('+old+', '+ve[a]+' + '+w+')，'+name[b]+' 的最早时间为 '+ve[b]+'。',k));});
      lateReady=true;vl.fill(ve[3]);
      out.push(frame(3,'以最早完工时间为期限','工程最短工期为 7，先给每个事件相同的最迟上界 7，再逆序收紧。',null,[['工期',7]]));
      for(const k of [3,2,0,1]){
        const [a,b,w]=edges[k],old=vl[a];vl[a]=Math.min(old,vl[b]-w);
        out.push(frame(5,'反向检查 '+name[a]+'→'+name[b],'取 min('+old+', '+vl[b]+' − '+w+')，'+name[a]+' 最迟可在 '+vl[a]+' 发生。',k));
      }
      edges.forEach(([a,b,w],k)=>{const slack=vl[b]-w-ve[a];seen.set(k,slack);
        out.push(frame(7,'活动 '+name[a]+'→'+name[b]+' 的余量为 '+slack,'最迟开工 '+(vl[b]-w)+' 减去最早开工 '+ve[a]+' 等于 '+slack+'。'+(k===3?'两条零余量活动组成关键路径 A→C→D。':slack===0?'这项活动为关键活动。':'这项活动可以在余量内延后。'),k,[['最早开工',ve[a]],['最迟开工',vl[b]-w],['余量',slack]]));});
      return out;
    })(),
    quiz:test('活动 A→B 工期为 2，ve[A]=0，vl[B]=4。只把这项活动推迟 1 个时间单位开工，总工期会怎样？',['延长 1','仍是 7','缩短 1'],1,'该活动余量是 4 − 2 − 0 = 2。在其余条件不变时，推迟 1 仍赶得上 B 的最迟时间。')
  });
  add({
    id:'recursive-stack',group:strategy,title:'递归如何逐层返回',subtitle:'在调用栈上重建 3 + 2 + 1',
    chapter:'算法基础 · 递归与调用栈',goal:'分辨函数进入、挂起和返回，追踪同名参数 n 在不同栈帧里的值。',
    invariant:'每个挂起的调用保留自己的 n 和返回后要做的加法。只有栈顶调用继续执行，子调用返回后上一层才能相加。',
    cost:'tri(n) 建立 n+1 次调用，时间 O(n)，最大同时存活栈帧数 n+1，辅助空间 O(n)。',
    boundary:'要求 n 为非负整数且结果可由 int 表示。真实实现可能优化代码，此图采用逐次调用的抽象执行模型；过深递归有栈空间限制。',
    code:['int tri(int n) {', '    if (n == 0) return 0;', '    int sub = tri(n - 1);', '    return n + sub;', '}'],
    frames:(()=>{
      const stack=[],out=[];
      function frame(line,title,note,result){
        const nodes=stack.map((f,i)=>cell('f'+f.n,'tri('+f.n+')',f.stage,f.sub!==null?'sub = '+f.sub:'n = '+f.n,105+i*190,145));
        const edges=nodes.slice(1).map((n,i)=>({from:nodes[i].id,to:n.id,label:'调用'}));
        const vars=stack.length?[['栈深',stack.length],['栈顶 n',stack.at(-1).n]]:[['栈深',0]];
        if(result!==undefined)vars.push(['返回值',result]);
        return snap(line,title,note,nodes,vars,stack.length?[nodes.at(-1).id]:[],edges);
      }
      out.push(frame(-1,'外部准备调用 tri(3)','尚未进入函数。每个方框将代表一次独立调用；最新的一帧在右侧。'));
      for(let n=3;n>=0;n--){
        if(stack.length)stack.at(-1).stage='等待';
        stack.push({n,sub:null,stage:'执行'});
        out.push(frame(0,'进入 tri('+n+')','为这次调用建立新的参数 n = '+n+'。'));
        if(n>0){out.push(frame(2,'需要子问题的结果','tri('+n+') 即将调用 tri('+(n-1)+')。当前 sub 尚未取得初值。'));}
      }
      let result=0;out.push(frame(1,'到达基例','n 为 0，返回表达式给出 0。',result));
      while(stack.length>1){
        stack.pop();const top=stack.at(-1);top.stage='继续';top.sub=result;
        out.push(frame(2,'回到 tri('+top.n+')','子调用已退出。把返回的 '+result+' 存入这一帧的 sub。'));
        result+=top.n;out.push(frame(3,'算出本层返回值','这一层计算 '+top.n+' + '+top.sub+' = '+result+'，准备退出。',result));
      }
      stack.pop();out.push(frame(-1,'回到最外层调用者','最后一帧退出。调用者获得 6。',result));
      return out;
    })(),
    quiz:test('tri(1) 刚返回 1，恢复执行 tri(2)。此时该帧中的 n 和 sub 分别是多少？',['n=1，sub=2','n=2，sub=1','n=3，sub=1'],1,'tri(2) 挂起时一直保存着自己的 n=2。现在子调用的返回值 1 被赋给它的局部变量 sub。')
  });
  add({
    id:'knapsack-01',group:strategy,title:'背包容量为什么倒着扫',subtitle:'在一个数组里保存两层 0/1 背包状态',
    chapter:'算法策略 · 动态规划',goal:'看见倒序更新怎样确保每件物品最多被使用一次。',
    invariant:'处理物品 (w,v) 的容量 j 时，较小下标 j−w 尚未写入本轮，代表只允许使用之前物品的最优值。',
    cost:'n 件物品、容量 W 的时间为 O(nW)，是一种伪多项式算法。一维表辅助空间 O(W)。',
    boundary:'每件物品只能选一次，容量表示“不超过”而非“恰好装满”，所以初值全为零。本例物品重量为正整数、价值非负。',
    code:['vector<int> dp(W + 1, 0);','for (auto [w,v] : items) {','    for (int j = W; j >= w; --j)','        dp[j] = max(dp[j], dp[j - w] + v);','}'],
    frames:(()=>{
      const dp=[0,0,0,0,0],out=[];
      const frame=(l,t,n,vars,ids=[],edges=[])=>snap(l,t,n,dp.map((v,k)=>cell('d'+k,'容量 '+k,l<0?'?':v,'最优价值',row(k),142)),vars,ids,edges);
      out.push(frame(-1,'两件物品，容量为 4','A 重 2、值 3；B 重 3、值 4。每件只有一份。',[]),frame(0,'没有物品时价值为零','不超过任一容量都可以什么也不装。',[]));
      for(const [name,w,v] of [['A',2,3],['B',3,4]]){
        out.push(frame(1,'处理物品 '+name,'从最大容量 4 开始向下扫描。',[['物品',name],['w',w],['v',v]]));
        for(let j=4;j>=w;j--){const old=dp[j],src=dp[j-w];dp[j]=Math.max(old,src+v);
          out.push(frame(3,'更新容量 '+j,'不选得 '+old+'；选它则用旧层容量 '+(j-w)+' 的 '+src+' 加上 '+v+'。两者较大值为 '+dp[j]+'。',[['物品',name],['j',j],['j − w',j-w]],['d'+j,'d'+(j-w)],[{from:'d'+(j-w),to:'d'+j,label:'选入'}]));
        }
      }return out;
    })(),
    quiz:test('如果处理 A 时把 j 改成从小到大，容量 4 的位置会错误得到哪个值？',['6','4','0'],0,'正序先把 dp[2] 更新为 3，再计算 dp[4] = dp[2] + 3，等于把同一件 A 选了两次。')
  });
  add({
    id:'activity-greedy',group:strategy,title:'活动选择的交换思想',subtitle:'每次保留结束最早的可兼容活动',
    chapter:'算法策略 · 贪心',goal:'最大化一个场地中互不重叠的活动数量，并解释局部选择的依据。',
    invariant:'从剩余兼容活动中选最早结束者，总能把某个最优解的下一项换成它；结束时间只会提前，后续活动仍可安排。',
    cost:'本例已按结束时间排序，扫描 O(n)；计入排序为 O(n log n)。扫描只需 O(1) 工作变量，输出所选活动另需 O(k)。',
    boundary:'本例活动采用半开区间 [s,f)，起点等于上一结束时间时兼容。所有活动以个数计分。若活动价值不同，该策略不保证总价值最优。',
    code:['int last = numeric_limits<int>::min();','for (auto [s,f,id] : byFinish) {','    if (s < last) continue;','    chosen.push_back(id);','    last = f;','}'],
    frames:(()=>{
      const acts=[[1,3],[2,4],[3,5],[0,6],[5,7]],names='ABCDE',state=acts.map(()=>'待考察'),chosen=[];
      let last=-Infinity;
      function frame(l,t,n,i){const vars=[['last',last===-Infinity?'最小 int':last],['已选',chosen.join('、')||'空']];
        if(l<0)vars[0][1]='待初始化';
        return snap(l,t,n,acts.map(([s,f],k)=>cell(names[k],'活动 '+names[k],'['+s+','+f+')',state[k],row(k),147)),vars,i==null?[]:[names[i]]);}
      const out=[frame(-1,'按结束时刻排好','五项活动互相争用同一个场地，目标是尽量多安排几项。'),frame(0,'当前场地可用','last 代表上次选中的活动结束时间，最初设置为最小 int。')];
      acts.forEach(([s,f],i)=>{
        out.push(frame(1,'考察活动 '+names[i],'比较其开始时刻 '+s+' 与上一项结束时刻。',i));
        if(s<last){state[i]='冲突';out.push(frame(2,'跳过冲突活动','开始时刻 '+s+' 早于 '+last+'。',i));}
        else{chosen.push(names[i]);state[i]='已选';out.push(frame(3,'选入 '+names[i],'它与已选集合兼容，也是剩余兼容活动中结束最早的一项。',i));last=f;out.push(frame(4,'移动可用时刻','下一项最早可从 '+last+' 开始。',i));}
      });return out;
    })(),
    quiz:test('若 A 已被选中且在 3 时结束，C 占用 [3,5)，是否可选？',['不可选，两个活动都写有 3','可选，半开区间允许首尾相接','必须比较两项活动的持续时间'],1,'A 在 3 时已经释放场地。半开区间的兼容条件是 s >= last。')
  });
  add({
    id:'radix-lsd',group:sort,title:'基数排序怎样保住低位顺序',subtitle:'让同桶元素按进入顺序离开',
    chapter:'排序 · 稳定的低位优先基数排序',goal:'观察稳定的个位分配如何被十位分配继承。',
    invariant:'完成低 k 位的稳定分配和收集后，序列按低 k 位有序。高一位相同时，同桶元素沿用进入该桶时的顺序。',
    cost:'d 位、基数 b、n 条记录时，时间 O(d(n+b))，辅助空间 O(n+b)。此例十进制两趟，空桶也按序经过。',
    boundary:'演示输入限定为 0 至 99 的非负整数，不足两位补前导零。负数和可变长一般键需要另外约定编码和位数。',
    code:['for (int exp : {1, 10}) {','    array<vector<int>, 10> bucket;','    for (int x : a) bucket[(x / exp) % 10].push_back(x);','    a.clear();','    for (const auto& b : bucket) a.insert(a.end(), b.begin(), b.end());','}'],
    frames:(()=>{
      let a=[21,12,11,22];const original=[...a],out=[];
      function frame(l,t,n,order,details,vars,focus=[]){return snap(l,t,n,order.map((v,k)=>cell('v'+v,'记录 '+original.indexOf(v),v,details.get(v)||'输入',120+185*k,145)),vars,focus.map(v=>'v'+v));}
      out.push(frame(-1,'观察输入顺序','从左到右依次读 21、12、11、22。相同十位的记录一开始尚未按个位排序。',a,new Map(),[]));
      for(const exp of [1,10]){
        const phase=exp===1?'个位':'十位',b=Array.from({length:10},()=>[]),labels=new Map(),old=[...a];
        out.push(frame(1,'准备按'+phase+'分桶','十个桶都是空的。记录卡上的编号表示原始输入位置。',old,labels,[['位权',exp]]));
        for(const val of old){const k=Math.floor(val/exp)%10;b[k].push(val);labels.set(val,'桶 '+k+' · 第 '+b[k].length);
          out.push(frame(2,'将 '+val+' 追加到桶 '+k,'根据'+phase+'数字分桶。同一桶的成员用追加的先后顺序排列。',old,labels,[['位权',exp],['x',val],['桶号',k]],[val]));}
        a=[];out.push(frame(3,'清空输出序列','各桶还保存着这一趟的所有记录，现在从小桶号到大桶号依次收集。',old,labels,[['a','空'],['位权',exp]]));
        for(let k=0;k<b.length;k++){
          if(!b[k].length)continue;
          a.push(...b[k]);for(const v of b[k])labels.set(v,'输出第 '+(a.indexOf(v)+1)+' 位');
          const order=[...a,...old.filter(v=>!a.includes(v))];
          out.push(frame(4,'收集桶 '+k,'按入桶顺序追加 '+b[k].join('、')+'。'+(a.length===old.length?'这趟结束，序列为 '+a.join('、')+'。':'其余非空桶仍待收集。'),order,labels,[['输出 a',a.join(' ')],['位权',exp]],b[k]));
        }
      }return out;
    })(),
    quiz:test('个位趟结束后，21 在 22 前。十位趟两者都进入桶 2，为什么出桶时仍应让 21 在前？',['必须倒序出桶','个位建立的先后顺序依靠稳定性保留','因为 21 的原始编号更大'],1,'十位相同，正确顺序取决于个位。稳定收集让已经比较过的低位排序信息继续有效。')
  });
  globalThis.ATLAS.push(...lessons);
})();
