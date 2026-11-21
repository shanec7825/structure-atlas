(() => {
  "use strict";
  const lessons = [];
  const linear="线性结构", trees="树与堆", order="查找与排序";
  const cell=(id,label,value,detail,x,y)=>({id,label,value:String(value),detail,x,y});
  const edge=(from,to,label)=>({from,to,label});
  const frame=(line,title,note,nodes,edges,vars,focus=[])=>({line,title,note,nodes,edges,vars:Object.entries(vars).map(([k,v])=>[k,String(v)]),focus});
  const quiz=(ask,choices,answer,why)=>({ask,choices,answer,why});
  const row=(arr,id,label,y,detail=(_,i)=>"下标 "+i)=>
    arr.map((v,i)=>cell(id+i,label+i,v,detail(v,i),arr.length===1?400:76+i*648/(arr.length-1),y));
  const hex=n=>"0x"+n.toString(16).toUpperCase();

  {
    const a=[[11,12,13],[21,22,23]];
    const nodes=a.flatMap((r,i)=>r.map((v,j)=>cell("m"+i+j,"a["+i+"]["+j+"]",v,hex(0x6400+4*(3*i+j)),215+j*183,85+i*125)));
    const frames=[], vars={i:1,j:2,"基址":"0x6400"};
    const step=(line,title,note,focus=[])=>frames.push(frame(line,title,note,nodes,[],vars,focus));
    step(-1,"定位第 1 行第 2 列","C++ 原生二维数组 int a[2][3] 由两个连续的行数组组成。这里下标从 0 开始，一个 int 占 4 字节。");
    vars.rowBytes=12;step(0,"算出一整行的字节数","每行 3 个 int，sizeof a[0] = 3 × 4 = 12 字节。",["m00","m01","m02"]);
    vars.offset=12;step(1,"先跨过一行","i 是 1，跨过 12 字节到 0x640C，这是 a[1][0] 的地址。",["m10"]);
    vars.offset=20;step(2,"再跨过两列","再加 2 × 4 = 8 字节，共距基址 20 个字节。十进制 20 对应十六进制 14。",["m12"]);
    vars.p="0x6414";step(3,"让 p 指向目标格","&a[1][2] 得到目标 int 的地址，本图中为 0x6414。",["m12"]);
    vars.value=23;step(4,"读取那个地址中的值","*p 读取该 int，结果为 23。地址差是字节数，数组下标是元素数量。",["m12"]);
    lessons.push({id:"matrix-address",group:linear,title:"二维数组的地址",subtitle:"先跨行，再跨列",chapter:"数组与存储",goal:"从基址 0x6400 推出 a[1][2] 的示意地址。",invariant:"行主序下，前 i 行一共含 i × 列数个元素；每个元素占 sizeof(int) 字节。",cost:"已知维度、下标与首址，计算地址和随机读取都为 Θ(1)。",boundary:"公式适用于连续行数组。各行分别分配的 int** 需要先读取行指针；字节宽度由具体 C++ 实现决定。",code:["size_t rowBytes = sizeof a[0];","size_t offset = i * rowBytes;","offset += j * sizeof a[0][0];","int* p = &a[i][j];","int value = *p;"],frames,quiz:quiz("同一示例中的 a[1][0] 相对基址偏移几个字节？",["3","4","12"],2,"它前面正好有一整行 3 个 int，每个占 4 字节。")});
  }

  {
    const packed=[11,21,22,31,32,33];
    const labels=["(0,0)","(1,0)","(1,1)","(2,0)","(2,1)","(2,2)"];
    const nodes=row(packed,"s","B[",158,(_,k)=>labels[k]).map((n,i)=>({...n,label:"B["+i+"]"}));
    const frames=[];let i=0,j=2,start,k;
    const step=(line,title,note,focus=[])=>frames.push(frame(line,title,note,nodes,[],{i,j,...(start===undefined?{}:{start}),...(k===undefined?{}:{k})},focus));
    step(-1,"要查 A[0][2]","三阶对称矩阵把下三角（含对角线）逐行装入 B。图中括号给出每格所代表的矩阵坐标。");
    [i,j]=[j,i];step(0,"先把坐标折到下三角","对称性保证 A[0][2] = A[2][0]，交换行、列下标。",["s3"]);
    start=i*(i+1)/2;step(1,"数清前面完整的行","第 0 行存 1 个，第 1 行存 2 个。第 2 行之前共 1 + 2 = 3 个。",["s0","s1","s2"]);
    k=start+j;step(2,"再加本行的列号","列号是 0，所以目标刚好是第 2 行压缩段的开头 B[3]。",["s3"]);
    step(3,"读出 31","这一个格子同时代表原矩阵的 (0,2) 与 (2,0)。",["s3"]);
    lessons.push({id:"symmetric-pack",group:linear,title:"对称矩阵的压缩下标",subtitle:"把三角数从行长推出来",chapter:"数组与矩阵",goal:"用“前面多少格，加上行内偏移”找出压缩后的位置。",invariant:"归一化到 i ≥ j 后，第 i 个存储段有 i + 1 个元素，前 i 段共 i(i + 1)/2 个。",cost:"n 阶矩阵存 n(n + 1)/2 格，定位时间 Θ(1)。",boundary:"此例下标从 0 开始、按行存下三角且含对角线。改存上三角、按列存储或从 1 编号，都要重新数行和偏移；需避免整数乘法溢出。",code:["if (i < j) std::swap(i, j);","size_t start = i * (i + 1) / 2;","size_t k = start + j;","return B[k];"],frames,quiz:quiz("同样的约定下，A[1][2] 对应 B 的哪个下标？",["3","4","5"],1,"先变换为 (2,1)。前两行有 3 格，再向右 1 格，所以是 B[4]。")});
  }

  {
    const source=[[0,1,7],[0,2,9],[1,0,4],[2,1,5]],dest=Array(4).fill(null);
    const count=[0,0,0],next=[0,0,0],frames=[];
    const visible=(v)=>v?v.join(","):"空";
    const nodes=()=>[...row(source.map(visible),"s","原表 ",74,()=>"(行,列,值)"),...row(dest.map(visible),"d","转置表 ",212,()=>"(行,列,值)")];
    const step=(line,title,note,vars={},focus=[])=>frames.push(frame(line,title,note,nodes(),[],{count:count.join("，"),next:next.join("，"),...vars},focus));
    step(-1,"交换坐标后，还要按行归组","原三元组表按 (行,列) 排序。每个旧列变成一行，先算它在输出表里占哪一段。");
    for(let z=0;z<source.length;z++){
      const c=source[z][1];count[c]++;
      step(0,"统计旧列 "+c,"读原表下标 "+z+"，将该列的计数加 1。",{z},["s"+z]);
    }
    step(1,"输出第 0 行从下标 0 起写","count = [1,2,1]。三段长度已知，起点由前面各段的长度和决定。");
    for(let c=1;c<3;c++){
      next[c]=next[c-1]+count[c-1];
      step(2,"算出第 "+c+" 段的起点","前一段起点 "+next[c-1]+" 加长度 "+count[c-1]+"，得到 "+next[c]+"。",{c});
    }
    for(let z=0;z<source.length;z++){
      const [r,c,v]=source[z],k=next[c];
      dest[k]=[c,r,v];step(4,"把 ("+r+","+c+","+v+") 写入结果","新坐标为 ("+c+","+r+")，按 next["+c+"] 写到下标 "+k+"。",{z},["s"+z,"d"+k]);
      next[c]++;step(5,"该段写入指针后移","下个原列为 "+c+" 的条目会写进本段的下一格。",{z},["d"+k]);
    }
    lessons.push({id:"sparse-transpose",group:linear,title:"三元组的快速转置",subtitle:"用计数和段首一次写到正确位置",chapter:"稀疏矩阵",goal:"无需比较排序，把稀疏矩阵的非零项写成有序转置表。",invariant:"段首算完后，每次分发写入前，next[c] 是输出第 c 行下一可写位置。顺序扫描原表保证同一新行内的列号有序。",cost:"列数 C、非零项 t 时，时间 Θ(C + t)，输出表外辅助空间 Θ(C)。",boundary:"输入按原行、列升序，同一坐标至多一个条目，count 与 next 初始全零。空列计数为 0，可与下一列共用起点。",code:["for (auto e : A) ++count[e.col];","next[0] = 0;","for (int c=1; c<C; ++c) next[c]=next[c-1]+count[c-1];","for (auto e : A) {","    B[next[e.col]] = {e.col, e.row, e.value};","    ++next[e.col]; }"],frames,quiz:quiz("两个原列都为 1 的条目，为何能在转置表中保持新列递增？",["每次写入后都会排序","原表按原行递增扫描，原行正是新列","二者有相同的新列号"],1,"这两个条目按原行 0、2 被读到，并被连续写入新行 1，产生新列 0、2。")});
  }

  {
    const co=[[90,75],[375,75],[675,75],[375,215],[675,215]];
    const nodes=[["a","原子"],["子表","表元素"],["d","原子"],["b","原子"],["c","原子"]].map(([v,t],i)=>cell("g"+i,t,v,hex(0x7200+0x20*i),...co[i]));
    const edges=[edge("g0","g1","next"),edge("g1","g2","next"),edge("g1","g3","child"),edge("g3","g4","next")];
    const vars={L:"0x7200"},frames=[];
    const step=(line,title,note,focus=[])=>frames.push(frame(line,title,note,nodes,edges,vars,focus));
    step(-1,"读广义表 (a, (b,c), d)","上层链有 3 个元素，中间元素是一张子表。next 通向同一层下一个元素，child 进入子表第一项。",["g0","g1","g2"]);
    vars.first="a";step(0,"读 L 的表头","第一个元素是原子 a。表头可以是一个原子，也可以是一张子表。",["g0"]);
    vars.rest="0x7220";step(1,"取 L 的表尾","表尾是删去首元素后的整张表，即 ((b,c),d)。rest 指向这段同层后缀的第一项。",["g1","g2"]);
    vars.sub="0x7260";step(2,"查看表尾的第一个元素","它是子表 (b,c)。沿 rest 的 child 进入该表，此时 sub 指向 b 所在元素。",["g1","g3"]);
    vars.x="b";step(3,"读取子表表头","子表 (b,c) 的表头是 b。这次读取只访问 sub 指向的一个原子。",["g3"]);
    vars.innerTail="0x7280";step(4,"取子表表尾","得到单元素表 (c)，其表示是从 c 所在元素开始的同层链。",["g4"]);
    lessons.push({id:"generalized-head-tail",group:linear,title:"广义表的两种方向",subtitle:"分清同层后继与子表入口",chapter:"广义表",goal:"推导 (a,(b,c),d) 的表头、表尾以及嵌套子表的表尾。",invariant:"每次取 tail 都在同一层去掉一个首元素。只有遇到子表元素并进入 child，层次才会改变。",cost:"在示例的共享链式表示中，取头或取尾引用均为 Θ(1)。若题目要求深拷贝结果，另计复制成本。",boundary:"空表没有可取的表头和表尾。单元素表的表尾是空表；表头与只有该元素的表是两种对象。片段仅处理所示结构，通用代码须检查标签和空指针。",code:["char first = L->atom;","Elem* rest = L->next;","Elem* sub = rest->child;","char x = sub->atom;","Elem* innerTail = sub->next;"],frames,quiz:quiz("对 L=(a,(b,c),d)，Head(Tail(L)) 是什么？",["b","(b,c)","((b,c),d)"],1,"Tail(L) 是 ((b,c),d)。这张表的第一个元素是一整张子表 (b,c)。")});
  }

  {
    const tokens=["1","+","2","*","3","-","4"], values=[],ops=[],frames=[];
    let token="—",a,b,op;
    function step(line,title,note){
      const nodes=[...row(values,"v","数栈 ",78,(_,i)=>i===values.length-1?"栈顶":"数值"),...row(ops,"o","符号栈 ",206,(_,i)=>i===ops.length-1?"栈顶":"运算符")];
      frames.push(frame(line,title,note,nodes,[],{token,...(a===undefined?{}:{a}),...(b===undefined?{}:{b}),...(op===undefined?{}:{op})}));
    }
    function reduce(){
      b=values.pop();step(1,"先弹出右操作数 "+b,"先出来的值在中缀表达式中靠右，减法尤其要留心。");
      a=values.pop();step(2,"再弹出左操作数 "+a,"运算方向按 a 运算 b。");
      op=ops.pop();step(3,"取出待算符号 "+op,"这个符号与刚取出的两个数构成一次运算。");
      const v=op==="+"?a+b:op==="-"?a-b:a*b;
      values.push(v);step(4,"把结果 "+v+" 压回数栈",a+" "+op+" "+b+" 的结果可以继续充当以后运算的操作数。");
      a=undefined;b=undefined;op=undefined;
    }
    step(-1,"求 1 + 2 × 3 − 4","两个栈均从左到右显示栈底到栈顶。乘法优先级更高，三个运算符均为左结合。");
    const precedence=op=>op==="*"?2:1;
    for(const t of tokens){
      token=t;
      if(/^\d$/.test(t)){
        values.push(+t);step(6,"数字 "+t+" 入栈","读到操作数，先保存它，等相邻运算符的结合顺序确定。");
      }else{
        while(ops.length&&precedence(ops.at(-1))>=precedence(t)){
          step(8,"先算栈顶的 "+ops.at(-1),"栈顶优先级大于或等于当前 "+t+"，在当前运算符入栈前规约。");reduce();
        }
        ops.push(t);step(9,"符号 "+t+" 入栈","优先级约束已满足，等待右侧操作数。");
      }
    }
    token="结束";
    while(ops.length){step(10,"输入结束，清算剩余符号","操作数都已读入，栈顶运算可以完成。");reduce();}
    step(11,"返回 "+values[0],"符号栈已空，数栈中唯一的值就是表达式的结果。");
    lessons.push({id:"expression-stacks",group:linear,title:"双栈表达式求值",subtitle:"乘法先算，减法分左右",chapter:"栈与队列",goal:"用优先级与结合性解释 1 + 2 × 3 − 4 的每次规约。",invariant:"数栈保存已计算的操作数，符号栈保存还在等右侧结合顺序确定的运算符。",cost:"每个 token 的入栈、出栈次数为常数，时间 Θ(n)，辅助空间 O(n)。",boundary:"片段假设 token 串合法、含非负整数及二元 +、−、*，运算不溢出。括号、一元负号、右结合运算符需额外规则。pop 返回并移除栈顶。",code:["auto reduce = [&] {","    int b = pop(values);","    int a = pop(values);","    char op = pop(ops);","    values.push(apply(a, op, b)); };","for (Token t : input) {","    if (t.isNumber()) values.push(t.number());","    else { while (!ops.empty() && prec(ops.top()) >= prec(t.op()))","        reduce();","        ops.push(t.op()); } }","while (!ops.empty()) reduce();","return values.top();"],frames,quiz:quiz("处理完 1 + 2 × 3，读到减号时，哪个算式最先执行？",["1 + 2","3 − 4","2 × 3"],2,"乘号位于符号栈顶，且优先级高于减号。乘积 6 入栈后，加号也应先于同级的新减号规约。")});
  }

  {
    const data=[8,4,7,1,3],frames=[];let gap,i,j,x;
    const step=(line,title,note,focus=[])=>frames.push(frame(line,title,note,row(data,"s","a",145),[],{...(gap===undefined?{}:{gap}),...(i===undefined?{}:{i}),...(j===undefined?{}:{j}),...(x===undefined?{}:{x})},focus.map(k=>"s"+k)));
    step(-1,"用增量 2、1 排序","先让间隔两个位置的值组成子序列，各自在组内插入排序，再处理相邻元素。");
    for(const g of [2,1]){
      gap=g;step(0,"增量改为 "+gap,gap===2?"本轮的组为下标 0、2、4 和 1、3。":"所有位置归入同一组，完成最后一趟插入排序。");
      for(i=gap;i<data.length;i++){
        x=data[i];j=i;step(2,"取出待插入值 "+x,"x 保存待插入的值，j 跟踪当前空位。",[i]);
        while(j>=gap&&data[j-gap]>x){
          data[j]=data[j-gap];step(4,"同组较大值后移 "+gap+" 格","比较同组前驱与 x，较大值复制到当前空位。",[j-gap,j]);
          j-=gap;step(5,"空位前移","原来那个较大值已经复制到后面，继续检查前一个同组元素。",[j]);
        }
        data[j]=x;step(6,"把 "+x+" 放进空位","本组已处理的前缀恢复有序。",[j]);
        x=undefined;j=undefined;
      }
      i=undefined;
    }
    lessons.push({id:"shell-sort",group:order,title:"希尔排序的分组插入",subtitle:"隔着两个格子做插入排序",chapter:"排序",goal:"跟踪 gap 从 2 缩到 1 的过程，指出每轮保证哪几组有序。",invariant:"一次增量 g 的整趟结束时，各组 a[r],a[r+g],… 分别有序。最后 g = 1 把全表变成一组。",cost:"额外空间 O(1)。时间取决于增量序列；本例固定两趟，推广到 n 个元素的最坏时间 O(n²)。",boundary:"增量应为正且最后含 1。希尔排序通常不稳定，长距离移动可以改变相等元素的相对次序。",code:["for (int gap : {2, 1}) {","    for (int i = gap; i < n; ++i) {","        int x = a[i], j = i;","        while (j >= gap && a[j-gap] > x) {","            a[j] = a[j-gap];","            j -= gap; }","        a[j] = x; } }"],frames,quiz:quiz("增量 2 的整趟刚结束时一定能保证什么？",["全表有序","下标 0、2、4 组内有序，1、3 组内也有序","两组最大值相同"],1,"跨组元素未必比较过。只有各个余数类内相邻的同组元素已经有序。")});
  }

  {
    const data=[4,2,7,3,1],frames=[],pos=[[400,50],[212,144],[587,144],[85,238],[329,238]];
    let end=data.length;
    function step(line,title,note,vars={},focus=[]){
      const nodes=data.map((v,i)=>cell("h"+i,"a["+i+"]",v,i>=end?"已归位":"待处理",...pos[i]));
      const edges=data.flatMap((_,i)=>i&&i<end?[edge("h"+((i-1)>>1),"h"+i,"")]:[]);
      frames.push(frame(line,title,note,nodes,edges,{end,"数组":data.join("，"),...vars},focus.map(i=>"h"+i)));
    }
    function sift(start){
      let i=start;
      while(2*i+1<end){
        let c=2*i+1;
        if(c+1<end&&data[c+1]>data[c])c++;
        step(3,"选择最大孩子 "+data[c],"下标 "+c+" 是当前父亲在有效前缀中的较大孩子。",{i,c},[i,c]);
        if(data[i]>=data[c]){step(4,"堆序已经满足","父值不小于较大孩子，修复结束。",{i,c},[i,c]);break;}
        [data[i],data[c]]=[data[c],data[i]];
        const oldIndex=i;
        i=c;
        step(5,"向下交换","较大孩子上升，i 已移动到被换下的值所在格。",{i,c},[oldIndex,c]);
      }
    }
    step(-1,"把无序数组排成升序","先从最后一个非叶子向前建最大堆，再逐个取出堆顶，将它放在有效前缀末尾。");
    for(let p=Math.floor(data.length/2)-1;p>=0;p--){
      step(6,"从下标 "+p+" 向下调整","此结点的两棵子树已分别是堆。",{p},[p]);sift(p);
    }
    while(end>1){
      const last=end-1;
      [data[0],data[last]]=[data[last],data[0]];
      step(8,"把最大值 "+data[last]+" 放到下标 "+last,"堆顶与当前末格交换。下一句缩短有效前缀。",{},[0,last]);
      end--;step(9,"有序后缀扩大一格","下标从 "+end+" 起的元素已归位，后续下滤只能在 [0,end) 中进行。",{},[end]);
      step(10,"从根修复剩余前缀","末值替代了旧堆顶，只有从根向下的一条路径可能需要修复。",{},[0]);sift(0);
    }
    step(7,"只剩最小值，全表有序","end 等于 1，唯一剩余值位于下标 0。升序结果为 1、2、3、4、7。",{},[0]);
    lessons.push({id:"heap-sort-full",group:order,title:"堆排序的完整轨迹",subtitle:"一边缩堆，一边长出有序后缀",chapter:"优先级队列与排序",goal:"区分线性建堆阶段和逐次取最大值阶段。",invariant:"每轮取顶前，[0,end) 为最大堆，[end,n) 已升序且其元素不小于堆内元素。",cost:"自底向上建堆 Θ(n)，完整排序最坏 Θ(n log n)，原地迭代实现的辅助空间 O(1)。",boundary:"使用零基下标、end 为开边界。空数组及单元素数组无需取顶。堆排序通常不稳定。此处使用可表示示例下标的有符号 int。",code:["auto sift = [&](int i) {","    while (2*i + 1 < end) {","        int c = 2*i + 1;","        if (c+1 < end && a[c+1] > a[c]) ++c;","        if (a[i] >= a[c]) break;","        std::swap(a[i], a[c]); i = c; } };","for (int p = n/2-1; p >= 0; --p) sift(p);","while (end > 1) {","    std::swap(a[0], a[end-1]);","    --end;","    sift(0); }"],frames,quiz:quiz("每次取顶以后，为何必须先缩短 end 再下滤？",["避免刚归位的最大值重新参与堆调整","因为末格对象已经析构","因为根地址变了"],0,"末格已经是最终位置。若还把它作为有效堆成员，下滤可能把它重新换回前缀。")});
  }
  {
    const pre=["A","B","D","E","C"], ino=["D","B","E","A","C"];
    const geometry={A:[400,50],B:[225,142],C:[590,142],D:[90,236],E:[340,236]};
    const children={},frames=[];let cursor=0;
    function step(line,title,note,vars={},focus=[]){
      const nodes=Object.keys(children).map(key=>cell(key,"结点",key,"中序下标 "+ino.indexOf(key),...geometry[key]));
      const edges=Object.entries(children).flatMap(([p,[l,r]])=>[...(l?[edge(p,l,"左")]:[]),...(r?[edge(p,r,"右")]:[])]);
      frames.push(frame(line,title,note,nodes,edges,{"先序":pre.join(" "), "中序":ino.join(" "),cursor,...vars},focus));
    }
    function build(lo,hi){
      const range="["+lo+", "+hi+")";
      if(lo===hi){step(1,"空区间返回空孩子","中序片段 "+range+" 中没有任何结点，不消费先序元素。",{"中序区间":range});return null;}
      const key=pre[cursor++],p=ino.indexOf(key);
      step(2,"先序首项 "+key+" 是这棵子树的根","消费一项后 cursor 变为 "+cursor+"；其余结点来自当前中序区间 "+range+"。",{"中序区间":range,key});
      step(3,"在中序中切开左右","根 "+key+" 的中序下标是 "+p+"。左区间为 ["+lo+","+p+")，右区间为 ["+(p+1)+","+hi+")。",{"中序区间":range,key,p});
      children[key]=[null,null];
      step(4,"分配结点 "+key,"左右孩子先初始化为空，递归返回后再写回。",{key,p},[key]);
      const left=build(lo,p);children[key][0]=left;
      step(5,"写回 "+key+" 的左孩子",left?"左区间已完成，返回其根 "+left+"。":"左区间为空，写入 nullptr。",{key,"左孩子":left||"nullptr"},left?[key,left]:[key]);
      const right=build(p+1,hi);children[key][1]=right;
      step(6,"写回 "+key+" 的右孩子",right?"右区间已完成，返回其根 "+right+"。":"右区间为空，写入 nullptr。",{key,"右孩子":right||"nullptr"},right?[key,right]:[key]);
      step(7,"将 "+key+" 返回给上一层","这棵子树的两个孩子均已确定。",{key,"返回":key},[key]);
      return key;
    }
    step(-1,"先序给根，中序划界","两序列含同一批互异的键。cursor 指向下一个尚未消费的先序元素，index 是预建的中序下标表。");
    const root=build(0,ino.length);
    step(8,"接收整棵树的根","从 A 按根、左、右重读为 A B D E C；按左、根、右重读为 D B E A C。",{root},[root]);
    lessons.push({id:"tree-reconstruct",group:trees,title:"从两次遍历重建树",subtitle:"先序选根，中序分割左右",chapter:"二叉树",goal:"从先序 A B D E C 和中序 D B E A C 重建一棵普通二叉树。",invariant:"build(lo,hi) 恰消费属于中序 [lo,hi) 的先序元素；返回时这段对应的完整子树已建好。",cost:"预建哈希下标表且查询期望 O(1) 时，总期望时间 Θ(n)。下标表 O(n)，递归栈 O(h)。",boundary:"要求键互异且两序列相容。若键重复、仅给先序与后序、或未保证是同一棵树，重建可能不唯一或失败。生产实现需要检查 cursor、键集合和切割区间。",code:["Node* build(int lo, int hi) {","    if (lo == hi) return nullptr;","    char k = pre[cursor++];","    int p = index.at(k);","    auto* n = new Node{k,nullptr,nullptr};","    n->left = build(lo, p);","    n->right = build(p + 1, hi);","    return n; }","root = build(0, n);"],frames,quiz:quiz("第一次选出 A 后，为何先序的 B、D、E 全都属于左子树？",["因为字母序小于 A","中序中 A 左边共有三个元素，先序中根后先遍历左子树","因为 B 与 E 深度相同"],1,"中序 D B E | A | C 决定了左子树规模是 3；先序的根后连续三项正好属于它。")});
  }

  {
    const n=10,frames=[],counts=[0,0,0,0],lens=[1,2,4,8];
    let hits=0,i,j;
    const step=(line,title,note,focus=[])=>frames.push(frame(line,title,note,
      counts.map((v,k)=>cell("r"+k,"i = "+lens[k],v,"本轮累计执行",100+k*200,148)),[],
      {n,hits,...(i===undefined?{}:{i}),...(j===undefined?{}:{j})},focus));
    step(-1,"外层翻倍，内层做 i 次","数清工作量再判断数量级。四个格子记录本输入下各轮对总次数的贡献。");
    step(0,"计数器置零","只统计 ++hits 的执行次数。");
    for(i=1;i<=n;i*=2){
      const id=lens.indexOf(i);
      step(1,"开始 i = "+i+" 这一轮","内层将取 j = 0 到 "+(i-1)+"。",["r"+id]);
      for(j=0;j<i;j++){
        hits++;counts[id]++;
        step(3,"第 "+hits+" 次基本操作","i = "+i+"，j = "+j+"。该轮已完成 "+counts[id]+" 次。",["r"+id]);
      }
      j=undefined;
    }
    step(1,"16 超过 n = 10","外层条件为假，1 + 2 + 4 + 8 = 15。四轮的工作量不同，不能用四个等长的内层计算。");
    lessons.push({id:"loop-count",group:linear,title:"嵌套循环的真实次数",subtitle:"把每一轮加起来，再判复杂度",chapter:"算法分析",goal:"由 n = 10 推导一般 n 的几何级数总和。",invariant:"第 k 轮 i = 2ᵏ，该轮贡献恰好 2ᵏ 次 ++hits。总次数为各轮贡献之和。",cost:"对 n ≥ 1，令 m = ⌊log₂ n⌋，次数为 2^(m+1) − 1，介于 n 与 2n 之间（含下界），故时间 Θ(n)，额外空间 Θ(1)。",boundary:"n = 0 时循环不执行。分析采用整数足以表示 i、hits 的模型；实际有限整数实现需防止翻倍及累计溢出。",code:["long long hits = 0;","for (long long i = 1; i <= n; i *= 2) {","    for (long long j = 0; j < i; ++j)","        ++hits; }"],frames,quiz:quiz("若 n 从 10 改成 15，++hits 一共执行几次？",["15 次","16 次","30 次"],0,"外层仍只取 1、2、4、8。下一轮 16 超过 15，四轮工作量之和还是 15。")});
  }

  {
    const files=[[1,5,8,12],[2,3,9,11]],cursor=[0,0],buf=[[],[]],out=[],written=[];
    let reads=0,writes=0,chosen;
    const frames=[];
    function step(line,title,note,focus=[]){
      const buffers=[...buf,out];
      const nodes=buffers.map((xs,i)=>cell("b"+i,["A 输入页","B 输入页","输出缓冲"][i],xs.join(" | ")||"空","页容量 2",160+240*i,70));
      written.forEach((page,i)=>nodes.push(cell("p"+i,"磁盘页 "+i,page.join(" | "),"已写出",90+202*i,214)));
      const vars={"磁盘段 A":"1,5 | 8,12","磁盘段 B":"2,3 | 9,11","输入页读取":reads,"输出页写入":writes,...(chosen===undefined?{}:{source:chosen?"B":"A"})};
      frames.push(frame(line,title,note,nodes,[],vars,focus));
    }
    step(-1,"用三页内存归并两段有序文件","每页能容纳 2 条记录。两个输入段已经有序，内存最多各保留一页输入及一页输出。");
    while(cursor.some((p,k)=>p<files[k].length||buf[k].length)){
      for(let k=0;k<2;k++){
        if(!buf[k].length&&cursor[k]<files[k].length){
          buf[k]=files[k].slice(cursor[k],cursor[k]+2);cursor[k]+=buf[k].length;reads++;
          step(k===0?1:2,"读取 "+(k?"B":"A")+" 的下一页","对应输入缓冲区已空且磁盘仍有记录，整页读取 "+buf[k].join("、")+"。",["b"+k]);
        }
      }
      chosen=!buf[1].length || (buf[0].length&&buf[0][0]<=buf[1][0])?0:1;
      const v=buf[chosen][0];
      step(3,"选择段 "+(chosen?"B":"A")+" 的 "+v,"只比较两个非空输入页的首项。一段耗尽时直接选另一段。",["b"+chosen]);
      out.push(buf[chosen].shift());
      step(4,"把 "+v+" 放入输出缓冲","输入页前进一个记录，输出页暂存已确定的下一项。",["b"+chosen,"b2"]);
      if(out.length===2){written.push(out.splice(0));writes++;step(5,"输出页满，顺序写盘","把整页追加到磁盘输出文件，清空输出缓冲以便继续。",["p"+(written.length-1)]);}
      chosen=undefined;
    }
    step(6,"完成一趟二路归并","共读 4 页、写 4 页。输出记录数恰好是整页的倍数，此刻没有尾页需要补写。");
    lessons.push({id:"external-merge",group:order,title:"外部排序的一趟归并",subtitle:"在内存页和磁盘段之间搬运",chapter:"排序",goal:"用两个输入缓冲页与一个输出缓冲页，把两个有序段顺序合并。",invariant:"输出文件与输出缓冲中的记录构成全局有序前缀；下一项必来自两段尚未输出的最小首项。",cost:"单趟归并 N 条记录为 Θ(N) 比较与移动。示例页容 2，读 4 页写 4 页；多趟归并还需累计各趟 I/O。",boundary:"该实验从两个已排序的磁盘段开始。最后不足一页也须写出；一段耗尽后仍要排空另一段。比较相等时先取前段可保持跨段稳定性。",code:["while (unreadA() || unreadB() || !A.empty() || !B.empty()) {","    if (A.empty() && unreadA()) readPageA();","    if (B.empty() && unreadB()) readPageB();","    auto& src = B.empty() || (!A.empty() && A.front() <= B.front()) ? A : B;","    out.push_back(popFront(src));","    if (out.size() == 2) flush(out); }","if (!out.empty()) flush(out);"],frames,quiz:quiz("记录总数为 7、每页容纳 2 条时，输出一共要写几页？",["3 页","4 页","7 页"],1,"前三页各有 2 条，最后剩余的 1 条也要单独冲刷成尾页。")});
  }
  globalThis.ATLAS.push(...lessons);
})();
