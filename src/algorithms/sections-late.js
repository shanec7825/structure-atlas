const SECTIONS_LATE = (() => {
  'use strict';
  const drill=(title,task,answer)=>({title,task,answer});
  const preset=(label,input)=>({label,input});
  const integers=s=>{
    const tokens=String(s??'').trim().split(/[\s,，]+/u);
    return tokens.length<=40 && tokens.every(t=>/^-?\d{1,7}$/u.test(t))?tokens.map(Number):null;
  };
  const list=a=>'['+a.join(', ')+']';

  function probeDemo(input){
    const keys=integers(input);
    if(!keys)return ['请输入 1–40 个整数，用空格分开。'];
    const slots=Array(7).fill(null),log=[];
    for(const key of keys){
      const h=((key%7)+7)%7,route=[];let placed=false;
      for(let d=0;d<7;d++){
        const i=(h+d)%7;route.push(i);
        if(slots[i]===null||slots[i]===key){
          const duplicate=slots[i]===key;slots[i]=key;placed=true;
          log.push(key+' 从 '+route.join(' → ')+' '+(duplicate?'找到同键，保留原槽。':'落位。'));break;
        }
      }
      if(!placed)log.push(key+' 已探测 7 槽，表满。');
    }
    log.push('槽 0–6：'+slots.map(v=>v===null?'·':v).join(' / '));return log;
  }
  function heapSortDemo(input){
    const a=integers(input);
    if(!a)return ['请输入 1–40 个整数，用空格分开。'];
    const log=['输入 '+list(a)];
    function down(i,n){
      while(i*2+1<n){
        let child=i*2+1;
        if(child+1<n&&a[child+1]>a[child])++child;
        if(a[i]>=a[child])break;
        [a[i],a[child]]=[a[child],a[i]];i=child;
      }
    }
    for(let i=Math.floor(a.length/2)-1;i>=0;i--){down(i,a.length);log.push('修好以槽 '+i+' 为根的堆：'+list(a));}
    for(let n=a.length;n>1;n--){
      [a[0],a[n-1]]=[a[n-1],a[0]];down(0,n-1);
      log.push('堆 '+list(a.slice(0,n-1))+'，已排后缀 '+list(a.slice(n-1)));
    }
    log.push('升序结果 '+list(a));return log;
  }
  function bmDemo(input){
    const pair=String(input??'').split('|');
    if(pair.length!==2)return ['格式为 正文|模式，两侧各写一串。'];
    const t=Array.from(pair[0].trim()),p=Array.from(pair[1].trim()),m=p.length;
    if(t.length>80||m>20)return ['演示允许最多 80 个正文符号、20 个模式符号。'];
    if(!m)return ['空模式的首次匹配在下标 0。'];
    const last=new Map(p.map((c,i)=>[c,i]));
    // Construct a small, auditable strong good-suffix table by checking candidate shifts.
    // Full-sized implementations can preprocess this table in linear time.
    const gs=p.map((_,j)=>{
      if(j===m-1)return 1;
      for(let shift=1;shift<=m;shift++){
        if(j>=shift&&p[j-shift]===p[j])continue;
        let ok=true;
        for(let k=j+1;k<m;k++)if(k>=shift&&p[k-shift]!==p[k]){ok=false;break;}
        if(ok)return shift;
      }
      return m;
    });
    const log=['由右往左核对。失配下标 0 至 '+(m-1)+' 的好后缀位移为 '+list(gs)+'。'];
    for(let s=0;s+m<=t.length;){
      let j=m-1;
      while(j>=0&&p[j]===t[s+j])--j;
      if(j<0){log.push('首次命中下标 '+s+'。');return log;}
      const bad=Math.max(1,j-(last.get(t[s+j])??-1)),good=gs[j],shift=Math.max(bad,good);
      log.push('窗口 '+s+'、失配 j='+j+'（'+t[s+j]+' / '+p[j]+'），坏字符 '+bad+'，好后缀 '+good+'，右移 '+shift+'。');s+=shift;
    }
    log.push('剩余正文装不下模式，没有匹配。');return log;
  }
  function selectDemo(input){
    const fields=String(input??'').split('|'),a=integers(fields[0]);
    const k=Number(fields[1]);
    if(fields.length!==2||!a||!Number.isInteger(k)||k<1||k>a.length)return ['输入“整数序列 | k”，k 从 1 开始且不能超过记录数。'];
    const log=[];
    function choose(arr,rank,report){
      if(arr.length<=5){
        const sorted=arr.slice().sort((u,v)=>u-v);
        if(report)log.push('小组直接排序 '+list(sorted)+'，取组内第 '+rank+' 项。');
        return sorted[rank-1];
      }
      const medians=[];
      for(let i=0;i<arr.length;i+=5){
        const g=arr.slice(i,i+5).sort((u,v)=>u-v);
        medians.push(g[Math.floor(g.length/2)]);
      }
      const pivot=choose(medians,Math.floor(medians.length/2)+1,false);
      const lower=arr.filter(v=>v<pivot),upper=arr.filter(v=>v>pivot),equal=arr.length-lower.length-upper.length;
      if(report)log.push('五个一组，各组中位数 '+list(medians)+'；其中位数 '+pivot+' 为基准。小 / 等 / 大段长 '+[lower.length,equal,upper.length].join(' / ')+'。');
      if(rank<=lower.length)return choose(lower,rank,report);
      if(rank<=lower.length+equal)return pivot;
      return choose(upper,rank-lower.length-equal,report);
    }
    const result=choose(a,k,true);
    log.push('第 '+k+' 项 = '+result+'。');return log;
  }
  return [
    {id:'9.1',title:'给一枚钥匙配回它的资料',premise:'器材借用册以编号为键、借用人为值。本例选择唯一键字典：重复 put 返回失败并保留原值。',
      mechanism:'get 按键判等。put、remove 和 size 的语义由接口约定，底层可以是散列表或有序结构。若允许多个同键词条，还要约定查到、删掉哪一个。',
      trace:['put(17,林) 成功，大小为 1。','put(17,许) 遇同键返回失败，get(17) 仍得林。','put(22,林) 成功；值相同不妨碍键不同。','remove(17) 后只剩键 22；再次查询 17 返回缺失。'],
      check:'空册中先存 (3,北)、(4,北)，删除 3，再存 (3,南)。size 和 get(3) 各是什么？',answer:'size=2，get(3)=南。删除后键 3 的位置可以被重新使用，键 4 始终存在。',
      topics:['词条与关键码','插入、读取与删除','重复键契约'],labs:['hash-probe','bst-search']},
    {id:'9.2',title:'把一排站点搭成快慢两条线',premise:'底层的有序键是 5、12、19、31；第二层只有 12、31。各层都有左右哨兵，同键上下相连。本次新塔高度固定为 2，便于复盘。',
      mechanism:'查询从最高层左哨兵出发，能向右且不越过目标就前进，否则下降。插入记录各层前驱，按抽到的塔高接入；删除摘掉同一塔的所有层并回收空顶层。在独立、固定概率提升时，期望操作 O(log n)、空间 O(n)，最坏查询 O(n)。',
      trace:['查 19。高层走到 12，右邻 31 会越界，沿 12 的塔下降。','在底层从 12 向右一步读到 19；查 17 则会在 12 与 19 的缝隙停止。','插入 17。底层接成 12→17→19，高层接成 12→17→31，新建两层之间的竖向链接。','删除 12。两层分别绕过它，底层变为 5、17、19、31，高层为 17、31。'],
      check:'在最终结构查 18。最后一个不大于目标的键是几？从哪里知道 18 不存在？',answer:'前驱为 17。高层从 17 下行，底层下一键 19 大于 18，底层有序且保存了全部键。',
      topics:['四联结点','逐层查找','塔的插入与删除','随机提升与期望高度'],labs:['skip-list-find','double-list']},
    {id:'9.3',title:'同一门牌来了三位客人',premise:'容量 7，整数键的起始槽是数学意义下的 k mod 7。本例按顺序插入 5、12、19，线性探测遇占用就右移并回绕。',
      mechanism:'散列码先将键转换为整数，再压缩到槽范围。同槽不同键需判等并解决冲突；装载率 n/m 增大通常拉长探测。计算整串的散列码还要读入其字符。',
      trace:['三个键的起始槽都是 5。键 5 落入 T[5]。','12 检查 5、6，落入 6。19 检查 5、6、0，落入 0。','删掉 12 时给槽 6 留墓碑。查 19 经过墓碑，仍在槽 0 命中。','扩到 11 槽，按新函数重插存活键，5 去 5、19 去 8，旧墓碑消失。'],
      check:'原表仍为 7 槽，删除 12 后查不存在的 26；从 5 起会检查哪些下标？',answer:'5、6、0、1。5 和 19 都不匹配，6 是墓碑，首次遇到从未占用的槽 1 才停止。',
      topics:['整数与字符串的散列码','地址压缩与装载率','独立链与公共溢出区','线性、平方与双重散列','惰性删除与重散列'],labs:['hash-probe','hash-tombstone'],
      drills:[drill('让字序影响散列码','给字符 A=1、B=2，逐字按 h=(3h+c) mod 7 累积。AB 和 BA 各落在哪个槽？','AB 为 (3×1+2) mod 7=5，BA 为 (3×2+1) mod 7=0。码对不同键仍可能碰撞。'),
        drill('换一种碰撞处理','起点 5 连续冲突。在 7 槽中分别列出平方探测 (5+d²) mod 7 和固定步长 3 的头四个位置；独立链如何放这三个键？','平方探测走 5、6、2、0，并不保证遍历全部槽。步长 3 走 5、1、4、0，因 gcd(3,7)=1 可遍历所有槽。独立链把三个词条挂在桶 5 的链中；公共溢出区则给各起点共享额外存储区。'),
        drill('第二个散列函数怎样拆散队伍','取 h₁(k)=k mod 7，h₂(k)=1+(k mod 6)，探测 (h₁+d·h₂) mod 7。比较 5、12 的前三个探测槽。','5 的步长 6，走 5、4、3；12 的步长 1，走 5、6、0。起点虽同，后续路线不同。容量 7 是素数，1 到 6 的步长都与它互素。'),
        drill('同属平方探测，覆盖槽数不同','以 0 为起点、模 7，依次尝试 +1²、−1²、+2²、−2²、+3²、−3²。能访问哪些槽？','连同起点依次是 0、1、6、4、3、2、5。此双向平方方案用形如 4k+3 的素数容量；单向的 d² mod 7 只给 0、1、4、2。')],
      presets:[preset('挤在同一槽','5 12 19'),preset('负键与重复键','-2 5 12 5')],demo:probeDemo},
    {id:'9.4',title:'空桶能量出多宽的缺口',premise:'整数读数 4、6、7、24、27。要找升序相邻读数的最大差，只记录桶内最小值和最大值。',
      mechanism:'n≥2 且最大值大于最小值时，最大间隙至少为向上取整的平均间距。以此作整数桶宽，每个桶内差至多宽度减一，最大间隙必在两个相邻非空桶之间。只扫描一次输入和 O(n) 个桶。',
      trace:['全距 27−4=23，4 个相邻间距，桶宽取 ⌈23/4⌉=6。','以 4 为起点，首桶覆盖 4…9，留 min=4、max=7。两个中间桶为空。','末桶覆盖 22…27，留 min=24、max=27。从首桶 max 跨到末桶 min，得到最大差 24−7=17。'],
      check:'换成 10、10、11、20，按同一规则最大间隙是多少？',answer:'9。桶宽 ⌈10/3⌉=4，10 和 11 同桶；20 与前面非空桶的最大值 11 相差 9。全相等时可直接返回 0。',
      topics:['直接分桶','最大间隙','低位优先基数排序','稳定分配与收集'],labs:['radix-lsd','sort-stable-merge'],
      drills:[drill('桶内保持到达顺序','两位编号依次为 31、12、21、13。先按个位稳定分桶并收集，再按十位做同样操作，两轮各是什么？','第一轮 31、21、12、13；第二轮 12、13、21、31。同一高位桶保持从上轮继承的低位顺序。若小整数键域只有 0…K，直接用 K+1 个桶可在 O(n+K) 时间收集。')]},
    {id:'10.1',title:'最高优先级是一项操作',premise:'舞台工单 A、B、C 按此顺序到达，紧急度分别为 4、9、9。比较器先取较高紧急度，同级取到达较早者。',
      mechanism:'insert 加入候选，peek 查看首选但不移除，pop 删除并返回首选；只有后两项需要知道谁排第一。数据结构内部只须维护足以找出极值的关系。空队列的返回约定应写入接口。',
      trace:['插入 A 后 peek 返回 A。再插入 B、C，B 排在同为 9 的 C 前面。','连续 peek 两次都读 B，大小仍是 3。','pop 取走 B，随后 peek 返回 C；继续 pop 的次序为 C、A。'],
      check:'在 B 出队后、第二次出队前又来一个 10 级的 D。后续次序和空队列的大小分别是什么？',answer:'D、C、A，最后大小为 0。已出队的 B 不会因为新工单到达而被追回。',
      topics:['优先级比较器','极值访问与删除','选择排序','Huffman 构树'],labs:['heap-up','heap-down','huffman'],
      drills:[drill('两种比较器，两种任务','把 3、8、5 全部入队，如何用反复删除极值排序？若要构造 Huffman 树，又该按什么顺序取根？','最大优先队列依次删出 8、5、3；从结果数组末端向前写便得到升序。Huffman 要选最小权重，先合并 3 和 5 得 8，再合并两个 8 得 16。')]},
    {id:'10.2',title:'倒着修树，顺着收成绩',premise:'零基数组 [2,8,4,1,6,7] 采用最大堆，逻辑树的孩子为 2i+1、2i+2。排序时把已放好的尾部排除出堆。',
      mechanism:'Floyd 建堆从末个内部结点 ⌊n/2⌋−1 逆序下滤；被修结点的两个孩子已经成堆。低层许多结点只能下降一两步，全部下滤高度之和 O(n)。随后 n−1 次换顶并修复，原地堆排序 O(n log n) 时间、O(1) 辅助空间，通常不稳定。',
      trace:['从 i=2 开始，4 与孩子 7 对换，数组为 [2,8,7,1,6,4]。i=1 的 8 已能压住两个孩子。','在 i=0 提升 8，再提升 6，最大堆得到 [8,6,7,1,2,4]。','换顶尾、缩短有效范围、下滤，形成 [7,6,4,1,2 | 8]；竖线右边以后不参加比较。','重复到有效范围只剩一项，升序为 [1,2,4,6,7,8]。'],
      check:'对 [3,1,4,2] 用同一规则建最大堆，再取走一次堆顶。两次得到的数组各是什么？',answer:'建堆为 [4,2,3,1]；一次换顶并下滤后为 [3,2,1 | 4]。选择孩子时应挑较大者。',
      topics:['完全二叉树的数组表示','上滤与下滤','Floyd 线性建堆','就地堆排序'],labs:['heap-up','heap-down'],
      presets:[preset('六份成绩','2 8 4 1 6 7'),preset('同值成绩','3 3 1 3 2')],demo:heapSortDemo},
    {id:'10.3',title:'两棵堆怎样沿右边接合',premise:'两棵最小左式堆。甲根 2，左右叶 6、8；乙根 3，左右叶 4、7。记空指针的 npl=0，叶的 npl=1。',
      mechanism:'合并时让根键较小的一方保留根，递归合并其右堆和另一堆；返回后必要时交换左右孩子，并令 npl=1+npl(right)。键序决定父子，空路径长决定朝向，两个条件分别维护。npl 为 r 的左式堆至少有 2ʳ−1 个结点，右路径长度为 r；合并只沿两条对数长度的右路径下降。',
      trace:['保留 2 作根，递归合并 8 和根 3。3 较小，又去合并它的右叶 7 与 8。','7 的右侧接 8 后，左侧原为空，交换孩子使 8 成为其左叶，7 的 npl 仍为 1。','回到 3，左右子树根 4 与 7 的 npl 都为 1，故 3 的 npl=2。','回到 2，原左叶 6 的 npl=1，小于新右堆 3 的 2。交换两边，最终根 2 的左孩子为 3、右孩子为 6。'],
      check:'最终删除最小值 2。应该传哪两棵堆给合并过程？新根是谁？',answer:'合并以 3 和 6 为根的两棵堆，新根是 3。也可把单结点堆同旧堆合并实现插入。',
      topics:['最短空路径长','左倾条件','递归与迭代合并思路','通过合并实现增删'],labs:['leftist-meld']},
    {id:'11.1',title:'先说清楚哪几个字符算一次出现',premise:'把「咚啪咚啪咚」作为五个离散符号，用零基下标找连续动机「咚啪咚」。两次出现允许共享字符。',
      mechanism:'串匹配要求连续且逐符号相等。长为 n 的正文对长为 m 的非空模式，候选起点为 0…n−m；本节约定空模式出现在 n+1 个边界。字符编号与编码字节偏移须分开。',
      trace:['窗口 [0,3) 等于模式，记录起点 0。','窗口 [1,4) 第一个符号不同。[2,5) 再次相等，记录 2。','此时没有足够字符组成第三个窗口。报告全部位置 [0,2]，只找首次的接口则返回 0。'],
      check:'同一正文内找「咚咚」和空模式，在上述约定下各有几次？',answer:'连续的「咚咚」有 0 次，空模式有 6 个边界位置。若题目规定禁止空模式，须按该约定提前处理。',
      topics:['字母表与字符','子串和子序列','首次与全部匹配','预处理与字符比较次数'],labs:['kmp-match','rolling-match']},
    {id:'11.2',title:'一次错位，哪些字符要重读',premise:'在 AAAB 中搜索 AAB。每个可行窗口由左向右比，记录首次命中位置，字符比较按一次等值判断计一次。',
      mechanism:'一次失配就把起点右移一格，模式游标清零。双下标写法若已匹配 j 个字符，失配时正文游标从当前位置退到 i−j+1。最坏可做 Θ((n−m+1)m) 次字符比较（1≤m≤n）。',
      trace:['从 0 开始，前两个 A 匹配，第三次以正文 A 对模式 B 失败。','从 1 开始，原先已看过的正文 A 又与模式开头比较。','窗口 1 的三个符号依次匹配 A、A、B。返回下标 1，总计 3+3=6 次比较。'],
      check:'在 AAAAA 中找 AAB，共检查几个窗口、比较多少次？',answer:'起点为 0、1、2；每次到第三个字符才失败，合计 3 个窗口、9 次比较。若模式比正文长则没有候选窗口。',
      topics:['逐起点试探','两个游标的回退','最好与最坏比较数'],labs:['kmp-match']},
    {id:'11.3',title:'把已经相等的前缀带到下一拍',premise:'在 AAACAAAB 中找 AAAB。令 j 为当前等待比较的模式下标；为讲改进表，本节采用哨兵 next[0]=−1。',
      mechanism:'失配后回退 j，不回退正文 i。普通 next[j] 是 P[0..j) 的最长真前后缀长度（j>0）。如果 P[j] 与 P[next[j]] 又相同，已知此次失配还会重演，可递归跳到 nextval[next[j]]。遇 −1 时消耗该正文字符并让 j 回到 0。标准构表 O(m)，搜索 O(n)，表占 O(m)。',
      trace:['AAAB 的普通 next=[−1,0,1,2]，跳过已知必败比较后 nextval=[−1,−1,−1,2]。','前三个 A 匹配。正文 C 在 j=3 处不等于 B，先按 nextval[3] 尝试 j=2。','C 也不等于 P[2] 的 A，直接退到 −1，随即消耗 C。后四个符号 AAAB 在起点 4 命中。'],
      check:'若模式为 AAAA，前三个 A 已配好，遇到 X 时普通 next[3] 是几？nextval[3] 又是几？',answer:'普通 next[3]=2，对应前缀 AAA 的边界 AA；改进 nextval[3]=−1，因为所有回退位置要比较的仍是 A，均已知会与 X 失配。',
      topics:['前后缀与失配表','next[0] 哨兵','nextval 加速','重叠匹配'],labs:['kmp-prefix','kmp-match'],
      drills:[drill('把 π 表和 next 区分开','P=ABAB，若 π[i] 包含 P[i]，π 和普通哨兵 next 各是多少？命中后要允许重叠，应留几个字符？','π=[0,0,1,2]；next=[−1,0,0,1]。对 j>0 有 next[j]=π[j−1]。完整匹配后保留 π[3]=2 个字符。')]},
    {id:'11.4',title:'从尾端核对，让两条规则竞相提议',premise:'正文 AAABABA，模式 ABABA。以模式末尾为比较起点。坏字符表 last[c] 保存字符在整段模式中最右位置，缺失为 −1。',
      mechanism:'在模式下标 j 失配后，坏字符提议 max(1,j−last[c])。好后缀规则优先对齐已匹配后缀的另一处出现，且新出现的前驱应不同于旧的失配字符；否则将后缀的最长可用尾部对齐模式前缀。两个安全位移取较大者。下方短串演示逐候选位移预建好后缀表，便于验算。',
      trace:['起点 0 的窗口 AAABA 从右往左匹配到后缀 ABA，随后 j=1 的模式 B 对正文 A 失败。','last[A]=4，坏字符位移只给 1。把匹配好的 ABA 对齐模式开头的 ABA，得到好后缀位移 2。','右移 2 格，从尾至首核对窗口 ABABA，首次命中下标 2。'],
      check:'还是 ABABA，若第一个窗口是 ZZZZZ，失配发生在 j=4，应右移几格？',answer:'Z 在模式中不存在，坏字符给 4−(−1)=5。尚无匹配的好后缀，只需给 1。取较大值 5。',
      topics:['逆向核对','坏字符表 BC','后缀匹配与 GS 表','前缀回退与位移取大'],labs:['bm-bad-character','kmp-match'],
      presets:[preset('好后缀多跨一步','AAABABA|ABABA'),preset('陌生字符整段跨过','ZZZZZABABA|ABABA')],demo:bmDemo},
    {id:'11.5',title:'滚动指纹相同，仍要验原件',premise:'在数字串 162323 中找 23，窗口宽 m=2，指纹是十进制数模 7。例子故意选用较小的模数。',
      mechanism:'高位权重 w=10^(m−1) mod 7。移一格先减掉旧高位贡献，再乘 10 加新个位，取模并规范为非负数。不同指纹立即排除；相同指纹逐字核对才可报告。',
      trace:['模式指纹是 2。首窗 16 的指纹也为 2，核对首字符即知 16 与 23 不同。','w=3。滑到 62，移出 1、移入 2，指纹为 ((2−1×3)×10+2) mod 7=6。','下一窗 23 指纹为 2，逐字核实后记录 2；继续滚动，最后还在位置 4 命中。'],
      check:'若模式为 30，正文也以 16 开头，能只凭指纹排除这个首窗吗？',answer:'不能，30 和 16 模 7 都为 2。逐字后 1 与 3 不同才能排除。若 c 个候选都要核到末尾，总时间上界为 O(n+m+cm)。',
      topics:['串的多项式指纹','滚动更新','模运算归一化','候选与假阳性'],labs:['rolling-match']},
    {id:'12.1',title:'给基准落座，再处理两侧',premise:'将 [6,2,7,3,4] 升序排列。选末项为基准，扫过的数中严格小于基准的进入左段，同值进右段。',
      mechanism:'扫描到 j 前，左区已经小于基准，中间已扫区大于等于基准。最终基准落到两区交界，随后递归排序两侧。互异键且均匀随机选基准时，期望 Θ(n log n)；极偏分割时 Θ(n²)。原地交换不保证稳定。',
      trace:['基准为 4。6 留在大区，遇 2 将其换到最左，得到 [2,6,7,3,4]。','7 留下；遇 3，把它换到小区末端，得到 [2,3,7,6,4]。','把基准和 7 交换，得到 [2,3 | 4 | 6,7]。两侧分别递归，升序为 [2,3,4,6,7]。'],
      check:'六条记录的键均为 4，采用本节二路规则。那么完整排序共做多少次键与基准的比较？随机改选基准能否改善？',answer:'5+4+3+2+1=15 次。相等者都进同一边，随机挑任一 4 仍会偏斜；三向划分可一次聚齐等键。',
      topics:['轴点与划分不变量','递归和最坏输入','随机选轴与期望界','重复键的三向划分'],labs:['sort-partition','quicksort-recursive','sort-stable-merge']},
    {id:'12.2',title:'只要第 k 项，能省下多少排序',premise:'第 k 项按升序从 1 编号。本节给偶数总长使用上中位数，即零基 S[⌊n/2⌋]。例如 [1,3,5,7] 的上中位数为 5，下中位数为 3，两者平均为 4。',
      mechanism:'QuickSelect 划分后只追含目标秩的一侧。随机基准在适当条件下给出期望 O(n) 时间；最坏会反复只缩短一项。五个一组选中位数、再递归取这些中位数的中位数，可排除常数比例：T(n)≤T(⌈n/5⌉)+T(7n/10+O(1))+O(n)，所以最坏 O(n)。有重复键时三向划分可直接命中等值段。',
      trace:['找 [9,1,7,3,8,2,5] 的第 3 小。以末项 5 分组，小段 [1,3,2] 含三项，目标留在这里。','小段取 2 为基准，1 项较小、1 项相等；第 3 小改成大段的第 1 小。','大段只有 3，返回 3。较大侧的 9、7、8 无须排出先后。'],
      check:'[1,2,4,4,4,8] 的第 4 小若选 4 为基准，是否继续递归？这组数有没有严格多数元素？',answer:'前 2 项较小，等值段覆盖第 3 至第 5 项，立即返回 4。4 出现 3/6，刚好一半，没有严格多数元素。',
      topics:['多数元素候选与复验','两有序向量的中位数','QuickSelect','五分组的确定性线性选择'],labs:['sort-partition','search-lower-bound'],
      drills:[drill('抵消只能提出候选','本节“众数”特指严格超过一半。对 [4,1,4,2,2,4,3] 执行两两抵消的投票法并复查。','余额依次 1、0、1、0、1、0、1，最后候选为 3。复查只出现 1 次，未超过 3.5，故无严格多数。即使出现次数最多，也未必过半。'),
        drill('两段有序，直接找切口','A=[2,6,11]，B=[1,4,8,13,17]。求合并后第 5 小即上中位数，避免整段归并。','令切口左边共有 5 项。在 A 取 1 项、B 取 4 项时，B 左端最大值 13 大于 A 右端最小值 6，A 左段应加长。改为 A 取 2 项、B 取 3 项，6≤13 且 8≤11。左段最大值 max(6,8)=8。对较短向量的合法切口二分，只需 O(log(min(m,n)+1)+1) 次切口检查，空侧作边界处理。'),
        drill('核对五分组基准','对 [12,5,2,10,7,15,3,13,8,6,4] 求第 7 小，五个一组，尾组也参与。','各组中位数是 7、8、4，取其中位数 7。严格较小 5 项，等于 1 项，转去大段找第 1 小即 8。下方演示可复算。')],
      presets:[preset('五分组与缩秩','12 5 2 10 7 15 3 13 8 6 4 | 7'),preset('一次命中等值段','4 8 4 1 4 2 | 4')],demo:selectDemo},
    {id:'12.3',title:'让远端的成绩先跨栏归位',premise:'数组为 [9,1,8,2,7,3,6,4]，步长使用 4、2、1。每一趟在同下标余数的子序列里做插入排序。',
      mechanism:'一趟 h 排序结束时，对所有合法 i 有 a[i]≤a[i+h]。大间隔让远处的逆序能较早消解；最后 h=1 统一收尾。复杂度依赖增量序列，不能从趟数是对数就断言总时间 O(n log n)。',
      trace:['h=4 的四条子序列为 [9,7]、[1,3]、[8,6]、[2,4]，分别排后原数组变为 [7,1,6,2,9,3,8,4]。','h=2 时偶数槽排成 [6,7,8,9]，奇数槽排成 [1,2,3,4]，原数组为 [6,1,7,2,8,3,9,4]。','h=1 进行最后的插入排序，得到 [1,2,3,4,6,7,8,9]。'],
      check:'若一个程序只用了 h=2 就停，给一个最短的反例。',answer:'[2,1] 已经满足所有相隔 2 的比较（没有这样的下标对），但整体无序。若要求至少有一对可比，可用 [2,1,3]，偶数槽 2≤3 仍无法消除 2、1 的逆序。',
      topics:['按步长分组','h 有序与插入排序','Shell 与 Knuth 增量','稳定性与反例'],labs:['shell-sort','sort-insertion'],
      drills:[drill('先来的同键是否会被越过','[2甲,2乙,1,3] 使用 2、1 两趟，组内只在严格大于时移动。最终谁先出现？','h=2 先将 1 放到 0 号槽，2甲 移到 2 号槽；h=1 后次序为 [1,2乙,2甲,3]。即便组内插入稳定，跨组跳跃仍可能翻转等键次序。'),
        drill('换步长，不换组内算法','n=16，一种实现用 n/2 逐次整除 2；另一种取小于 n 的 Knuth 数列 h=3h+1（从 1 起）倒序。两者分别跑哪几趟？','前者用 8、4、2、1；后者用 13、4、1。都要以 1 收尾。两条数列在第几趟让某两项见面不同，所以不能仅凭趟数断言谁比较更少。')]}
  ];
})();
