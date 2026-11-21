(() => {
  'use strict';
  const lessons = [], trees = '树与堆', sorting = '查找与排序';
  const card = (id,label,value,detail,x,y) => ({id,label,value:String(value),detail,x,y});
  const arc = (from,to,label) => ({from,to,label});
  const frame = (line,title,note,nodes,edges,vars,focus) => ({line,title,note,nodes,edges,vars:vars.map(([k,v])=>[k,String(v)]),focus});
  const question=(ask,choices,answer,why)=>({ask,choices,answer,why});
  function treeView(children,pos,describe) {
    const nodes=Object.entries(pos).map(([key,[x,y]])=>card('v'+key,'结点 '+key,key,describe(key),x,y));
    const edges=Object.entries(children).flatMap(([u,pair])=>pair.flatMap((v,i)=>v==null?[]:[arc('v'+u,'v'+v,i===0?'左':'右')]));
    return [nodes,edges];
  }
  lessons.push({
    id:'rb-insert-repair',group:trees,title:'红黑树的两次插入修复',subtitle:'红叔先换色，黑叔直线型再旋转',
    chapter:'高级搜索树 · 红黑树',goal:'连续插入 5 和 1，观察叔结点颜色如何决定修复动作，以及黑高度如何恢复。',
    invariant:'修复结束后根为黑，红结点没有红孩子，每个结点到各个后代空叶的黑结点数相等。中间帧可以暂时出现红红相邻。',
    cost:'标准红黑树高 O(log n)，插入的查找和修复总时间 O(log n)，旋转次数最多两次。结点带父指针时迭代修复的额外空间 O(1)。',
    boundary:'只展开本例经过的“父为左子、红叔或左左型”分支；左右折线需先左旋父结点，右侧情形镜像处理。空叶都视为黑，图中省略。insertRedLeaf 只作普通 BST 插入，保持父指针。',
    code:['for (int key : {5, 1}) {','    Node* z = insertRedLeaf(root, key);','    while (z != root && red(z->parent)) {','        Node *p = z->parent, *g = p->parent;','        Node* u = g->right; // 本例 p == g->left','        if (red(u)) {','            blacken(p); blacken(u); redden(g); z = g;','        } else { // 本例 z == p->left','            blacken(p); redden(g);','            rotateRight(root, g); break;','        }','    }','    blacken(root);','}'],
    frames:(()=>{
      const children={30:[10,50]},color={30:'黑',10:'红',50:'红'};
      const pos={30:[490,49],10:[290,113],50:[685,118]};let z,p,g,u;
      const f=(line,t,n,ids)=>{const [nodes,edges]=treeView(children,pos,k=>color[k]+'色');
        const vars=[['根',30]];if(z!==undefined)vars.push(['z',z]);if(p!==undefined)vars.push(['p',p],['g',g]);if(u!==undefined)vars.push(['叔',u??'黑色空叶']);
        return frame(line,t,n,nodes,edges,vars,ids.map(k=>'v'+k));};
      const out=[f(-1,'从合法红黑树出发','根 30 为黑，两个孩子 10、50 为红。从根到任意空叶，黑结点数相同。',[30])];
      z=5;color[5]='红';children[10]=[5,null];pos[5]=[181,178];
      out.push(f(1,'插入红叶 5','把 5 挂在 10 左侧。插入红色保住原来的黑高度，但父子现在都红。',[5,10]));
      p=10;g=30;out.push(f(3,'定位父与祖父','被修复结点 z 是 5；它的父为 10，祖父为 30。',[5,p,g]));
      u=50;out.push(f(5,'叔结点 50 为红','父与叔均为红，可以把两边的红色一起向上调整。',[10,50,30]));
      color[p]=color[u]='黑';color[g]='红';z=g;
      out.push(f(6,'父叔变黑，祖父变红','每侧子树增加一个黑结点，祖父少一个黑结点。z 上移到根，退出这一次循环。',[10,50,30]));
      p=g=u=undefined;color[30]='黑';out.push(f(12,'重新把根涂黑','从根出发的每条路径同时多一个黑结点，黑高度依旧一致。',[30]));
      z=1;color[1]='红';children[5]=[1,null];pos[1]=[78,244];
      out.push(f(1,'再插入红叶 1','1 挂在红结点 5 左侧，出现第二次红红冲突。',[1,5]));
      p=5;g=10;u=null;out.push(f(5,'这次叔结点为空','g 的右孩子为空，视为黑。路径 10、5、1 连续两次向左，属于直线型。',[10,5,1]));
      color[5]='黑';color[10]='红';out.push(f(8,'为旋转调整颜色','5 接过原来 10 的黑色，10 变红。此帧是修复过程中的中间状态。',[5,10]));
      children[30]=[5,50];children[5]=[1,10];children[10]=[null,null];
      pos[5]=[300,128];pos[1]=[152,226];pos[10]=[420,226];
      out.push(f(9,'围绕 10 右旋','5 接到 30 的左侧，10 转为 5 的右孩子，1 仍是 5 的左孩子。中序仍为 1、5、10、30、50。',[5,10,30]));
      p=g=u=undefined;out.push(f(12,'验证颜色和黑高度','根为黑，1、10 都有黑色父亲。按根和空叶均计数，从 30 到任一空叶都经过 3 个黑结点。',[30,5,50]));return out;
    })(),
    quiz:question('第二次插入后，如果只把 5 涂黑，保留 10 为黑且不旋转，会发生什么？',['一切合法','经过 5 的路径比从 10 向右到空叶的路径多一个黑结点','中序顺序被破坏'],1,'在 10 的两侧比较黑高度即可。只给左侧的 5 增加黑色会破坏相等条件，所以还要协调祖父颜色和结构。')
  });
  lessons.push({
    id:'splay-zig-zig',group:trees,title:'伸展树的同向双旋',subtitle:'带着两棵中间子树把 30 提到根',
    chapter:'高级搜索树 · 伸展树',goal:'区别先转祖父再转父亲的 zig-zig，追踪两个中间子树的接入位置。',
    invariant:'每次旋转都保持中序遍历为 30、40、50、60、80。旋转改变高度和亲子关系，键的相对次序始终相同。',
    cost:'图中一次双旋恰为两个 O(1) 旋转。完整伸展访问单次最坏 O(n)，一串访问的均摊成本为每次 O(log n)。',
    boundary:'x 与父亲 p 都是左孩子，祖父 g 是根。右右型用两次左旋，折线型调整旋转顺序；当只剩一层父结点时仅需一次 zig。',
    code:['Node* p = x->parent;', 'Node* g = p->parent;', 'rotateRight(root, g);', 'rotateRight(root, p);'],
    frames:(()=>{
      let edges={80:[50,null],50:[30,60],30:[null,40]},pos={80:[595,49],50:[350,116],30:[166,178],40:[299,245],60:[543,217]};
      const draw=(line,t,n,root,vars,focus)=>{const [v,e]=treeView(edges,pos,k=>k==root?'根':'搜索树结点');return frame(line,t,n,v,e,[['根',root],['x',30],...vars],focus.map(k=>'v'+k));};
      const out=[draw(-1,'找到要伸展的结点 30','从 80 向左到 50，再向左到 30。注意 40 和 60，两者在旋转时都需要妥善接回。',80,[],[30]),
        draw(0,'保留父结点 50','后续第二次旋转要用到原来的父结点。',80,[['p',50]],[50]),
        draw(1,'保留祖父 80','同向双旋先围绕祖父操作。',80,[['p',50],['g',80]],[80])];
      edges={50:[30,80],30:[null,40],80:[60,null]};pos={50:[400,52],30:[176,146],80:[637,145],40:[308,244],60:[505,241]};
      out.push(draw(2,'先让 50 升到 80 上方','50 原来的右子树 60 被接到 80 左侧。因为 50 < 60 < 80，仍满足搜索顺序。',50,[['p',50],['g',80]],[50,60,80]));
      edges={30:[null,50],50:[40,80],80:[60,null]};pos={30:[165,49],50:[368,117],40:[204,211],80:[637,178],60:[500,245]};
      out.push(draw(3,'再让 30 升到 50 上方','30 原来的右子树 40 接到 50 左侧。现在 x 已成为根，原有五个键各出现一次。',30,[['p',50],['g',80]],[30,40,50]));return out;
    })(),
    quiz:question('第二次右旋结束后，40 应挂在哪里？',['30 的左侧','50 的左侧','80 的右侧'],1,'40 大于新根 30，又小于 50；旋转前它位于 30 的右子树，旋转后接到 50 的左侧。')
  });
  lessons.push({
    id:'skip-list-find',group:'查找与排序',title:'跳表怎样下楼查找',subtitle:'沿有序索引寻找键 19',
    chapter:'词典 · 跳表',goal:'保持当前位置严格小于目标，尽量向右跳，再逐层下降。',
    invariant:'每次比较右邻之前，当前位置的键严格小于目标。上层跨过的所有底层键都小于目标，到底层后只需检查当前位置的后继。',
    cost:'独立随机晋升并以常数概率建层时，查找期望 O(log n)，最坏 O(n)；期望总存储 O(n)。本例展示一组固定塔高。',
    boundary:'此例键唯一。每层都有负无穷头哨兵，尾后用空指针；同键在不同层的卡片是同一塔的不同索引项。',
    code:['Entry* p = topHead;', 'for (;;) {','    while (p->right && p->right->key < key)','        p = p->right;', '    if (!p->down) break;', '    p = p->down;', '}', 'Entry* q = p->right;', 'return q && q->key == key;'],
    frames:(()=>{
      const rows=[['H',25],['H',12,25],['H',6,12,19,25,33]],keys=['H',6,12,19,25,33],xs=[75,205,335,465,595,725];
      const make=(l,k)=>'s'+l+'_'+k;let level=0,k='H';
      const nodes=[],edges=[];rows.forEach((r,l)=>r.forEach((val,i)=>{nodes.push(card(make(l,val),'层 '+(2-l),val==='H'?'−∞':val,val==='H'?'头哨兵':'索引项',xs[keys.indexOf(val)],[49,147,245][l]));if(i+1<r.length)edges.push(arc(make(l,val),make(l,r[i+1]),'右'));if(l<2)edges.push(arc(make(l,val),make(l+1,val),'下'));}));
      const f=(line,t,n,extra=[],focus=[make(level,k)])=>frame(line,t,n,nodes,edges,[['目标',19],...(line<0?[]:[['当前层',2-level],['p',k==='H'?'−∞':k]]),...extra],focus);
      const out=[f(-1,'先看三层索引','底层含全部键，越高层越稀疏。竖边表示同一键的下一层索引。',[],[]),
        f(0,'从最高层的头哨兵出发','先检查右邻能否安全跳过去。')];
      while(true){
        const r=rows[level],next=r[r.indexOf(k)+1];
        out.push(f(2,'检查右邻 '+String(next),'判断右邻的键 '+next+' 是否严格小于 19。',[['右邻',next]],[make(level,k),make(level,next)]));
        if(next<19){k=next;out.push(f(3,'向右移动','到达 '+k+'，被跨过的键全部小于目标。'));continue;}
        if(level===2){out.push(f(4,'已在底层','此时 p 为底层中最后一个严格小于 19 的索引项。'));break;}
        level++;out.push(f(5,'向下一层','保持当前键，换到更密的一层，再次检查右邻。'));
      }
      out.push(f(7,'读取底层后继','q 指向 19，可以做一次相等性检查。',[['q',19]],[make(2,19)]),f(8,'找到键 19','q 有效且键相等，返回 true。',[['q',19],['返回','true']],[make(2,19)]));return out;
    })(),
    quiz:question('若目标换成 20，到底层后最后一个严格小于目标的键和待比较后继分别是多少？',['12 和 19','19 和 25','25 和 33'],1,'底层可以越过 19，但不能越过 25。最终检查 25 与 20 不等，因此未命中。')
  });
  lessons.push({
    id:'bplus-range',group:trees,title:'B+ 树的跨叶范围查询',subtitle:'定位下界 10，再沿叶链读到 38 之前',
    chapter:'多路搜索树 · B+ 树拓展',goal:'用一次根到叶的定位和有序叶链的扫描输出半开区间中的全部记录。',
    invariant:'内部页的分隔键指明子页取值范围，实际记录都位于叶页。定位后已经输出的记录始终是区间内按序排列的完整前缀。',
    cost:'若树高为 h、扫描了 L 个叶页，读页次数为 O(h+L)；逐条输出另需 Ω(k) 时间，k 是结果数。',
    boundary:'示例键唯一、叶页右链有效，分隔键等于右侧子树最小键；下降时遇到等号走右侧。上界 38 不包含在结果中。',
    code:['Leaf* p = descendToLeaf(root, lo);','int i = lowerBound(p->keys, lo);','while (p) {','    if (i == p->size()) { p = p->next; i = 0; continue; }','    int k = p->keys[i];','    if (k >= hi) break;', '    emit(k); ++i;', '}'],
    frames:(()=>{
      const pages=[[4,10],[18,23,29],[32,38,45]],result=[];let p=0,i;
      const ids=['L0','L1','L2'],xs=[145,400,655];
      const baseEdges=ids.map((id,n)=>arc('root',id,['<18','18…31','≥32'][n])).concat([arc('L0','L1','后继'),arc('L1','L2','后继')]);
      function f(l,t,n,focus,extra=[]){const nodes=[card('root','内部页','18 | 32','分隔键',395,68),...pages.map((a,j)=>card(ids[j],'叶页 '+j,a.join(' '),j===p&&l>=0?'正在扫描':'有序记录',xs[j],220))];
        const vars=[['区间','[10, 38)'],['结果',result.join(' ')||'空']];if(l>=0)vars.push(['叶页',p]);if(i!==undefined)vars.push(['i',i]);return frame(l,t,n,nodes,baseEdges,[...vars,...extra],focus);}
      const out=[f(-1,'读取内部页的分隔键','键 18 和 32 同时出现在叶页，因为内部页只保存导航用的分隔值。',['root']),
        f(0,'下界 10 落在左子页','10 小于 18，直接下降到叶页 0。',['root','L0'])];
      i=1;out.push(f(1,'定位首个合格槽位','叶页 0 的槽位 1 保存 10，它是首个不小于下界的键。',['L0']));
      while(true){
        if(i===pages[p].length){p++;i=0;out.push(f(3,'沿叶链换页','到达叶页 '+p+' 的第一个槽位，无需重新从根查找。',[ids[p-1],ids[p]]));}
        const key=pages[p][i];out.push(f(4,'读取当前槽位 '+key,'接下来与不包含在区间中的上界 38 比较。',[ids[p]],[['k',key]]));
        if(key>=38){out.push(f(5,'遇见上界，立即结束','本记录为 38，叶链后面的键只会更大。最终输出 10、18、23、29、32。',[ids[p]],[['k',key]]));break;}
        result.push(key);i++;out.push(f(6,'输出 '+key+' 并前进一步','当前指针指到本页下一槽；若恰好越过页尾，下轮会换页。',[ids[p]],[['k',key]]));
      }return out;
    })(),
    quiz:question('如果把下界改成 18，第一次从根下降应选哪个子页？',['叶页 0','叶页 1','叶页 2'],1,'此树的分隔键等于右侧子树最小键。键 18 属于中间子树，叶页 1 的第一个槽位正是 18。')
  });
  lessons.push({
    id:'bm-bad-character',group:'字符串与算法策略',title:'BM 坏字符向右移动多少',subtitle:'同一次匹配中遇到“只移一格”和“整窗跳过”',
    chapter:'串 · Boyer–Moore 坏字符规则',goal:'从右向左比较，用失配位置和模式中最右出现位置计算安全位移。',
    invariant:'若文本坏字符在模式中的最右位置为 r，失配位置为 j，可安全移动 max(1,j−r) 位。坏字符没有出现时约定 r = −1。',
    cost:'本实现只用坏字符规则。固定字符集建最右表耗时 O(m+|Σ|)，额外空间 O(|Σ|)，最坏匹配时间 O(nm)。不应直接套用带其他改进版本的复杂度。',
    boundary:'本例使用非空单字节模式 ABCA，last(c) 已预处理为该字符的最右位置，缺失时返回 −1。这里只展示坏字符，未使用好后缀规则。',
    code:['int s = 0;', 'while (s + m <= n) {','    int j = m - 1;', '    while (j >= 0 && P[j] == T[s+j]) --j;', '    if (j < 0) return s;', '    int r = last(T[s+j]);','    s += max(1, j - r);','}', 'return -1;'],
    frames:(()=>{
      const t='XACA#ABCA',p='ABCA';let s=0,j,r;
      function f(l,title,note,focus){
        const nodes=[];for(let k=0;k<4;k++){let x=115+190*k;nodes.push(card('t'+k,'T['+(s+k)+']',t[s+k],'文本窗口',x,83),card('p'+k,'P['+k+']',p[k],'模式串',x,218));}
        const vars=[['T',t],['s',l<0?'待初始化':s]];if(j!==undefined)vars.push(['j',j]);if(r!==undefined)vars.push(['r',r]);return frame(l,title,note,nodes,[],vars,focus);
      }
      const out=[f(-1,'观察一个长度为 4 的窗口','全文本为 XACA#ABCA。图中上排只画当前窗口，下排始终是 ABCA。',[]),f(0,'从文本下标 0 开始','s 是模式首字符对齐的文本位置。',[])];
      while(s+4<=t.length){
        j=3;r=undefined;out.push(f(2,'从模式最右端开始','这次窗口起点为 '+s+'。',['p3','t3']));
        while(j>=0&&p[j]===t[s+j]){const k=j;j--;out.push(f(3,'相等，继续向左','P['+k+'] 与 T['+(s+k)+'] 都是 '+p[k]+'。',['p'+k,'t'+k]));}
        if(j<0){out.push(f(4,'所有位置匹配','返回窗口起点 '+s+'。',[]));break;}
        r=p.lastIndexOf(t[s+j]);const step=Math.max(1,j-r);
        out.push(f(5,'查出坏字符的最右位置','在 j='+j+' 处失配，文本字符 '+t[s+j]+' 在模式中的最右位置 r = '+r+'。',['t'+j,'p'+j]));
        s+=step;out.push(f(6,'把窗口右移 '+step+' 格','max(1, '+j+' − ('+r+')) = '+step+'。上排已换成新窗口，下一轮重新从右端比较。',[]));
      }return out;
    })(),
    quiz:question('j=1 处遇到坏字符 A，但 A 在模式中的最右位置是 3。此时坏字符规则应移动几格？',['向左移动 2 格','向右移动 1 格','向右移动 4 格'],1,'j−r 等于 −2。位移至少为 1，保证算法前进且不会跳过相邻的候选。')
  });
  lessons.push({
    id:'external-merge',group:sorting,title:'外部归并的三块缓冲',subtitle:'两条有序归并段如何逐块读写',
    chapter:'排序 · 外部二路归并',goal:'区分选择下一条记录的 CPU 比较和跨越磁盘边界的整块读写。',
    invariant:'缓冲头总是各段尚未输出的最小记录。输出缓冲接在已写磁盘结果之后，二者合起来是最终有序输出的前缀。',
    cost:'合并两段共 N 条记录，CPU 时间 O(N)，使用两个输入块和一个输出块。块容量 B 时，顺序读写的块数为 O(N/B+1)，每段末块都可能不满。',
    boundary:'输入归并段内已经有序，块容量为 2。两个 6 带 L、R 标签以区别来源；若两段对应原序列中先左后右的连续段，相等时优先取左可保持稳定。',
    code:['while (true) {','    if (a.empty() && L.more()) a = L.readBlock();','    if (b.empty() && R.more()) b = R.readBlock();','    if (a.empty() && b.empty()) break;','    if (b.empty() || (!a.empty() && a.front().key <= b.front().key))','        o.push(a.pop());','    else o.push(b.pop());','    if (o.full()) disk.write(o.take());','}', 'if (!o.empty()) disk.write(o.take());'],
    frames:(()=>{
      const li=[[2,'6L'],[9]],ri=[[1,'6R'],[10,14]],a=[],b=[],o=[],disk=[];let l=0,r=0,w=0;
      const text=v=>v.length?v.join(' '):'空';
      function f(line,title,note,focus,edges=[]){
        const nodes=[card('L','磁盘 · L',li[l]?text(li[l]):'无','下一输入块',115,65),card('R','磁盘 · R',ri[r]?text(ri[r]):'无','下一输入块',115,225),
          card('a','输入缓冲 A',text(a),'队首在左',354,65),card('b','输入缓冲 B',text(b),'队首在左',354,225),
          card('o','输出缓冲',text(o),'容量 2',552,148),card('disk','磁盘 · 输出',w+' 块','已写回',730,148)];
        return frame(line,title,note,nodes,edges,[['块读取',l+r],['块写入',w],['磁盘结果',text(disk)]],focus);
      }
      const out=[f(-1,'两条已经有序的输入段','左段的两块是 [2,6L]、[9]，右段是 [1,6R]、[10,14]。内存只能同时放三块。',[])];
      while(true){
        if(!a.length&&l<li.length){a.push(...li[l++]);out.push(f(1,'读取左段下一块','一次块读取把 '+text(a)+' 装进缓冲 A。',['L','a'],[arc('L','a','读取')]));}
        if(!b.length&&r<ri.length){b.push(...ri[r++]);out.push(f(2,'读取右段下一块','一次块读取把 '+text(b)+' 装进缓冲 B。',['R','b'],[arc('R','b','读取')]));}
        if(!a.length&&!b.length){out.push(f(3,'两个输入均耗尽','主循环结束，检查输出缓冲中是否留有不足一块的数据。',['a','b']));break;}
        const left=!b.length||(a.length&&parseInt(a[0],10)<=parseInt(b[0],10)),src=left?a:b,val=src.shift();
        o.push(val);out.push(f(left?5:6,'取出记录 '+val,'从'+(left?'左':'右')+'缓冲的队首搬到输出缓冲。此步只搬记录，没有写磁盘。'+(val==='6L'?'两边键都为 6，按稳定规则先取左侧。':''),[left?'a':'b','o'],[arc(left?'a':'b','o','搬入')]));
        if(o.length===2){const chunk=o.splice(0);disk.push(...chunk);w++;out.push(f(7,'写回一个满块','输出满了，把 ['+text(chunk)+'] 写入磁盘并腾空缓冲。',['o','disk'],[arc('o','disk','写回')]));}
      }
      if(o.length){const chunk=o.splice(0);disk.push(...chunk);w++;out.push(f(9,'冲刷最后的短块','最后一块只含 '+text(chunk)+'。本次共读 4 块、写 4 块，所有 7 条记录已写回。',['o','disk'],[arc('o','disk','写回')]));}return out;
    })(),
    quiz:question('最后取出 14 时，两个输入都已耗尽，而且输出块只有一条记录。为什么还要写一次？',['为让左右两个段等长','最后不足一整块的记录也属于结果','再写一次可减少读块次数'],1,'缓冲区中的 14 尚未进入磁盘结果。只有最后一次短块写回才能保证输出完整。')
  });
  lessons.push({
    id:'quicksort-recursive',group:sorting,title:'完整走完快速排序',subtitle:'一次划分后，让左右子区间各自完成递归',
    chapter:'排序 · 快速排序递归',goal:'在固定枢轴最终位置之后，继续处理互不重叠的两侧，直到调用栈完全返回。',
    invariant:'每次 Lomuto 划分前，子区间之外的位置不被这次操作改变。划分结束后枢轴左侧键 ≤ 枢轴，右侧键 > 枢轴；两侧仍须各自排序。',
    cost:'各层近似均衡时用时 Θ(n log n)。互异键随机排列，或对互异键均匀随机选择枢轴时，期望时间 Θ(n log n)。本例二路划分遇到全等键，即使随机选枢轴也需 Θ(n²)。普通双递归栈在上述随机假设下期望 O(log n)，最坏 O(n)。',
    boundary:'闭区间 [lo,hi]，当 lo >= hi 即返回。此例取末元素作枢轴，≤ 规则把等值键放在左边；大量等值键可能导致退化，且整体不稳定。',
    code:['void quick(int lo, int hi) {','    if (lo >= hi) return;', '    int v = a[hi], i = lo;', '    for (int j = lo; j < hi; ++j)', '        if (a[j] <= v) { swap(a[i], a[j]); ++i; }', '    swap(a[i], a[hi]);', '    quick(lo, i - 1);', '    quick(i + 1, hi);', '}'],
    frames:(()=>{
      const a=[5,2,4,1,3],stack=[],fixed=new Set(),out=[];
      function f(line,title,note,ids,extra=[]){
        const cur=stack.at(-1);
        const nodes=a.map((v,k)=>card('a'+k,'a['+k+']',v,fixed.has(k)?'位置确定':cur&&k>=cur[0]&&k<=cur[1]?'当前区间':'区间外',85+157*k,145));
        const vars=[['调用栈',stack.map(([l,h])=>'['+l+','+h+']').join(' › ')||'空'],...extra];
        return frame(line,title,note,nodes,[],vars,ids.map(k=>'a'+k));}
      function quick(lo,hi){
        stack.push([lo,hi]);out.push(f(0,'进入区间 ['+lo+','+hi+']','栈顶这一次调用只负责闭区间内的元素。',[]));
        if(lo>=hi){
          if(lo===hi)fixed.add(lo);
          out.push(f(1,lo===hi?'单元素已就位':'空区间直接返回','子区间长度至多为 1，已经有序。',lo===hi?[lo]:[]));stack.pop();return;
        }
        let i=lo;const v=a[hi];
        out.push(f(2,'选择末元素 '+v+' 为枢轴','边界 i 从 lo 开始。扫描过程中 [lo,i) 存放已看过且 ≤ 枢轴的元素。',[hi],[['v',v],['i',i]]));
        for(let j=lo;j<hi;j++){
          const original=a[j],take=original<=v,old=i;
          if(take){[a[i],a[j]]=[a[j],a[i]];i++;}
          out.push(f(4,'检查 '+original+' 与枢轴 '+v,take?'把它交换到小值区末尾，i 增加一格。':'它大于枢轴，保持位置并继续扫描。',take?[...new Set([old,j])]:[j],[['j',j],['i',i],['v',v]]));
        }
        [a[i],a[hi]]=[a[hi],a[i]];fixed.add(i);
        out.push(f(5,'固定枢轴 '+v,'交换后枢轴最终下标为 '+i+'。这只确定枢轴位置，两侧可能仍未排好。',[i],[['i',i],['v',v]]));
        out.push(f(6,'递归处理左侧','接下来调用 quick('+lo+', '+(i-1)+')；当前帧等待子调用。',[i]));
        quick(lo,i-1);
        out.push(f(7,'左侧已返回，转向右侧','接下来调用 quick('+(i+1)+', '+hi+')，两次递归都跳过枢轴本身。',[i]));
        quick(i+1,hi);
        out.push(f(8,'本次区间已排好','左右子调用均已返回，['+lo+','+hi+'] 整体有序。',[i]));stack.pop();
      }
      out.push(f(-1,'观察待排数组','用五个元素跟完全过程，第一次划分后左右两侧都会留下一个逆序对。',[]));quick(0,4);
      out.push(f(-1,'最外层调用返回','栈已清空，最终数组是 1、2、3、4、5。',[0,1,2,3,4]));return out;
    })(),
    quiz:question('第一次划分得到 [2,1,3,5,4] 后，接下来要处理哪些闭区间？',['[0,2] 和 [2,4]','[0,1] 和 [3,4]','只处理 [0,1]'],1,'枢轴 3 已固定在下标 2。应跳过它并递归处理左右区间，两侧此时都尚未有序。')
  });
  globalThis.ATLAS.push(...lessons);
})();
