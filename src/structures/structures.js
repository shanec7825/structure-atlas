(() => {
  "use strict";

  // All positions and addresses in these examples are teaching coordinates.
  const linear = "线性结构";
  const trees = "树与堆";
  const row = (i, count) => count === 1 ? 400 : 76 + i * 648 / (count - 1);
  const address = (base, i) => "0x" + (base + 4 * i).toString(16).toUpperCase();
  const cell = (id, label, value, detail, x, y) => ({id, label, value: String(value), detail, x, y});
  const edge = (from, to, label) => ({from, to, label});
  const snapshot = (line, title, note, nodes, edges, vars, focus = []) =>
    ({line, title, note, nodes, edges, vars: Object.entries(vars).map(([k,v]) => [k, String(v)]), focus});
  const slots = (data, base = 0x1000, y = 138, prefix = "a", name = "a") =>
    data.map((v,i) => cell(prefix+i, name+"["+i+"]", v, address(base,i), row(i,data.length), y));
  const ask = (question, choices, answer, why) => ({ask: question, choices, answer, why});
  const lessons = [];

  {
    const data = [12, 24, 36, 48, "未写"];
    const frames = [];
    let n = 4;
    function step(line, title, note, i, focus = []) {
      frames.push(snapshot(line,title,note,slots(data),[],{n, pos:1, x:18, ...(i === null ? {} : {i})},focus));
    }
    step(-1,"给 18 腾一个位置","容量为 5，只有前 4 格属于序列。设 sizeof(int) 为 4，格子的地址每次增加 4。",null);
    step(0,"从最右端开始","i 指向下一个可写格。先搬尾部，后续要读的 36 和 24 仍在原处。",4,["a4"]);
    for (let i = n; i > 1; i--) {
      data[i] = data[i-1];
      step(1,"把 "+data[i]+" 向右复制一格","读 a["+(i-1)+"]，写 a["+i+"]。短暂出现两个相同的数，是赋值产生的副本。",i,["a"+i,"a"+(i-1)]);
    }
    step(0,"空位已经腾出","i 等于 pos，循环条件为假。区间 [2, 4] 已经保存原来的后缀。",1,["a1"]);
    data[1] = 18;
    step(2,"填入 18","写在原 24 的位置，原 24 的副本已经位于 a[2]。",null,["a1"]);
    n++;
    step(3,"把新尾部纳入序列","长度现在是 5。容量及整块缓冲区的起始地址始终相同。",null);
    lessons.push({id:"vector-insert",group:linear,title:"向量的原地插入",subtitle:"让元素从右向左腾出一个空位",chapter:"向量",goal:"在下标 1 插入 18，并保留原有元素的相对次序。",invariant:"每次搬动后，已处理后缀都比原位置靠右一格，尚未搬动的源元素仍可读。",cost:"已有空余容量时，移动 n − pos 个元素，另需 O(1) 空间。",boundary:"要求 0 ≤ pos ≤ n 且 n 小于容量。pos = n 时只写新尾部。",code:["for (int i = n; i > pos; --i) {","    a[i] = a[i - 1]; }","a[pos] = x;","++n;"],frames,quiz:ask("如果从左向右搬，先执行 a[2] = a[1]，下一个要搬的原值会发生什么？",["36 已经被 24 覆盖","36 自动滑到下一格","数组会立即越界"],0,"a[2] 原本保存 36。下一轮从 a[2] 读到的是刚写入的 24。")});
  }

  {
    const frames = [];
    const old = [17,38];
    let fresh = null, live = true, a = "0x1000", cap = 2, size = 2;
    function step(line,title,note,extra={},focus=[]) {
      const nodes = [];
      if(live) nodes.push(...slots(old,0x1000,75,"o","原区"));
      if(fresh) nodes.push(...slots(fresh,0x2000,210,"b","新区"));
      const vars = {a,cap,size,...(fresh ? {b:"0x2000"}:{}),...extra};
      frames.push(snapshot(line,title,note,nodes,[],vars,focus));
    }
    step(-1,"两个位置都满了","a 指向一块由 new int[2] 获得的连续内存。追加 59 前，必须先取得更大的空间。");
    fresh = Array(4).fill("未写");
    step(0,"申请另一块缓冲区","原区仍然存活。四个新格尚未写入元素，两块缓冲区的地址范围互不重叠。",{},["b0"]);
    for(let i=0;i<2;i++) {
      fresh[i]=old[i];
      step(2,"复制第 "+(i+1)+" 个整数","写入新区后，原区中的值依然存在。地址在变，数值可以相同。",{i},["o"+i,"b"+i]);
    }
    live=false; a="悬空";
    step(3,"释放旧数组","原区对象的生命周期结束。此刻 a 含有失效的旧指针，不能用它访问元素。");
    a="0x2000";
    step(4,"让 a 接管新区","现在 a 和 b 都指向新区开头。其他地方保存的旧元素指针仍然失效。",{},["b0"]);
    cap=4;
    step(5,"登记新容量","容量变为 4，已有元素仍然只有 2 个。");
    fresh[2]=59;
    step(6,"追加 59","把新元素写入下标 size，也就是下标 2。",{},["b2"]);
    size=3;
    step(7,"登记新长度","可读的序列为 17、38、59。下标 3 仍为空余容量。");
    lessons.push({id:"vector-grow",group:linear,title:"向量扩容与地址失效",subtitle:"同一个数，搬家后住在哪里",chapter:"向量",goal:"跟踪两块内存同时存活的时段，并找到旧元素指针失效的时刻。",invariant:"复制过程中，新区的已写前缀与原序列对应前缀相同。",cost:"单次倍增搬动 n 个 int，时间 Θ(n)，新缓冲区占 Θ(n) 空间。连续尾插的均摊时间为 O(1)。",boundary:"这里模拟正容量 int 数组、单线程、分配成功且容量计算未溢出。std::vector 的实际增长倍数由实现决定。",code:["int* b = new int[2 * cap];","for (int i = 0; i < size; ++i)","    b[i] = a[i];","delete[] a;","a = b;","cap *= 2;","a[size] = 59;","++size;"],frames,quiz:ask("扩容前保存了 int* p = &a[1]。最后执行 *p 是否仍能可靠取到 38？",["可以，因为 38 还在序列中","不可以，p 指向已经释放的原区","可以，因为 a = b 会更新所有指针"],1,"p 是独立的指针对象。重新给 a 赋值不会重写 p，原区释放后解引用 p 属于未定义行为。")});
  }

  {
    const data=["未写","未写","未写","未写"];
    let used=0, popped="尚未声明";
    const frames=[];
    function step(line,title,note,focus=[]) {
      frames.push(snapshot(line,title,note,slots(data),[],{used,"下个写入位置":used,"栈内下标":"[0, "+used+")",popped},focus));
    }
    step(-1,"空栈","用长度为 4 的 int 数组模拟栈。used 同时表示元素数量与下次压入的位置。");
    data[0]=7; step(0,"把 7 写在顶部空位","写下值后还需要登记元素数。",["a0"]);
    used++; step(1,"7 入栈","有效区间变成 [0, 1)，栈顶在 used − 1。",["a0"]);
    data[1]=11; step(2,"把 11 放在下一个空位","先来的 7 仍在下标 0。",["a1"]);
    used++; step(3,"11 入栈","最后压入的是 11。",["a1"]);
    used--; step(4,"退回一格","used 从 2 变成 1。下标 1 已经在逻辑栈外，int 数组那个格子仍然存活。",["a1"]);
    popped=data[used]; step(5,"取走刚弹出的 11","栈内只剩 7。下一次压栈会覆盖下标 1 的旧值。",["a1"]);
    lessons.push({id:"stack-top",group:linear,title:"栈顶与有效区间",subtitle:"弹栈之后，旧值去了哪里",chapter:"栈与队列",goal:"区分栈的逻辑长度和底层 int 数组的内容。",invariant:"语义上只有 [0, used) 属于栈，压栈写 used，弹栈读取原 used − 1。",cost:"固定容量数组上的单次压栈、弹栈都为 Θ(1)。",boundary:"压栈需要 used < 容量，弹栈需要 used > 0。此例的数组槽始终存活，不能直接推广到已析构的 C++ 对象。",code:["a[used] = 7;","++used;","a[used] = 11;","++used;","--used;","int popped = a[used];"],frames,quiz:ask("此时再压入 19，会改写哪个格子？",["下标 0","下标 1","下标 2"],1,"used 的值是 1。下一次写 a[used] 会覆盖之前留下的 11。")});
  }

  {
    const frames=[];
    const data=[22,"旧值","旧值",11];
    const coords=[[400,55],[620,145],[400,238],[180,145]];
    let head=3,tail=1,x;
    function step(line,title,note,focus=[]) {
      const nodes=data.map((v,i)=>cell("q"+i,"下标 "+i,v,address(0x1800,i),...coords[i]));
      const edges=coords.map((_,i)=>edge("q"+i,"q"+((i+1)%4),""));
      frames.push(snapshot(line,title,note,nodes,edges,{head,tail,"队内个数":(tail-head+4)%4,...(x===undefined?{}:{x})},focus));
    }
    step(-1,"队头在下标 3","箭头表示下标的循环次序。head 指向待取的 11，tail 指向下次写入位 1。队中已有 11、22。");
    x=data[head]; step(0,"读取队头","读取 11 到 x，这句还没有移动 head。",["q3"]);
    head=(head+1)%4; step(1,"从末格绕回首格","(3 + 1) % 4 等于 0。现在 22 成为队头，下标 3 的 11 留在有效区外。",["q0"]);
    data[tail]=33; step(2,"把 33 写入尾部空位","写入下标 1，准备将它纳入队列。",["q1"]);
    tail=(tail+1)%4; step(3,"尾指针前进","队列现在包含 22、33，下一次写下标 2。",["q2"]);
    data[tail]=44; step(4,"把 44 写入下标 2","这里使用保留一格的约定，写入前队列尚未满。",["q2"]);
    tail=(tail+1)%4; step(5,"只剩保留格","队列含 22、33、44。tail 的下一格恰为 head，容量为 4 的数组已达逻辑满。",["q3","q0"]);
    lessons.push({id:"ring-queue",group:linear,title:"循环队列的回绕",subtitle:"四个格子为什么只装三个元素",chapter:"栈与队列",goal:"用首尾两个下标区分队空和队满。",invariant:"从 head 按模 4 前进，直到 tail 之前是有效队列。tail 始终指向下一写入位。",cost:"固定容量下，每次出队和入队时间 Θ(1)，辅助空间 Θ(1)。",boundary:"此实现保留一格。head == tail 表示空，(tail + 1) % 4 == head 表示满，满时不能再直接写入。",code:["int x = a[head];","head = (head + 1) % 4;","a[tail] = 33;","tail = (tail + 1) % 4;","a[tail] = 44;","tail = (tail + 1) % 4;"],frames,quiz:ask("结束时 head = 0、tail = 3。继续写入并把 tail 前移，会遇到什么问题？",["队列自动扩容","首尾同为 0，与空队列编码冲突","数组下标 4 永远有效"],1,"(3 + 1) % 4 = 0，tail 会追上 head。保留一格就是给满态单独留下一个编码。")});
  }

  {
    const data=[4,9,13,21,30];
    const target=13,frames=[]; let lo=0,hi=data.length,mid=null;
    function step(line,title,note,focus=[]) {
      frames.push(snapshot(line,title,note,slots(data),[],{lo,hi,target,...(mid===null?{}:{mid})},focus));
    }
    step(-1,"在有序区间中找第一个不小于 13 的位置","lo 是闭端，hi 是开端。hi = 5 是区间边界，可以参加算术，不能读取 a[5]。");
    while(lo<hi){
      step(0,"区间仍然非空","此时还需要检查 [ "+lo+", "+hi+" )。");
      mid=lo+Math.floor((hi-lo)/2);
      step(1,"选取中点 "+mid,"中点落在当前区间内，a["+mid+"] = "+data[mid]+"。",["a"+mid]);
      if(data[mid]<target){
        lo=mid+1;
        step(2,"丢弃中点及左侧","中点的值小于目标，有序性保证左侧也小于目标。",["a"+mid]);
      } else {
        hi=mid;
        step(3,"收紧右边界","a[mid] 已经满足条件。把 mid 保留为可能的答案边界，继续寻找更靠左的位置。",["a"+mid]);
      }
      mid=null;
    }
    step(4,"返回下标 "+lo,"左右边界相遇，下标 2 是第一个满足 a[i] ≥ 13 的位置。",["a"+lo]);
    lessons.push({id:"binary-bound",group:linear,title:"二分查找的边界",subtitle:"亲眼看见半开区间收缩",chapter:"向量",goal:"求有序数组中第一个大于等于目标值的位置。",invariant:"[0, lo) 全部小于目标，[hi, n) 全部大于等于目标；答案位于含边界的 [lo, hi]。",cost:"每轮至少折去近一半的区间，时间 O(log(n + 1))，辅助空间 O(1)。",boundary:"空数组返回 0；全部元素都小于目标时返回 n。对返回位置取值前须先检查它小于 n。",code:["while (lo < hi) {","    int mid = lo + (hi - lo) / 2;","    if (a[mid] < target) lo = mid + 1;","    else hi = mid; }","return lo;"],frames,quiz:ask("把目标换成 31，最后返回什么？",["下标 4","下标 5，也就是尾后位置","13"],1,"不存在大于等于 31 的元素。满足条件的后缀为空，其左边界在数组末尾 n。")});
  }

  const layout = [[400,52],[220,145],[585,145],[94,240],[330,240],[520,240],[705,240]];
  const family = [[0,1,"左"],[0,2,"右"],[1,3,"左"],[1,4,"右"],[2,5,"左"],[2,6,"右"]];
  const bst = [8,3,12,1,6];
  const treeAddr = ["0x3200","0x30A0","0x36D0","0x3450","0x30F0","0x3520","0x3720"];
  const desc = (i) => i < 0 ? "nullptr" : treeAddr[i];
  function treeFrame(line,title,note,values,vars,focus=[],skipEdges=[]) {
    const nodes=values.flatMap((v,i)=>v==null?[]:[cell("t"+i,"结点",v,treeAddr[i],...layout[i])]);
    const edges=family.filter(([a,b])=>values[a]!=null && values[b]!=null && !skipEdges.includes(b))
      .map(([a,b,side])=>edge("t"+a,"t"+b,side));
    return snapshot(line,title,note,nodes,edges,vars,focus.map(i=>"t"+i));
  }
  {
    const frames=[]; let p=0;
    const key=6;
    const step=(line,title,note,focus=[])=>frames.push(treeFrame(line,title,note,bst,{p:desc(p),key},focus));
    step(-1,"从根找 6","假定键互异。每个结点左子树的键更小，右子树的键更大。",[p]);
    while(p>=0){
      step(0,"当前结点存在","p 指向键为 "+bst[p]+" 的结点。",[p]);
      if(key===bst[p]){step(1,"命中 6","相等时直接返回 p，搜索结束。",[p]);break;}
      const left=key<bst[p],old=p;
      p=2*p+(left?1:2);
      step(left?2:3,left?"走向左子树":"走向右子树",key+(left?" 小于 ":" 大于 ")+bst[old]+"，另一侧整棵子树都可以排除。",[old,p]);
    }
    lessons.push({id:"bst-search",group:trees,title:"搜索树的剪枝",subtitle:"一次比较，排除整棵子树",chapter:"二叉搜索树",goal:"在键互异的搜索树中，沿一条根到结点的路径查找 6。",invariant:"若目标存在且尚未命中，它必在 p 指向的子树内。",cost:"O(h) 时间、O(1) 辅助空间。平衡时 h 为 O(log n)，退化成链时可达 O(n)。",boundary:"空树或走到空孩子时返回 nullptr。比较规则必须与建树规则一致。",code:["while (p != nullptr) {","    if (key == p->key) return p;","    if (key < p->key) p = p->left;","    else p = p->right; }","return nullptr;"],frames,quiz:ask("查找 5，到结点 6 后下一步会去哪？",["转去根的右子树","沿 6 的左孩子走到 nullptr","返回 3"],1,"5 小于 6，只能继续向左。空指针说明这条搜索路径上没有 5。")});
  }

  {
    const frames=[];
    const values=[...bst];
    let key=10, link="&root", p=0, node="尚未声明";
    const step=(line,title,note,focus=[],skip=[])=>frames.push(treeFrame(line,title,note,values,{key,link,"*link":desc(p),node},focus,skip));
    frames.push(treeFrame(-1,"寻找能安放 10 的空指针","root 已持有 8 的地址。接下来要找一个存着 nullptr、又可以被写入的孩子字段。",values,{key,root:treeAddr[0]},[0]));
    step(0,"把根指针变量作为入口","现在 *link 等价于 root；它存的是根结点地址。",[0]);
    for(const [old,next,left] of [[0,2,false],[2,-1,true]]){
      step(1,"这个位置已经有结点","先读 *link 指向的键 "+values[old]+"。",[old]);
      step(2,"键不同，可以继续","只有命中相同的键才返回 false。",[old]);
      link="&("+values[old]+(left?".left)":".right)");
      p=next;
      step(3,left?"锁定左孩子字段":"锁定右孩子字段",left?"10 小于 12，link 现在指向 12 的 left 字段。":"10 大于 8，link 现在指向 8 的 right 字段。",[old,...(next<0?[]:[next])]);
    }
    step(1,"找到空位","*link 为 nullptr。link 自身有效，它指向可以改写的孩子字段。",[2]);
    values[5]=key; node=treeAddr[5];
    step(4,"分配独立结点","新结点保存 10，两个孩子都为空。此刻 12 还没有连到它。",[5],[5]);
    p=5;
    step(5,"写入孩子字段","写 *link 正是在改 12 的 left 字段。所有其他结点的地址与边都保持原样。",[2,5]);
    step(6,"插入完成","10 位于 8 的右子树，又在 12 的左边，两个祖先的大小约束均得到满足。",[5]);
    lessons.push({id:"bst-insert",group:trees,title:"搜索树插入与二级指针",subtitle:"找到一个可以被写入的孩子字段",chapter:"二叉搜索树",goal:"用 Node** 指向需要更新的指针槽，把 10 接到 12 的左侧。",invariant:"link 指向真实可写的指针槽，*link 是下一棵待搜索子树的根。",cost:"时间 O(h + 1)。除了新增结点，迭代过程只需 O(1) 辅助空间。",boundary:"空树时 link = &root 可直接改写 root。此例遇重复键返回 false，不分配结点。Node 的字段顺序为 key、left、right。",code:["Node** link = &root;","while (*link != nullptr) {","    if (key == (*link)->key) return false;","    link = key < (*link)->key ? &(*link)->left : &(*link)->right; }","Node* node = new Node{key, nullptr, nullptr};","*link = node;","return true;"],frames,quiz:ask("如果原树为空，执行 *link = node 会改到哪里？",["新结点的左指针","root 变量本身","一个临时副本"],1,"循环没有执行，link 仍等于 &root。对 *link 赋值就是给 root 赋值。")});
  }

  {
    const frames=[],stack=[],out=[];
    let p=0;
    const child=(i,offset)=>2*i+offset<bst.length?2*i+offset:-1;
    const step=(line,title,note,focus=[])=>frames.push(treeFrame(line,title,note,bst,{
      p:desc(p),"栈（底至顶）":stack.map(i=>bst[i]).join("，")||"空","已输出":out.join("，")||"空"
    },focus));
    step(-1,"用一个栈记住回程","p 指向根 8。每次压入一个结点，就记下左侧走完后要回来的位置。",[p]);
    while(p>=0||stack.length){
      while(p>=0){
        stack.push(p);
        step(2,"把 "+bst[p]+" 压栈","该结点要等左子树处理完才输出。",[p]);
        const old=p;p=child(p,1);
        step(3,"沿左孩子下降",p<0?"左孩子为空，接下来从栈顶拿回最近的待访问结点。":"沿左边继续，当前 p 指向 "+bst[p]+"。",p<0?[old]:[old,p]);
      }
      p=stack.pop();
      step(4,"弹出 "+bst[p],"栈顶记录的结点成为当前结点。",[p]);
      out.push(bst[p]);
      step(5,"输出 "+bst[p],"当前结点的左子树已处理完毕。",[p]);
      const old=p;p=child(p,2);
      step(6,"进入右子树",p<0?"右孩子为空。外层条件接着检查栈内是否还有待返回的位置。":"转入 "+bst[p]+"，先处理它的左子树。",p<0?[old]:[old,p]);
    }
    step(0,"遍历结束","p 为空且栈空。结果为 1、3、6、8、12。此树还满足搜索树性质，因此结果有序。");
    lessons.push({id:"tree-inorder",group:trees,title:"中序遍历的回程",subtitle:"用栈保存尚未完成的访问",chapter:"二叉树",goal:"照着栈与当前指针，走完左子树、根、右子树的访问顺序。",invariant:"栈保存尚未输出的祖先；从某结点左侧返回并弹栈时，它的左子树已全部访问。",cost:"每个结点入栈出栈各一次，时间 Θ(n)，辅助栈 O(h)。",boundary:"空树不产生输出。中序遍历可用于一般二叉树，仅当搜索树满足相应顺序约束时才保证输出有序。",code:["while (p || !s.empty()) {","    while (p) {","        s.push(p);","        p = p->left; }","    p = s.top(); s.pop();","    visit(p->key);","    p = p->right; }"],frames,quiz:ask("刚输出结点 3，栈里只剩 8。应当马上输出 8 吗？",["应该，因为 8 在栈顶","应该，因为 8 大于 3","先访问 3 的右子树 6"],2,"结点 3 的右子树还没完成。访问 6 后才会回到位于栈中的祖先 8。")});
  }

  function heapFrame(line,title,note,values,vars,focus) {
    const nodes=values.map((v,i)=>cell("h"+i,"a["+i+"]",v,address(0x4000,i),...layout[i]));
    const edges=family.filter(([a,b])=>a<values.length&&b<values.length).map(([a,b])=>edge("h"+a,"h"+b,""));
    return snapshot(line,title,note,nodes,edges,{...vars,"数组":values.join("，")},focus.map(i=>"h"+i));
  }
  {
    const values=[9,7,8,2,3],frames=[];
    let i=null,parent=null;
    const step=(line,title,note,focus=[])=>frames.push(heapFrame(line,title,note,values,{i:i??"尚未声明",...(parent===null?{}:{parent})},focus));
    step(-1,"最大堆准备接收 10","结点按数组下标摆成完全二叉树。每个父键至少与孩子一样大。");
    values.push(10);
    step(0,"先放到数组末尾","新值在 a[5]，树的形状仍然完整。当前可能冲突的只有它与父亲之间的边。",[5]);
    i=5;step(1,"从新叶子出发","i 指向刚写入的 10。",[i]);
    while(i>0){
      parent=Math.floor((i-1)/2);
      step(3,"算出父下标 "+parent,"零基下标下，父亲位于 (i − 1) / 2 的整数商。",[i,parent]);
      step(4,"孩子更大","a[parent] = "+values[parent]+"，小于孩子 "+values[i]+"，不能在这里停下。",[parent,i]);
      [values[parent],values[i]]=[values[i],values[parent]];
      step(5,"交换父子两格","两个值在数组中互换，树边表示下标关系，所以不会改变。",[parent,i]);
      i=parent;step(6,"跟上正在上浮的 10","接下来只需要检查新位置之上的父子关系。",[i]);
      parent=null;
    }
    step(2,"到达树根","i 等于 0，没有父亲。最大堆的局部顺序全部恢复。",[0]);
    lessons.push({id:"heap-up",group:trees,title:"最大堆的上滤",subtitle:"新来的最大值逐层向上",chapter:"优先级队列",goal:"将 10 插入最大堆，同时保留树形与堆序。",invariant:"追加叶子后，唯一可能的堆序违例在新值与父亲之间；一次交换让检查位置上移一层。",cost:"上滤进行 O(log n) 次比较和交换。若底层 vector 恰好扩容，单次插入还会产生 O(n) 搬迁。",boundary:"i == 0 时不能再套父下标公式。相等时可以停下，堆允许重复键。",code:["a.push_back(10);","int i = static_cast<int>(a.size()) - 1;","while (i > 0) {","    int parent = (i - 1) / 2;","    if (a[parent] >= a[i]) break;","    std::swap(a[parent], a[i]);","    i = parent; }"],frames,quiz:ask("10 刚放到下标 5，为什么无需检查 7 和 3 的关系？",["堆内所有值本来就排序完毕","原堆的其他父子边没有因追加叶子改变","7 和 3 是重复键"],1,"完全树的下标关系原封不动。只有新增的叶子与它的父结点形成了一条待检查的边。")});
  }

  {
    const values=[11,7,8,4,5,6,2],frames=[];
    let i=null,c=null,out=null;
    const step=(line,title,note,focus=[])=>frames.push(heapFrame(line,title,note,values,{...(out===null?{}:{out}),...(i===null?{}:{i}),...(c===null?{}:{c})},focus));
    step(-1,"取走堆顶 11","堆顶最大。根以外的两棵子树都已满足堆序。",[0]);
    out=values[0];step(0,"先把堆顶存起来","out 收到 11。这样随后覆盖根也不会丢失结果。",[0]);
    values[0]=values.at(-1);step(1,"末元素填到根","2 同时位于根和末格。复制值之后，还要缩短数组。",[0,6]);
    values.pop();step(2,"移去最后一格","完全二叉树的形状恢复。根的值可能太小，需要下滤。",[0]);
    i=0;step(3,"从根开始检查","只要有左孩子，就有至少一个孩子可比较。",[i]);
    while(2*i+1<values.length){
      c=2*i+1;step(5,"先取左孩子","左孩子下标为 2i + 1。若右孩子存在，还须比较两者。",[i,c]);
      let rightWins=c+1<values.length && values[c+1]>values[c];
      if(rightWins)c++;
      step(6,rightWins?"选择更大的右孩子":"保留左孩子",rightWins?"右孩子更大，若交换，应让它成为父亲。":"此处没有右孩子，左孩子就是较大候选。",[c]);
      step(7,"父值仍然太小","a[i] = "+values[i]+" 小于 a[c] = "+values[c]+"，需继续交换。",[i,c]);
      [values[i],values[c]]=[values[c],values[i]];step(8,"把较大孩子提上来","这一步修好当前位置的堆序；较小的值仍可能需要下降。",[i,c]);
      i=c;step(9,"下移检查位置","继续检查被换下来的 2。",[i]);
      c=null;
    }
    step(10,"返回原堆顶","下标 5 是叶子，检查结束。新堆顶为 8，本次返回值为 11。",[0,i]);
    lessons.push({id:"heap-down",group:trees,title:"删除堆顶与下滤",subtitle:"为什么一定要选择较大的孩子",chapter:"优先级队列",goal:"从最大堆取走 11，并让替代值逐层找到正确位置。",invariant:"左右子树各自为堆，仅当前结点可能比孩子小。提升较大孩子后，违例最多向下移动一层。",cost:"删除堆顶并修复堆序需 O(log n) 时间，辅助空间 O(1)。",boundary:"取堆顶前要求非空；只剩一个元素时 pop_back 后循环自动跳过。访问右孩子前需检查它存在。代码中 n() 返回当前 int 长度，本例下标运算不溢出。",code:["int out = a.front();","a[0] = a.back();","a.pop_back();","int i = 0;","while (2*i + 1 < n()) {","    int c = 2*i + 1;","    if (c+1 < n() && a[c+1] > a[c]) ++c;","    if (a[i] >= a[c]) break;","    std::swap(a[i], a[c]);","    i = c; }","return out;"],frames,quiz:ask("根是 2，孩子是 7 和 8。若先把 7 换上去，根还存在哪个问题？",["右孩子 8 比根 7 大","树形不再完全","两个孩子的下标交换了"],0,"最大堆要求父结点同时不小于两个孩子。提升较大者 8 才能一次修好根的局部堆序。")});
  }
  {
    const frames=[];
    const keys=[30,20,40,10,25,5], height=[4,3,1,2,1,1];
    const before=[[495,48],[332,114],[689,114],[165,181],[451,181],[82,246]];
    const after=[[566,115],[339,48],[697,189],[161,115],[456,189],[80,189]];
    let coords=before, root=0, links=[[0,1,"左"],[0,2,"右"],[1,3,"左"],[1,4,"右"],[3,5,"左"]];
    const vars={root:"0x3200"};
    function step(line,title,note,focus=[]) {
      const nodes=keys.map((k,i)=>cell("r"+i,"h = "+height[i],k,treeAddr[i],...coords[i]));
      const edges=links.map(([a,b,label])=>edge("r"+a,"r"+b,label));
      frames.push(snapshot(line,title,note,nodes,edges,{...vars,root:desc(root)},focus.map(i=>"r"+i)));
    }
    step(-1,"5 的插入造成左左失衡","采用空树高度 0、叶高 1。30 的左子树高 3，右子树高 1，平衡因子为 +2。",[0,1,3,5]);
    vars.a=desc(0);step(0,"标记旧根 a","a 指向 30。旋转只改指针和缓存高度，六个对象各自保留原地址。",[0]);
    vars.b=desc(1);step(1,"取得将要提升的 b","b 指向 20。它的右子树 25 比 20 大，又比 30 小，恰好能改挂到 30 左侧。",[0,1,4]);
    links[0]=[0,4,"左"];
    step(2,"先移交中间子树","30 的左孩子改成 25。此刻 20 的右孩子还指向同一个 25，变量 b 让 20 仍然可达。",[0,1,4]);
    links[3]=[1,0,"右"];coords=after;
    step(3,"让旧根成为右孩子","20 的右边现在是 30。30 的两个孩子为 25 和 40，根变量暂时仍指向 30。",[1,0]);
    height[0]=2;step(4,"先修较低结点的高度","30 的左右孩子均高 1，因此重算得到 2。",[0,4,2]);
    height[1]=3;step(5,"再修新根的高度","20 的两个孩子都高 2，重算得到 3。先修下层才能读到正确高度。",[1,0,3]);
    root=1;step(6,"改写根指针","从 20 出发再次可达全部结点。中序键序仍是 5、10、20、25、30、40。",[1]);
    lessons.push({id:"avl-rotate",group:trees,title:"AVL 单旋与子树移交",subtitle:"让 20 上升，同时给 25 找到正确位置",chapter:"二叉搜索树",goal:"从左左型失衡中推导右旋的三次指针更新，并核对高度。",invariant:"旋转前后的中序键序相同。中间子树中所有键都落在新根与旧根的键之间。",cost:"可直接访问失衡结点并缓存高度时，单次旋转时间和额外空间均为 Θ(1)。整次 AVL 插入仍需 O(log n) 寻路。",boundary:"该例适用于左左型。左孩子右侧更高的左右型，通常先左旋左孩子，再右旋失衡结点。若旋转点有父结点，root 对应父亲的那一条孩子链接。",code:["Node* a = root;","Node* b = a->left;","a->left = b->right;","b->right = a;","fixHeight(a);","fixHeight(b);","root = b;"],frames,quiz:ask("若 b 原有的右子树为空，a->left = b->right 应改成什么？",["无需改代码，它会写入 nullptr","要跳过这一行","把 a->left 改成 a"],0,"中间子树可以为空。若跳过赋值，a 仍指向 b，在 b->right = a 后会形成环。")});
  }

  {
    const frames=[];
    const keys={old:[10,20,30]},children={old:[]};
    const label={old:"原叶",top:"新根",right:"右叶"};
    const positions={top:[400,65],old:[220,200],right:[580,200]};
    const addrs={top:"0x5C00",old:"0x51A0",right:"0x5EA0"};
    let root="old", mid;
    function step(line,title,note,focus=[]) {
      const nodes=Object.entries(keys).map(([id,ks])=>cell(id,label[id],ks.join(" | ")||"空",addrs[id],...positions[id]));
      const edges=Object.entries(children).flatMap(([a,kids])=>kids.map((b,j)=>edge(a,b,"c["+j+"]")));
      frames.push(snapshot(line,title,note,nodes,edges,{root:addrs[root],...(mid===undefined?{}:{mid})},focus));
    }
    step(-1,"满根遇到待插入的 25","最小度数 t = 2，每个结点最多 3 个键。原根是满叶，插入前先分裂。",["old"]);
    keys.right=[];children.right=[];
    step(0,"新建右叶","右叶尚未连接，也还没有键。BNode 的 keys 和 child 是初始为空的向量。",["right"]);
    mid=keys.old[1];
    step(1,"留下中位分隔键","满叶的中间键是 20。它将成为父层分隔键。",["old"]);
    keys.right.push(keys.old[2]);step(2,"高位键复制到右叶","右叶收到 30。这一刻，原叶中仍存着 30。",["old","right"]);
    keys.old.length=1;step(3,"原叶保留低位键","原叶只余 10，右叶已有 30，中间键仍由局部变量 mid 保存。",["old","right"]);
    keys.top=[];children.top=[];
    step(4,"建立更高一层","为新根分配独立对象，root 仍指向原叶。",["top"]);
    keys.top.push(mid);step(5,"中位键进入新根","20 从叶层提升为根键。小于它的键将沿左孩子查找。",["top"]);
    children.top=["old","right"];step(6,"接回两个叶子","新根有 1 个键和 2 个孩子，叶子深度相同。",["top","old","right"]);
    root="top"; step(7,"让 root 指向新根","整棵树增高一层。分裂发生前后，已存的三个键仍可按序搜索。",["top"]);
    keys.right.unshift(25);step(8,"到右叶插入 25","25 大于 20 且小于 30，在右叶局部有序插入。",["top","right"]);
    lessons.push({id:"btree-root-split",group:trees,title:"B 树的满根分裂",subtitle:"三个键如何长成两层树",chapter:"高级搜索树",goal:"按 t = 2 的 B 树约定，跟踪一次满叶根分裂和随后的插入。",invariant:"完成操作后，各结点内键有序，内部结点的 k 个键隔开 k + 1 个孩子区间，所有叶子深度相同。",cost:"一般 t 下，分裂一次要搬 Θ(t) 个键或孩子。高度为 O(log_t n)，查找只访问一条根到叶路径。",boundary:"这里显式演示满叶根的特例。若满结点有孩子，还要把相应的高位孩子指针移交给右结点。此处采用 B 树，提升的分隔键从叶中移除。",code:["BNode* r = new BNode{};","int mid = root->keys[1];","r->keys.push_back(root->keys[2]);","root->keys.resize(1);","BNode* top = new BNode{};","top->keys.push_back(mid);","top->child = {root, r};","root = top;","r->keys.insert(r->keys.begin(), 25);"],frames,quiz:ask("完成分裂后，查找 20 会在何处命中？",["一定要下到左叶","一定要下到右叶","新根的分隔键"],2,"这个 B 树示例把中位键提升到父层，根中的 20 本身就是存储的键。")});
  }

  {
    const frames=[];
    const alphabet=["A","B","C","D"];
    const pool=alphabet.map((symbol,i)=>({symbol,w:[2,3,7,9][i],left:null,right:null}));
    const coords=[[255,246],[525,246],[676,182],[142,116],[405,182],[533,116],[372,49]];
    const available=[0,1,2,3];
    const name=(i)=>pool[i].symbol||"w"+pool[i].w;
    let a,b,t;
    function step(line,title,note,focus=[]) {
      const nodes=pool.map((n,i)=>cell("f"+i,n.symbol?"符号 "+n.symbol:"内部结点",n.w,"权重",...coords[i]));
      const edges=pool.flatMap((n,i)=>n.left===null?[]:[edge("f"+i,"f"+n.left,"0"),edge("f"+i,"f"+n.right,"1")]);
      const vars={"最小队列":available.map(i=>name(i)+"("+pool[i].w+")").join("，")||"空",...(a===undefined?{}:{a:name(a)}),...(b===undefined?{}:{b:name(b)}),...(t===undefined?{}:{t:name(t)})};
      frames.push(snapshot(line,title,note,nodes,edges,vars,focus.map(i=>"f"+i)));
    }
    step(-1,"四个符号各为一棵树","频数分别为 2、3、7、9。变量区按从小到大列出可选树根，图中暂时没有边。");
    while(available.length>1){
      a=available.shift();step(1,"取出最小根 "+name(a),"取出的子树仍然存在，仅从候选队列中移出。",[a]);
      b=available.shift();step(2,"取出次小根 "+name(b),"这两棵树将成为一对兄弟。",[a,b]);
      t=pool.length;pool.push({symbol:null,w:pool[a].w+pool[b].w,left:a,right:b});
      step(3,"新父亲的权重为 "+pool[t].w,"左边记 0，右边记 1。把两棵树合并会让其中每个叶子的深度增加 1。",[t,a,b]);
      available.push(t);available.sort((i,j)=>pool[i].w-pool[j].w);
      step(4,"把新根放回候选队列","下一轮重新从所有候选树根中取出最小的两个。",[t]);
      a=undefined;b=undefined;t=undefined;
    }
    step(5,"从根读出前缀码","A = 100，B = 101，C = 11，D = 0。带权路径长为 2×3 + 3×3 + 7×2 + 9×1 = 38。",[6]);
    lessons.push({id:"huffman",group:trees,title:"哈夫曼树与带权路径长",subtitle:"每次合并的钱，最后花在哪里",chapter:"二叉树与优先级队列",goal:"从 2、3、7、9 四个频数构造前缀码，并核对合并成本与编码长度。",invariant:"队列中每个根代表一组互不相交的符号，权重等于组内频数总和。每次合并对带权路径长的贡献为两根之和。",cost:"用最小堆构造 k 个符号的树需 O(k log k) 时间和 O(k) 空间。示例三次合并成本 5 + 12 + 21 = 38。",boundary:"本例假设至少两个正频符号。等权时可能出现多棵同样最优的树，编码随平局规则和左右安排而变。",code:["while (q.size() > 1) {","    Node* a = popMin(q);","    Node* b = popMin(q);","    Node* t = makeParent(a->w + b->w, a, b);","    q.push(t); }","return q.top();"],frames,quiz:ask("若在最终树中只交换根的左右孩子，会怎样？",["所有编码长度不变，带权路径长仍为 38","D 的编码长度变成 3","前缀码必然失效"],0,"左右互换改变首位编码，但每个叶子的深度不变。所有符号仍位于叶子，前缀性质也保留。")});
  }
  globalThis.ATLAS.push(...lessons);
})();
