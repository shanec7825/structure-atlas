(() => {
  "use strict";

  const lessons = [];
  const graphGroup = "图与散列";
  const orderGroup = "查找与排序";
  const ids = ["A", "B", "C", "D"];
  const diamond = [[86, 147], [398, 60], [398, 236], [714, 147]];
  const outgoing = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };
  const diamondEdges = [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"]];
  const edgeList = pairs => pairs.map(([from, to, label]) => ({from, to, label: label || ""}));
  const sequence = items => items.length ? items.join(" · ") : "空";
  const variables = record => Object.entries(record).map(([key, value]) => [key, String(value)]);
  const node = (id, label, value, detail, x, y) => ({id, label, value: String(value), detail, x, y});
  function graphNodes(valueAt, detailAt, positions = diamond) {
    return ids.map((id, i) => node(id, "顶点 " + id, valueAt(id), detailAt(id), ...positions[i]));
  }
  function arrayNodes(items, detailAt, prefix = "a") {
    return items.map((value, i) => node(prefix + i, prefix + "[" + i + "]", value, detailAt(i),
      80 + i * (640 / Math.max(items.length - 1, 1)), 145));
  }
  function record(frames, line, title, note, nodes, edges, vars, focus = []) {
    frames.push({line, title, note, nodes, edges: edgeList(edges), vars: variables(vars), focus});
  }
  const question = (ask, choices, answer, why) => ({ask, choices, answer, why});

  function breadthFirst() {
    const frames = [], queue = [], order = [], distance = {};
    let current = "—";
    const add = (line, title, note, focus) => record(frames, line, title, note,
      graphNodes(id => id in distance ? distance[id] : "∞",
        id => queue.includes(id) ? "等待出队" : order.includes(id) ? "已出队" : "尚未发现"),
      diamondEdges, {队首到队尾: sequence(queue), 出队顺序: sequence(order), u: current}, focus);
    add(-1, "先看两条汇合的路", "数字表示从 A 出发走过的最少边数。B 和 C 都能到达 D，邻接表按字母顺序扫描。", []);
    distance.A = 0; queue.push("A");
    add(0, "起点的距离为零", "先认领 A，再把 A 放入队尾。∞ 表示还没找到路。", ["A"]);
    while (queue.length) {
      current = queue.shift(); order.push(current);
      add(2, "取出队首 " + current, "队列向前挪一个位置，现在检查 " + current + " 的出边。", [current]);
      for (const v of outgoing[current]) {
        if (v in distance) {
          add(4, "第二次看见 " + v, "它早已在入队时登记距离。即使它仍在队列里，也会被这次检查跳过。", [current, v]);
        } else {
          distance[v] = distance[current] + 1; queue.push(v);
          add(5, v + " 进入队尾", "沿 " + current + " → " + v + " 多走一条边，首次发现的距离为 " + distance[v] + "。", [current, v]);
        }
      }
    }
    return {id:"graph-bfs",group:graphGroup,title:"广度优先搜索",subtitle:"两条路碰到同一点时，谁先登记？",chapter:"图 · 遍历",
      goal:"亲眼看队列把顶点分成一层层，读出 A 到 D 的最少边数。",
      invariant:"队列中的距离从队首到队尾单调不减。发现顶点时立即登记，能让每个顶点最多入队一次。",
      cost:"邻接表中全图遍历为 O(V + E) 时间，队列和距离表共 O(V) 空间。",
      boundary:"这里每条边同价。加权图的最短距离可能沿着更多条边到达；未能从 A 到达的顶点保持 ∞。",
      code:["dist[A] = 0; q.push(A);","while (!q.empty()) {","  auto u = q.front(); q.pop();","  for (auto v : adj[u]) {","    if (dist[v] != INF) continue;","    dist[v] = dist[u] + 1; q.push(v);","  }","}"],frames,
      quiz:question("C 检查 D 时，D 还在队列里。此刻该怎么办？",["再次入队","保留原距离，继续扫描","把 D 移到队首"],1,"B 已经在 D 第一次入队时把距离写成 2。后来发现的另一条两步路不会缩短它。")};
  }

  function depthFirst() {
    const stack = [], finished = [], seen = new Set(), frames = [];
    const add = (line, title, note, focus) => record(frames, line, title, note,
      graphNodes(id => stack.includes(id) ? "在栈" : finished.includes(id) ? "完成" : "未访",
        id => stack.includes(id) ? "深度 " + stack.indexOf(id) : finished.includes(id) ? "已回溯" : "等待进入"),
      diamondEdges, {活动调用: sequence(stack), 退出顺序: sequence(finished)}, focus);
    add(-1,"从 A 出发","先沿邻接表中的第一条出边走到底。活动调用从左到右排列，最右端正在执行。",[]);
    function visit(u) {
      seen.add(u); stack.push(u);
      add(1,"进入 " + u,"为 " + u + " 建立调用帧并标记已见。调用者暂时停在递归语句。",[u]);
      for (const v of outgoing[u]) {
        if (seen.has(v)) add(3,"跳过 " + v, v + " 早已被标记，这条出边不会产生新的调用帧。",[u,v]);
        else {
          add(4,u + " 把控制交给 " + v,"递归调用即将进入 " + v + "。返回后，" + u + " 会从这条出边的下一条继续。",[u,v]);
          visit(v);
        }
      }
      stack.pop(); finished.push(u);
      add(6,"退出 " + u,"出边均已检查，记录完成次序并返回调用者。", [u]);
    }
    visit("A");
    return {id:"graph-dfs",group:graphGroup,title:"深度优先与回溯",subtitle:"递归返回时，谁记得下一条路？",chapter:"图 · 遍历",
      goal:"同时看活动调用与退出顺序，区分第一次发现和结束处理。",
      invariant:"活动调用保存从根到当前顶点的路径。每个暂停的调用都保留着自己的邻接表迭代位置。",
      cost:"邻接表遍历为 O(V + E) 时间。标记表占 O(V)，最深调用链也可达 O(V)。",
      boundary:"若图可能有环，递归前必须登记已见。特别深的链可能耗尽调用栈，可显式保存顶点和下一条出边的位置。",
      code:["void dfs(Vertex u) {","  seen[u] = true;","  for (auto v : adj[u]) {","    if (seen[v]) continue;","    dfs(v);","  }","  finish.push_back(u); return;","}"],frames,
      quiz:question("D 返回给 B 后，会从 A 重新扫描整张图吗？",["会，从 A 的第一条边开始","继续扫描 D","不会，先恢复 B 的调用"],2,"B 的调用帧保留了迭代位置。B 剩余出边扫完后才会返回 A。")};
  }

  function topological() {
    const arcs = [["A","C"],["B","C"],["C","D"]], degree = {A:0,B:0,C:2,D:1};
    const q = [], result = [], frames = [];
    let u = "—";
    const add = (line,title,note,focus) => record(frames,line,title,note,
      graphNodes(v => degree[v], v => result.includes(v) ? "已输出" : q.includes(v) ? "已就绪" : "剩余入度",
        [[95,65],[95,230],[395,146],[710,146]]), arcs, {就绪队列:sequence(q),输出:sequence(result),u:line>=2 && line<=5 ? u : "—"},focus);
    add(-1,"课程 C 有两个先修项","数字是剩余入度。图中的箭头从先修课指向后续课。",[]);
    q.push("A","B"); add(0,"找到两门可先学的课","扫描全部顶点，按 A、B、C、D 的顺序收集零入度顶点。",["A","B"]);
    while(q.length) {
      u=q.shift(); result.push(u);
      add(2,"输出 " + u,"这门课的先修条件都已满足，随后逐条解除它给后续课程带来的限制。",[u]);
      for(const [,v] of arcs.filter(([from])=>from===u)){
        degree[v]--;
        add(4,v + " 少一项依赖","处理 " + u + " → " + v + "，剩余入度降为 " + degree[v] + "。箭头保留以便对照原图。",[u,v]);
        if(degree[v]===0) {
          q.push(v);
          add(5,v + " 现在就绪","最后一项先修条件解除，加入队尾。",[v]);
        }
      }
    }
    add(8,"四门课全部排好","输出长度等于顶点数，所有依赖都有先后顺序。",ids);
    return {id:"graph-topological",group:graphGroup,title:"拓扑排序",subtitle:"一门课还剩几个先修条件？",chapter:"图 · 有向无环图",
      goal:"用剩余入度和就绪队列构造一个符合先修条件的顺序。",
      invariant:"每轮出边处理完后，未输出顶点的入度等于尚未输出的前驱数。只有剩余入度为零的顶点才能进入就绪队列。",
      cost:"邻接表实现含构造入度共 O(V + E) 时间，辅助空间 O(V)。",
      boundary:"队列空了但输出不足 V 个顶点，剩余部分含有向环。若多个顶点同时就绪，可产生多个合法顺序。",
      code:["for (auto v : vertices) if (!in[v]) q.push(v);","while (!q.empty()) {","  auto u = q.front(); q.pop(); out.push_back(u);","  for (auto v : adj[u]) {","    --in[v];","    if (in[v] == 0) q.push(v);","  }","}","return out.size() == vertices.size();"],frames,
      quiz:question("若初始按 B、A 入队，一个合法顺序是？",["B C A D","B A C D","D B A C"],1,"A 和 B 之间没有依赖。C 必须等到 A 与 B 都输出，D 必须等到 C。")};
  }

  function dijkstra() {
    const arcs = [["A","B",6],["A","C",2],["C","B",1],["B","D",2],["C","D",7]];
    const dist = {A:Infinity,B:Infinity,C:Infinity,D:Infinity}, parent = {}, done = new Set(), frames = [];
    const read = v => Number.isFinite(v) ? v : "∞";
    const add = (line,title,note,focus,vars={})=>record(frames,line,title,note,
      graphNodes(id=>read(dist[id]),id=>done.has(id)?"已确定":parent[id]?"来自 "+parent[id]:"待处理"),
      arcs.map(([u,v,w])=>[u,v,String(w)]),{已确定:sequence([...done]),...vars},focus);
    add(-1,"B 可以先绕道到达","箭头上的权值是路程。每个顶点里的数字是目前找到的最短距离。",[]);
    dist.A=0; add(0,"起点距离归零","其余顶点仍没有可用路径。",["A"]);
    while(done.size<ids.length){
      const u=ids.filter(id=>!done.has(id)).sort((a,b)=>dist[a]-dist[b])[0];
      done.add(u);
      add(4,"锁定 " + u,"在未确定顶点中，它的暂定距离最小。所有边权非负，这个值已经是最终距离。",[u],{u});
      for(const [,v,w] of arcs.filter(([from])=>from===u)){
        const alt=dist[u]+w, old=read(dist[v]);
        if(alt<dist[v]){
          dist[v]=alt; parent[v]=u;
          add(7,"经 " + u + " 改写 " + v,"候选值 " + dist[u] + " + " + w + " = " + alt + " 小于原值 " + old + "。同时更新前驱。",[u,v],{候选:alt,前驱:u});
        } else add(6,"原路径更短或相等","本次尝试没有缩短已知距离。",[u,v],{候选:alt});
      }
    }
    return {id:"graph-dijkstra",group:graphGroup,title:"Dijkstra 最短路",subtitle:"先看到的路径，何时才可以定案？",chapter:"图 · 优先级搜索",
      goal:"观察 B 的暂定距离先写成 6，再被绕经 C 的路径改成 3。",
      invariant:"每次选择未确定顶点中的最小暂定值。边权非负时，经其他未确定顶点绕行无法让它更短。",
      cost:"此例线性扫描所有未确定顶点，时间 O(V² + E)，额外空间 O(V)。用二叉堆可改进稀疏图上的取最小操作。",
      boundary:"负权边破坏确定距离的依据。没有可达顶点时安全退出；本例有限距离和加法都在数值类型范围内。",
      code:["dist[A] = 0;","while (done.size() < vertices.size()) {","  auto u = min_unsettled_vertex(dist, done);","  if (dist[u] == INF) break;","  done.insert(u);","  for (auto [v, w] : adj[u]) {","    if (dist[u] + w >= dist[v]) continue;","    dist[v] = dist[u] + w; parent[v] = u;","  }","}"],frames,
      quiz:question("刚看到 A → B 的权值 6，可以立刻确定 B 的距离吗？",["可以，只有一条直达边","可以，D 还未被访问","还不能，C 的暂定值只有 2"],2,"先选 C，再沿 C → B 松弛得到 3。发现某个顶点与确定它的最终距离是不同的事件。")};
  }

  function probeInsert() {
    const cells = [9,"空","空","空",4], frames = [];
    const key = 14, m = cells.length;
    const add = (line,title,note,i,step) => record(frames,line,title,note,
      arrayNodes(cells,j => j===i ? "当前探测" : cells[j]==="空" ? "从未占用" : "已占用","T"),[],
      {键:key,表长:m,起始桶:"14 % 5 = 4",探测次数:step,下标:i ?? "—"},i===null?[]:["T"+i]);
    add(-1,"同一个起始桶","4、9 与 14 对 5 取余都得到 4。槽 4 和槽 0 已放着另外两把键。",null,0);
    for(let k=0;k<m;k++){
      const i=(key%m+k)%m;
      add(2,"检查槽 " + i,k===1?"越过最后一个槽后取模回到零。":"从起始桶沿固定的探测顺序向前。",i,k+1);
      if(cells[i]!=="空"){
        add(4,"此槽已有键 " + cells[i],"它与 14 不同，当前槽必须保留，继续探测。",i,k+1);
      }else{
        cells[i]=key;
        add(3,"写入槽 " + i,"这一格从未占用，探测链上也没有相同的键。",i,k+1);
        break;
      }
    }
    return {id:"hash-probe",group:graphGroup,title:"线性探测与回绕",subtitle:"同一个余数怎样容纳三把键？",chapter:"词典 · 散列表",
      goal:"手动走出从 4 到 0 再到 1 的探测序列，区分哈希起点与实际位置。",
      invariant:"在没有删除的线性探测表中，从键的起始桶按同一规则走到存储位置之前，不会遇到从未占用的空槽。",
      cost:"良好散列且负载率受控时，平均插入时间 O(1)；严重聚集时可检查全部 m 个槽，最坏 O(m)。本次额外空间 O(1)。",
      boundary:"本实验只用非负键且表中没有删除标记。最多探测 m 次；满表仍未找到空槽时必须报告失败或扩容。",
      code:["const auto h = key % m;","for (int k = 0; k < m; ++k) {","  int i = (h + k) % m;","  if (empty(i)) { T[i] = key; return true; }","  if (T[i] == key) return false;","}","return false;"],frames,
      quiz:question("装入 14 之后，在相同表中查找它要看哪些槽？",["4、0、1","1、2、3","只看 4"],0,"查找与插入遵循相同序列。4 和 0 的键均不匹配，第三个槽 1 中的 14 才是目标。")};
  }

  function tombstone() {
    const cells=[9,14,"空","空",4], frames=[];
    const add=(line,title,note,i,focus=[])=>record(frames,line,title,note,
      arrayNodes(cells,j=>cells[j]==="墓碑"?"曾经占用":cells[j]==="空"?"从未占用":"已占用","T"),[],
      {查找键:14,起始桶:4,当前下标:i ?? "—"},focus);
    add(-1,"删掉挡路的键","槽 4、0、1 依次放着 4、9、14。键 14 的探测起点也是 4。",null);
    cells[4]="墓碑";
    add(0,"给旧槽留一块墓碑","已知键 4 位于槽 4。删除时留下 Deleted 状态，让后来查找的人知道还要向前。",4,["T4"]);
    for(let k=0;k<5;k++){
      const i=(4+k)%5;
      add(2,"探测槽 " + i,"第 " + (k+1) + " 次探测，先看这个槽所处的状态。",i,["T"+i]);
      if(cells[i]===14){add(4,"找到原来的 14","槽 1 的状态是 Occupied，键值也匹配，返回这个下标。",i,["T1"]);break;}
      add(4,cells[i]==="墓碑"?"穿过墓碑":"键值不匹配",cells[i]==="墓碑"?"墓碑允许继续搜索。若删除时直接改成 Empty，这里便会提前报告不存在。":"槽里是 9，沿探测顺序继续前进。",i,["T"+i]);
    }
    return {id:"hash-tombstone",group:graphGroup,title:"删除与墓碑",subtitle:"删除一把键，为什么会让另一把键消失？",chapter:"词典 · 开放寻址",
      goal:"区分从未使用的空槽与曾经占用的墓碑，解释看似无害的清空为何会令查找失败。",
      invariant:"从起始桶通向存活键的探测路径上可以有墓碑，但不能出现从未占用的空槽。",
      cost:"查找最坏 O(m)，额外空间 O(1)。大量墓碑会拉长探测路径，可通过重新散列清理。",
      boundary:"实现无重复键的插入时，可先记下遇到的首个墓碑，还需继续排查后方的同键，再决定是否复用。",
      code:["T[4].state = Deleted; // 已定位待删键 4","for (int k = 0; k < m; ++k) {","  int i = (14 % m + k) % m;","  if (T[i].state == Empty) return -1;","  if (T[i].state == Occupied && T[i].key == 14) return i;","}","return -1;"],frames,
      quiz:question("查找一个不存在的键时，遇到哪种槽可以提前结束？",["墓碑","从未占用的空槽","任意不同键"],1,"从未占用的空槽会截断探测链。墓碑和其他键后面仍可能藏着正在查找的键。")};
  }

  function lowerBound() {
    const a=[1,3,3,3,8,12], key=3, frames=[];
    let lo=0, hi=a.length, mid=null;
    const add=(line,title,note,focus=[])=>record(frames,line,title,note,
      arrayNodes(a,i=> i<lo ? "已证实 < 3" : i>=hi ? "已证实 ≥ 3" : "待检查"),[],
      {目标:key,lo:line<0 ? "—" : lo,hi:line<0 ? "—" : hi,
        mid:line>=2 && line<=4 ? mid : "—",待查区间:line<0 ? "—" : "["+lo+", "+hi+")"},focus);
    add(-1,"找第一个不小于 3 的位置","数组已经排好序，3 连续出现三次。右端点 6 是尾后位置，不读取 a[6]。");
    add(0,"两端覆盖整个数组","左侧已排除区间和右侧已确认区间此时都为空。");
    while(lo<hi){
      mid=lo+Math.floor((hi-lo)/2);
      add(2,"读中点 a[" + mid + "]","中点的值是 " + a[mid] + "，接下来判断左边还能不能更早满足条件。",["a"+mid]);
      if(a[mid]<key){
        lo=mid+1;
        add(3,"小于目标，移过中点","到这个中点为止都太小，lo 变为 " + lo + "。",["a"+mid]);
      } else {
        hi=mid;
        add(4,"收紧候选答案的右边界","这里已满足条件。令 hi = mid，继续检查更靠左的元素。",["a"+mid]);
      }
    }
    add(6,"边界相遇在下标 " + lo,"现在左边全小于 3，从这里往右全都大于等于 3。",["a"+lo]);
    return {id:"search-lower-bound",group:orderGroup,title:"二分查找左边界",subtitle:"中点已经等于目标，为什么还要继续？",chapter:"向量 · 有序查找",
      goal:"从半开区间推导更新规则，在有重复值的数组中找到第一次出现的位置。",
      invariant:"[0, lo) 中的值全部小于目标，[hi, n) 中的值全部大于等于目标。答案下标位于闭区间 [lo, hi]。",
      cost:"随机访问有序数组上，比较次数和时间均为 O(log n)，额外空间 O(1)。",
      boundary:"空数组返回 0；目标大于所有值时返回 n，这个位置可作插入点，禁止解引用。若查精确匹配，还需检查下标和等值条件。",
      code:["int lo = 0, hi = n;","while (lo < hi) {","  int mid = lo + (hi - lo) / 2;","  if (a[mid] < key) lo = mid + 1;","  else hi = mid;","}","return lo;"],frames,
      quiz:question("若目标换成 20，这个函数应该返回什么？",["下标 5","下标 6","下标 −1"],1,"所有元素都小于 20，左边界会走到 n。返回 6 表示尾后插入点。")};
  }

  function insertionSort() {
    const a=[{n:4,id:"甲"},{n:2,id:"甲"},{n:4,id:"乙"},{n:1,id:"甲"}], frames=[];
    let i=0, j=null, key=null, sorted=1;
    const show=v=>v.n+v.id;
    const add=(line,title,note,focus=[])=>record(frames,line,title,note,
      arrayNodes(a.map(show),k => k<sorted ? "已排序前缀" : k===j && key ? "待写入位置" : "数组槽"),[],
      {i:line<0 ? "—" : i,j:j??"—",手中元素:key?show(key):"—",已排前缀:sorted},focus);
    add(-1,"两张 4 的先后顺序","甲、乙是相同排序键的身份。观察移动时它们是否互换前后。");
    for(i=1;i<a.length;i++){
      key=a[i]; j=i; sorted=i;
      add(1,"拿起 " + show(key),"把元素副本留在手中。原来的槽仍存着旧值，随即可能被右移覆盖。",["a"+i]);
      while(j>0 && a[j-1].n>key.n){
        a[j]=a[j-1]; --j; sorted=j;
        add(3,"向右复制 " + show(a[j]),"源槽的旧值暂时还在，所以数组会短暂出现两个相同标记。手中仍留着 " + show(key) + "。",["a"+j,"a"+(j+1)]);
      }
      a[j]=key; sorted=i+1;
      add(5,"落在下标 " + j,j>0 && a[j-1].n===key.n ? "相等时停止，较晚出现的同键元素放在原有同键元素后面。" : "左侧已经有序，手中元素写入空出的逻辑位置。",["a"+j]);
    }
    return {id:"sort-insertion",group:orderGroup,title:"稳定的插入排序",subtitle:"数组里暂时有两个相同的元素，丢了谁？",chapter:"排序 · 插入排序",
      goal:"在数组、临时变量和已排前缀之间追踪每个元素的身份。",
      invariant:"每轮开始时 [0, i) 已按键排好且保持同键次序；内层右移期间，待插元素保存在 key 中。",
      cost:"最坏 O(n²) 时间，已排好时 O(n)，辅助空间 O(1)。右移次数等于原序列中的逆序对数。",
      boundary:"严格大于才右移。把比较改成大于等于时，后来出现的同键元素可能被放在先来者前方。",
      code:["for (int i = 1; i < n; ++i) {","  Item key = a[i]; int j = i;","  while (j > 0 && a[j-1].k > key.k) {","    a[j] = a[j-1]; --j;","  }","  a[j] = key;","}"],frames,
      quiz:question("处理 4乙 时，它会越过前面的 4甲 吗？",["会，同键时也要右移","不会，严格大于的条件为假","取决于甲、乙的内存地址"],1,"算法只比较键，4 > 4 为假。保持甲在乙之前就体现了稳定性。")};
  }

  const roads = [
    {u:"A",v:"B",w:3}, {u:"A",v:"C",w:1}, {u:"B",v:"C",w:2},
    {u:"B",v:"D",w:4}, {u:"C",v:"D",w:7}
  ];
  const roadName = e => e.u + "–" + e.v;
  function roadScene(frames, line, title, note, nodes, tree, vars, focus) {
    const edges = roads.map(e => ({from:e.u,to:e.v,directed:false,
      label: String(e.w) + (tree.includes(e) ? " ✓" : "")}));
    frames.push({line,title,note,nodes,edges,vars:variables(vars),focus});
  }

  function kruskal() {
    const frames=[], tree=[], roots=Object.fromEntries(ids.map(id=>[id,id]));
    const ordered=[...roads].sort((a,b)=>a.w-b.w);
    function find(u){ while(u!==roots[u]) u=roots[u]; return u; }
    const add=(line,title,note,focus=[],extra={})=>roadScene(frames,line,title,note,
      graphNodes(id=>find(id),()=> "所在集合代表"),tree,
      {已选:sequence(tree.map(roadName)),总权:tree.reduce((s,e)=>s+e.w,0),...extra},focus);
    add(-1,"四个村庄需要连成一片","每个村庄先各自成组。图是无向图，边上的数字表示修路成本。");
    add(0,"把道路按成本排队","依次考虑 " + ordered.map(e=>roadName(e)+"("+e.w+")").join("、") + "。");
    for(const e of ordered){
      const ru=find(e.u),rv=find(e.v);
      if(ru===rv){
        add(3,"放弃 " + roadName(e),"两个端点已经由已选边连通，再取这条边会构成环。",[e.u,e.v],{代表对:ru+"，"+rv});
      } else {
        roots[rv]=ru; tree.push(e);
        add(4,"合并 " + roadName(e),"这条边连接两个不同的集合。边上出现勾号，表示它已进入生成树。",[e.u,e.v],{加入权值:e.w});
        if(tree.length===ids.length-1)break;
      }
    }
    add(5,"三条路接通四个村庄","连通且无环的四顶点树恰有三条边，这里可以提前停下。",ids);
    return {id:"graph-kruskal",group:graphGroup,title:"Kruskal 最小生成树",subtitle:"为什么可以略过一条便宜的边？",chapter:"图 · 最小生成树",
      goal:"跟踪四个连通分量的合并，亲眼识别一条会封闭成环的便宜边。",
      invariant:"已选边始终组成森林。按权递增扫描时，连接不同分量的边是横跨某个分量割的最轻候选之一，可以安全加入。",
      cost:"排序 O(E log E)。使用按秩合并和路径压缩的并查集，集合操作合计 O(E α(V))，并查集额外占 O(V)。",
      boundary:"适用于无向图。图不连通时得到最小生成森林。相同权重可能对应多棵总权相等的最小生成树。",
      code:["sort(edges.begin(), edges.end(), by_weight);","DSU sets(vertices);","for (auto e : edges) {","  if (sets.find(e.u) == sets.find(e.v)) continue;","  sets.unite(e.u, e.v); tree.push_back(e);","  if (tree.size() == V - 1) break;","}"],frames,
      quiz:question("A–B 成本 3，比 B–D 的 4 更便宜，为什么跳过？",["3 不是正偶数","A、B 已经通过 C 连通","每个顶点只能接一条边"],1,"此时 A–C 和 B–C 已选。再加 A–B 会成环，却没接通新的分量。")};
  }

  function prim() {
    const frames=[], tree=[], inside=new Set();
    const add=(line,title,note,focus=[],extra={})=>roadScene(frames,line,title,note,
      graphNodes(id=>inside.has(id)?"树内":"树外",id=>id==="A"?"起点 A":"村庄 "+id),tree,
      {树内:sequence([...inside]),总权:tree.reduce((s,e)=>s+e.w,0),...extra},focus);
    add(-1,"从一个村庄开始","沿用同一张无向路网。从 A 开始，每次让已有树扩展一个顶点。");
    inside.add("A");
    add(0,"A 单独成树","此时的候选是 A–B 和 A–C。只看一端在树内、一端在树外的边。",["A"]);
    while(inside.size<ids.length){
      const crossing = roads.filter(e=>inside.has(e.u)!==inside.has(e.v)).sort((a,b)=>a.w-b.w);
      const e=crossing[0],v=inside.has(e.u)?e.v:e.u;
      add(2,"在跨割边中挑最轻者",crossing.map(x=>roadName(x)+"("+x.w+")").join("、")+" 横跨当前边界。最轻的边是 "+roadName(e)+"。",[e.u,e.v],{候选数:crossing.length});
      inside.add(v); tree.push(e);
      add(4,v+" 加入已有树","把边 "+roadName(e)+" 收下。原来的某些候选已经成为树内边，下轮扫描要把它们排除。",[e.u,e.v]);
    }
    return {id:"graph-prim",group:graphGroup,title:"Prim 最小生成树",subtitle:"同一张路网，改成从一棵树向外长",chapter:"图 · 最小生成树",
      goal:"比较一棵树向外扩展与多个分量逐步合并的两种选择过程。",
      invariant:"已选边连成一棵树。树内与树外形成一个割，横跨该割的最轻边可以安全扩展当前生成树。",
      cost:"本例每轮扫描所有边选最轻跨割边，时间 O(VE)，维护树内标记和结果需 O(V) 空间。邻接表配优先队列可避免反复全扫。",
      boundary:"若仍有树外顶点，却找不到跨割边，原图不连通。本实验返回失败；若要求森林，可另选未处理的根重新开始。",
      code:["inside.insert(A);","while (inside.size() < V) {","  auto e = cheapest_crossing_edge(edges, inside);","  if (!e) return false;","  inside.insert(outside_endpoint(*e, inside)); tree.push_back(*e);","}"],frames,
      quiz:question("当 A、C、B 均已在树内时，A–B 还能作候选吗？",["能，它的成本只有 3","不能，它的两端都在树内","能，只要 A 是起点"],1,"新增边必须带入一个树外顶点。此时需要在 B–D 和 C–D 之间选择。")};
  }

  function partition() {
    const a=[6,2,7,3,4],frames=[];
    let split=0,j=0;
    const last=a.length-1,pivot=a[last];
    const add=(line,title,note,focus=[],done=false)=>{
      const inspected = line===2 || line===3;
      function status(i) {
        if(done) return i<split ? "小于基准" : i===split ? "基准就位" : "大于等于基准";
        if(i===last) return line<0 ? "末槽" : "基准";
        if(i<split) return "已证实 < 4";
        return inspected && i<=j ? "已证实 ≥ 4" : "待扫描";
      }
      record(frames,line,title,note,arrayNodes(a,status),[],
        {基准:line<0 ? "—" : pivot,小区右界:line<0 ? "—" : split,扫描下标:inspected ? j : "—"},focus);
    };
    add(-1,"一次划分","用末尾的 4 当基准。目标是让它处在最终下标，左右两部分各自仍可能无序。");
    add(0,"小区从空开始","split 指向下一个可以放入小元素的槽。",["a4"]);
    for(j=0;j<last;j++){
      if(a[j]<pivot){
        const old=split, value=a[j];
        [a[split],a[j]]=[a[j],a[split]];split++;
        add(3,"收进小元素 " + value,"与小区右端的槽交换，然后令 split 加一。小区现在有 "+split+" 个元素。",["a"+old,"a"+j]);
      }else{
        add(2,"保留大元素 " + a[j],"当前键不小于基准，小区不扩张，下一轮继续扫描右侧。",["a"+j]);
      }
    }
    [a[split],a[last]]=[a[last],a[split]];
    add(6,"基准落在下标 " + split,"把末尾的基准换到两个区域的交界处。右侧的 "+a.slice(split+1).join("、")+" 仍需递归排序。",["a"+split,"a"+last],true);
    return {id:"sort-partition",group:orderGroup,title:"快速排序的一次划分",subtitle:"基准已经就位，两边为什么还会乱？",chapter:"排序 · 快速排序",
      goal:"跟踪小区右边界，区分一次划分的保证与整轮排序的结果。",
      invariant:"每轮循环开始时，[0, split) 小于基准，[split, j) 大于或等于基准，[j, last) 尚未分类。基准在末槽等待。",
      cost:"一次划分对长度 n 的片段耗时 Θ(n)，额外空间 O(1)。完整快速排序平均 O(n log n)，极端偏斜划分时 O(n²)。",
      boundary:"该片段要求区间非空。大量相同键会让严格小于版本偏斜，可用三向划分集中处理等值区。",
      code:["int pivot = a[last], split = 0;","for (int j = 0; j < last; ++j) {","  if (a[j] < pivot) {","    std::swap(a[split], a[j]); ++split;","  }","}","std::swap(a[split], a[last]);","return split;"],frames,
      quiz:question("一次划分结束后，哪个结论一定成立？",["整个数组已升序","两边长度相同","基准左侧全小于它，右侧全大于等于它"],2,"交换只负责分类。每个区域内部仍可能无序，需要继续递归处理。")};
  }

  function stableMerge() {
    const left=[{k:2,id:"甲"},{k:5,id:"甲"}],right=[{k:2,id:"乙"},{k:4,id:"乙"}];
    const out=[],frames=[];let i=0,j=0;
    const show=v=>v.k+v.id;
    const add=(line,title,note,focus=[])=>{
      const cells=[];
      for(const [list,tag,cursor,column] of [[left,"L",i,0],[right,"R",j,2]]){
        list.forEach((v,k)=>cells.push(node(tag+k,tag+"["+k+"]",show(v),line<0?"输入":k<cursor?"已取走":k===cursor?"当前头部":"等待",96+198*(column+k),64)));
      }
      for(let k=0;k<left.length+right.length;k++)cells.push(node("O"+k,"out["+k+"]",out[k]?show(out[k]):"·",out[k]?"已写入":"待写入",96+198*k,225));
      record(frames,line,title,note,cells,[],{左游标:line<0?"—":i,右游标:line<0?"—":j,输出数:out.length},focus);
    };
    add(-1,"合并两段有序记录","上面是来自原序列左、右两段的记录。甲、乙标明身份；比较时只看数字。");
    while(i<left.length || j<right.length){
      const takeLeft=j===right.length || (i<left.length && left[i].k<=right[j].k);
      const k=out.length;
      if(takeLeft){
        const read=i, tie=j<right.length && left[i].k===right[j].k;
        out.push(left[i++]);
        add(3,"取左段的 "+show(out[k]),tie?"两个头部都为 2，先拿左段里的 2甲，才能保住两张牌的原先顺序。":
          j===right.length?"右段已耗尽，把左段接下来的头部送进输出。":"左段的头部较小，可以安全写到下一个位置。",["L"+read,"O"+k]);
      }else{
        const read=j;out.push(right[j++]);
        add(5,"取右段的 "+show(out[k]),i===left.length?"左段已经耗尽，继续接上右段。":"右段头部比左段头部更小，所以本轮只移动右游标。",["R"+read,"O"+k]);
      }
    }
    return {id:"sort-stable-merge",group:orderGroup,title:"归并与稳定性",subtitle:"两张同分记录，哪一张先进入结果？",chapter:"排序 · 归并排序",
      goal:"一次只比较两个有序段的头部，并跟踪输入游标与输出序列。",
      invariant:"输出保持有序，包含两段已消费的前缀；两个未消费后缀也各自有序，因此下一个全局最小值只可能位于它们的头部。",
      cost:"长度 m、n 的两个有序段归并耗时 O(m + n)，此实现输出缓冲区占 O(m + n)。完整归并排序耗时 O(N log N)。",
      boundary:"任一段耗尽后，短路判断避免读取尾后位置。对相同键先选原序列左段的记录可以保持稳定。",
      code:["int i = 0, j = 0;","while (i < m || j < n) {","  if (j == n || (i < m && L[i].k <= R[j].k)) {","    out.push_back(L[i++]);","  } else {","    out.push_back(R[j++]);","  }","}"],frames,
      quiz:question("若把比较从 ≤ 改为 <，重复键会发生什么？",["两个 2 都消失","结果不一定稳定","数字大小一定排错"],1,"相等时会先取右段的 2乙。数值顺序仍可正确，但原先靠前的 2甲会被排在它后面。")};
  }

  lessons.push(breadthFirst(), depthFirst(), topological(), dijkstra(), prim(), kruskal(),
    probeInsert(), tombstone(), lowerBound(), insertionSort(), partition(), stableMerge());
  globalThis.ATLAS.push(...lessons);
})();
