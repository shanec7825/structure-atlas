(() => {
  'use strict';

  // Addresses name objects in this simulation. Diagram coordinates never determine a link.
  const addresses = { A: '0x2A0', B: '0x7C0', C: '0x410', N: '0x650', S: '0x980' };
  const values = { A: 12, B: 37, C: 54, N: 23, S: '哨兵' };
  const normal = { A: [126, 142], B: [398, 142], C: [670, 142], N: [267, 239] };
  const four = { A: [90, 148], N: [296, 226], B: [496, 148], C: [704, 148] };
  const addr = id => addresses[id] || 'nullptr';
  const linear = { A: 'B', B: 'C', C: null };
  const vp = (name, id) => [name, addr(id)];
  const head = vp('head', 'A');
  const lessons = [];

  function shot(line, title, note, nodes, edges, vars, focus = []) {
    return { line, title, note, nodes, edges, vars, focus };
  }
  function cell(id, label, value, detail, x, y) {
    return { id, label, value: String(value), detail, x, y };
  }
  function listFrame(line, title, note, next, vars, focus = [], positions = normal, prev) {
    const nodes = Object.keys(next).map(id => {
      const detail = prev ? id + ' · 双向结点' : 'next ' + addr(next[id]);
      return cell(id, addr(id), values[id], detail, ...positions[id]);
    });
    const edges = [];
    for (const [from, to] of Object.entries(next)) {
      if (to) edges.push({ from, to, label: 'next' });
      if (prev && prev[from]) edges.push({ from, to: prev[from], label: 'prev' });
    }
    return shot(line, title, note, nodes, edges, vars, focus);
  }
  const quiz = (ask, choices, answer, why) => ({ ask, choices, answer, why });
  function add(lesson) {
    lessons.push({ group: '指针与链表', ...lesson });
  }

  const start = [head, vp('p', 'A')];
  const allocated = { ...linear, N: null };
  const saved = { ...linear, N: 'B' };
  const inserted = { ...saved, A: 'N' };
  const withNew = [...start, vp('n', 'N')];

  add({
    id: 'list-insert', title: '在链表中间插入', subtitle: '把 23 接在 12 和 37 之间',
    chapter: '列表 · 单链表插入', goal: '先让新结点记住旧后继，再把前驱的出口交给它。',
    invariant: '从 head 出发，原有的 12、37、54 始终可达，相对顺序不变。最后还必须恰好经过一次 23。',
    cost: '已知有效前驱 p 时，接链只写两个 next 字段，时间 O(1)。寻找前驱需要 O(n)。新结点占 O(1) 空间。',
    boundary: '假设 Node 的两个成员依次为 int value 和 Node* next。尾插也适用，旧后继为 nullptr；在首结点之前插入则要更新 head 或采用哨兵。',
    code: ['Node* n = new Node{23, nullptr};', 'n->next = p->next;', 'p->next = n;'],
    frames: [
      listFrame(-1, '找到插入口', 'head 和 p 都装着 0x2A0。从 12 的 next 顺着箭头读，下一站是地址 0x7C0 的 37。', linear, start, ['A'], four),
      listFrame(0, '申请一个新结点', 'new 建立值为 23 的结点，把它的地址 0x650 交给 n。此时从 head 出发还找不到它。', allocated, withNew, ['N'], four),
      listFrame(1, '新结点记住旧后继', '先读 p 所指结点的 next，读出 0x7C0，再把它写入 n 所指结点的 next。现在 12 和 23 都能直接走到 37。', saved, withNew, ['N','B'], four),
      listFrame(2, '前驱接入新结点', '把 0x650 写入 12 的 next。沿 head 检查一遍，路径变成 12、23、37、54。四个结点各自的地址都没动。', inserted, withNew, ['A','N'], four)
    ],
    quiz: quiz('假设 p 原来指向尾结点。执行 n->next = p->next 后，n->next 里是什么？', ['p 自己的地址', 'nullptr', '新结点的地址'], 1, '赋值读取 p 的 next 字段。尾结点的这个字段原本装着 nullptr，所以新结点会成为新的尾结点。')
  });

  const xp = [196, 151], pp = [591, 151];
  function integer(value, position = xp) { return cell('x', 'x · 0x100', value, 'int 对象', ...position); }
  function pointer(id, address, target, position) { return cell(id, id + ' · ' + address, target, 'int* 对象', ...position); }
  const px = { from: 'p', to: 'x', label: '指向' };
  add({
    id: 'address-of', title: '一个数住在哪里', subtitle: '分清 x、&x、p 和 *p',
    chapter: '预备知识 · 对象与地址', goal: '指出对象的位置、里面的值，以及记录该位置的另一个对象。',
    invariant: '在 x 的生命周期内，改变 x 存的整数不会改变 &x。p 自己也占据一个独立的存储位置。',
    cost: '这里对固定宽度整数的取址、读取、赋值各为 O(1)，额外指针占 O(1) 空间。',
    boundary: '地址是本次演示的编号，真实地址由实现和本次运行决定。p 必须指向存活的 int 对象才可在此解引用。',
    code: ['int x = 12;', 'int* p = &x;', '*p = 23;'],
    frames: [
      shot(-1,'先读图例','每张卡是一处已经建立的对象。即将建立 x，稍后还会建立一个专门保存地址的变量 p。',[],[],[],[]),
      shot(0,'给整数一个位置','x 的值是 12；表达式 &x 取得它所在的位置 0x100。', [integer(12)],[],[['x','12'],['&x','0x100']],['x']),
      shot(1,'把地址交给 p','p 的值是 0x100，p 自己的地址是 0x180。沿 p 的箭头读数，*p 得到 12。',[integer(12),pointer('p','0x180','0x100',pp)],[px],[['p','0x100'],['&p','0x180'],['*p','12']],['p','x']),
      shot(2,'沿地址写入 23','左侧的 *p 表示“到 0x100 那个格子去写”。p 里面的地址保持原值，x 里出现 23。',[integer(23),pointer('p','0x180','0x100',pp)],[px],[['p','0x100'],['&p','0x180'],['x','23']],['x'])
    ],
    quiz: quiz('执行 *p = 23 之后，再读 p 自己得到什么？',['23','0x180','0x100'],2,'这行沿 p 访问 x，写入的是 x。p 仍然保存 &x，而 &p 才是 0x180。')
  });
  add({
    id: 'pointer-alias', title: '两根指针指向同一个数', subtitle: '比较 q = p 和 *q = 99',
    chapter:'预备知识 · 别名与重定向', goal:'看出复制地址只会多出一个访问同一对象的入口。',
    invariant:'当 p == q 且两者指向存活对象时，*p 和 *q 是同一个对象。重新给 q 赋地址只改变 q。',
    cost:'复制指针和通过指针写一个整数均为 O(1)，不会复制整块对象。',
    boundary:'这里 x、y、p 预先存在并持续存活。只复制裸指针并不会延长被指对象的生命周期。',
    code:['int* q = p;','*q = 99;','q = &y;','*q = 31;'],
    frames:(() => {
      function frame(line,title,note,x,y,target,focus) {
        const nodes=[integer(x,[215,83]),cell('y','y · 0x110',y,'int 对象',590,83),pointer('p','0x180','0x100',[215,222])];
        const edges=[px], vars=[['x',String(x)],['y',String(y)],['p','0x100']];
        if(target) {
          const address=target==='x'?'0x100':'0x110';
          nodes.push(pointer('q','0x190',address,[590,222]));
          edges.push({from:'q',to:target,label:'指向'}); vars.push(['q',address]);
        }
        return shot(line,title,note,nodes,edges,vars,focus);
      }
      return [
        frame(-1,'两个整数，各有地址','x 里是 12，y 里是 7。现有 p 指向 x。',12,7,null,['p','x']),
        frame(0,'复制地址','q 得到与 p 相同的地址 0x100。此刻有两条路可以访问同一个 x。',12,7,'x',['q','x']),
        frame(1,'从另一条路改值','顺着 q 写入 99。现在若读取 *p，也会看见 99。',99,7,'x',['x']),
        frame(2,'只移动 q 的箭头','&y 是 0x110，写入 q 后，p 继续指向 x，q 转而指向 y。',99,7,'y',['q','y']),
        frame(3,'再写一次','q 现在通向 y，因此 *q = 31 改的是 y。x 仍然保存 99。',99,31,'y',['y'])
      ];
    })(),
    quiz:quiz('刚执行 q = &y，尚未执行 *q = 31，此时读取 *p 是多少？',['7','99','31'],1,'改写 q 的地址不会改写 p，也不会回滚 x。p 一直指向保存 99 的 x。')
  });

  add({
    id:'list-walk',title:'沿着 next 走到末尾',subtitle:'遍历时移动的是游标',
    chapter:'列表 · 顺序访问',goal:'每轮先检查游标，再读取数据，最后取得下一站地址。',
    invariant:'每次进入循环时，sum 恰好等于 cur 之前已访问结点的值之和，head 始终指向表头。',
    cost:'n 个结点各访问一次，时间 O(n)，游标和累加器的额外空间 O(1)。',
    boundary:'空表令 cur 初值为 nullptr，会跳过整个循环。输入须无环，所有 next 都须有效或为空，此例假设求和不溢出。',
    code:['int sum = 0;', 'Node* cur = head;', 'while (cur != nullptr) {', '    sum += cur->value;', '    cur = cur->next;', '}'],
    frames:(() => {
      const frames=[listFrame(-1,'从表头开始','链表的箭头存于各结点内部。先准备一个独立游标，保留 head。',linear,[head],['A']),
        listFrame(0,'清空累加器','还没有读过任何值，已访问部分的和为 0。',linear,[head,['sum','0']],[]),
        listFrame(1,'复制表头地址','cur 与 head 暂时同指向第一个结点。',linear,[head,vp('cur','A'),['sum','0']],['A'])];
      let sum=0;
      for(const id of ['A','B','C']) {
        frames.push(listFrame(2,'检查游标','cur 保存 '+addr(id)+'，可以进入循环。',linear,[head,vp('cur',id),['sum',String(sum)]],[id]));
        sum+=values[id];
        frames.push(listFrame(3,'读出 '+values[id],'顺着 cur 找到 value 字段，把 '+values[id]+' 加入 sum。',linear,[head,vp('cur',id),['sum',String(sum)]],[id]));
        const next=linear[id];
        frames.push(listFrame(4,'游标前进一步','读取当前结点的 next，把 '+addr(next)+' 写入 cur。各结点的 next 字段都没有变化。',linear,[head,vp('cur',next),['sum',String(sum)]],next?[next]:[]));
      }
      frames.push(listFrame(2,'遇到空指针，退出','cur 为 nullptr，循环条件为假。sum 现为 103，head 仍可带你回到 12。',linear,[head,vp('cur',null),['sum','103']],[]));
      return frames;
    })(),
    quiz:quiz('cur = cur->next 执行一次后，原结点的 next 变成什么？',['仍是原来的后继地址','变成 nullptr','变成 cur 自身地址'],0,'赋值左侧是局部变量 cur。右侧读取结点字段，并没有写它。')
  });

  const broken = {...allocated,A:'N'};
  add({
    id:'list-insert-order',title:'交换两行会怎样',subtitle:'观察旧后继失联与新结点自环',
    chapter:'列表 · 插入反例',goal:'在覆盖一条边之前，找到将来还要用到的旧地址。',
    invariant:'正常插入后，原后继仍应从 head 可达，且链条最终到达 nullptr。此反例在两条语句中先后破坏这两个条件。',
    cost:'两次写入均为 O(1)。最终若用“直到遇见 nullptr”为条件遍历，循环不会终止。',
    boundary:'设本例只有 head、p、n 三个根指针。没有别的变量保存 B；B、C 对象仍存活，但操作后程序失去访问它们的入口。',
    code:['p->next = n;', 'n->next = p->next;'],
    frames:[
      listFrame(-1,'准备同样的四个结点','n 已指向新建的 23，next 为空。任务仍是把它接在 12 后面。',allocated,withNew,['A','N'],four),
      listFrame(0,'旧后继的入口丢了','写入 0x650 时，12 原本保存的 0x7C0 被覆盖。从 head 已走不到 37、54；它们仍占用内存。',broken,withNew,['A','N'],four),
      listFrame(1,'读回的地址就是 n','此时 p->next 已经等于 0x650，把它写入 n->next 会让 23 指回自己。遍历将反复读到 23。',{...broken,N:'N'},withNew,['N'],four)
    ],
    quiz:quiz('只执行第一行、尚未执行第二行时，从 head 依次能读到哪些值？',['12、23，然后停下','12、23、37、54','不断读到 23'],0,'第一行丢失了通往 37 的边，但 23 的 next 暂时仍是 nullptr。自环出现在第二行之后。')
  });
  add({
    id:'list-erase',title:'摘链与释放',subtitle:'分开看“绕过结点”和“结束对象生命”',
    chapter:'列表 · 删除与生命周期',goal:'在释放中间结点前，把通向剩余链表的路接好。',
    invariant:'摘下 B 之后，从 head 仍能走到 C。delete 之后不能再通过旧地址访问已结束生命周期的 B。',
    cost:'已知前驱时，摘链时间 O(1)，额外空间 O(1)。若只知道待删值，通常需要 O(n) 查找。',
    boundary:'此片段假设 p 与 p->next 均有效，victim 来自一次匹配的标量 new，没有其他拥有者。若有别名，delete 不会自动将别名置空。',
    code:['Node* victim = p->next;', 'p->next = victim->next;', 'delete victim;', 'victim = nullptr;'],
    frames:[
      listFrame(-1,'定位待删结点的前驱','p 指向 12，要移除的是它的后继 37。',linear,start,['A','B']),
      listFrame(0,'留一个入口给待删对象','把 0x7C0 放入 victim。这样改写 p->next 后，仍能找到要释放的结点。',linear,[...start,vp('victim','B')],['B']),
      listFrame(1,'从主链绕过它','把 37 的 next 复制给 12 的 next。此时从 head 看见 12、54，victim 还能访问 37。',{...linear,A:'C'},[...start,vp('victim','B')],['A','C'],{A:[126,105],B:[395,232],C:[670,105]}),
      listFrame(2,'结束 37 的生命周期','delete 释放该结点的存储。victim 仍然是一个变量，尚未被置空；此时不能再解引用它。',{A:'C',C:null},[...start,['victim','悬空']],['C']),
      listFrame(3,'清除这个悬空指针','给 victim 写入 nullptr。若外部还有指向原结点的别名，需要单独处理它们。',{A:'C',C:null},[...start,vp('victim',null)],[])
    ],
    quiz:quiz('p->next = victim->next 刚执行完，delete 尚未执行。37 此刻在哪里？',['已被释放','仍然存活，可以通过 victim 访问','仍在从 head 出发的路径上'],1,'摘链只修改前驱的 next。37 已从主链断开，直到 delete 才结束生命周期并释放存储。')
  });
  add({
    id:'list-reverse',title:'用三根指针反转',subtitle:'一边建起反向前缀，一边守住剩余入口',
    chapter:'列表 · 原地反转',goal:'把每一轮拆成存后继、反方向、长前缀、进游标四步。',
    invariant:'每次检查 while 时，prev 指向已反转前缀的首结点，cur 指向未处理后缀的首结点。两条链合起来恰好覆盖原来的所有结点。',
    cost:'每个结点改写一次 next，总时间 O(n)。三个局部指针占额外 O(1) 空间。',
    boundary:'空链表直接结束并保留空表头；单结点只执行一轮。要求输入无环，此片段直接更新可写的 head。',
    code:['Node* prev = nullptr;', 'Node* cur = head;', 'while (cur != nullptr) {', '    Node* rest = cur->next;', '    cur->next = prev;', '    prev = cur;', '    cur = rest;', '}', 'head = prev;'],
    frames:(() => {
      const links={...linear}; let prev=null,cur='A';
      const vars=(...extra)=>[head,vp('prev',prev),vp('cur',cur),...extra];
      const frames=[
        listFrame(-1,'观察原始链条','三个结点的地址固定。任务是改写指向，使路径变成 54、37、12。',links,[head],[]),
        listFrame(0,'反向前缀最初为空','prev 记住已处理部分的首地址，目前是空。',links,[head,vp('prev',null)],[]),
        listFrame(1,'游标从头开始','cur 记住尚未处理的第一个结点。',links,vars(),['A'])
      ];
      while(cur) {
        const old=cur, rest=links[cur];
        frames.push(listFrame(2,'检查剩余部分','cur 指向 '+values[cur]+'，开始处理这个结点。',links,vars(),[cur]));
        frames.push(listFrame(3,'暂存剩余入口','若马上改写当前 next，原后继入口会丢失。先把 '+addr(rest)+' 存进 rest。',links,vars(vp('rest',rest)),rest?[cur,rest]:[cur]));
        links[cur]=prev;
        frames.push(listFrame(4,'翻转一条边','把当前 next 改为 '+addr(prev)+'。未处理部分仍可从 rest 找到。',links,vars(vp('rest',rest)),[cur]));
        prev=cur;
        frames.push(listFrame(5,'扩大已反转部分','prev 移到刚处理的 '+values[cur]+'，成为反向前缀的新表头。',links,vars(vp('rest',rest)),[prev]));
        cur=rest;
        frames.push(listFrame(6,'进入下一段','cur 接过暂存的后继地址 '+addr(cur)+'。本轮结束，局部变量 rest 随后离开作用域。',links,vars(vp('rest',rest)),cur?[cur]:[old]));
      }
      frames.push(listFrame(2,'没有剩余结点','cur 已为空。prev 指向全部反转后的链条，旧 head 还停在 12。',links,vars(),[prev]));
      frames.push(listFrame(8,'交还表头','把 prev 复制给 head，现在从 head 依次读到 54、37、12。',links,[vp('head',prev),vp('prev',prev),vp('cur',null)],[prev]));
      return frames;
    })(),
    quiz:quiz('第一轮刚执行 cur->next = prev。此刻哪一个变量保存着原先第二个结点的地址？',['head','prev','rest'],2,'第一轮 cur 仍在 12，prev 为空。写 next 之前备份的 rest 保住了通向 37 和 54 的入口。')
  });

  add({
    id:'double-list',title:'接好双链表的两个方向',subtitle:'用从右往左走的办法检查插入',
    chapter:'列表 · 双向链接',goal:'让新结点既能向前也能向后访问，并修好两个邻居通往它的入口。',
    invariant:'操作完成时，对每条 u->next == v 且 v 非空的链接，应有 v->prev == u，反向链接同理。中间态可暂时不满足这个条件。',
    cost:'已知相邻结点时，插入写四个指针字段，时间 O(1)。每个双向结点额外保存一个 prev 字段。',
    boundary:'本例在两枚有效实结点 a、b 之间插入，且 a->next == b。没有哨兵时，首尾插入还须处理 nullptr 和外部头尾指针。',
    code:['n->prev = a;', 'n->next = b;', 'a->next = n;', 'b->prev = n;'],
    frames:(() => {
      const positions={A:[115,125],B:[683,125],N:[400,235]};
      const next={A:'B',B:null,N:null},prev={A:null,B:'A',N:null};
      const vars=[vp('a','A'),vp('b','B'),vp('n','N')];
      function frame(line,title,note,focus) {return listFrame(line,title,note,next,vars,focus,positions,prev);}
      const frames=[frame(-1,'找到两位邻居','a 指向 12，b 指向 37。新建的 23 暂时没有接入两个方向。',['A','B','N'])];
      prev.N='A'; frames.push(frame(0,'记下左邻居','新结点的 prev 保存 12 的地址。此时从左往右走仍然跳过 23。',['N','A']));
      next.N='B'; frames.push(frame(1,'记下右邻居','新结点的 next 保存 37 的地址，可从它走向两位邻居。',['N','B']));
      next.A='N'; frames.push(frame(2,'接通正向路径','从 12 沿 next 已能读到 23、37。但从 37 沿 prev 还会直接走到 12。',['A','N']));
      prev.B='N'; frames.push(frame(3,'接通反向路径','从 37 沿 prev 依次回到 23、12，两个方向现在互相吻合。',['B','N']));
      return frames;
    })(),
    quiz:quiz('如果忘记最后一行，从 b 向后退一步会读到哪个值？',['23','12','37'],1,'前三次写入都没有碰 b->prev。正向遍历已经正确，反向检查才能暴露这条漏改的边。')
  });
  add({
    id:'cycle-meet',title:'快慢指针为何相遇',subtitle:'让两个游标在同一条环上追赶',
    chapter:'列表 · 环检测拓展',goal:'跟踪两种步速，解释为什么比较的是地址，以及空指针为何需要提前检查。',
    invariant:'经过 k 轮，slow 沿 next 前进 k 步，fast 前进 2k 步。一旦都进入长为 m 的环，每轮 fast 相对多走一步，距离按 m 取模，最终相遇。',
    cost:'有 n 个可达结点时，检测用 O(n) 时间与 O(1) 额外空间，无须修改链表。',
    boundary:'空表和无环单结点会直接跳过循环。短路求值先检查 fast，再读取 fast->next。只比较值会把两个值相同的不同结点误认作相遇。',
    code:['Node *slow = head, *fast = head;', 'while (fast && fast->next) {', '    slow = slow->next;', '    fast = fast->next->next;', '    if (slow == fast) return true;', '}', 'return false;'],
    frames:(() => {
      const links={A:'B',B:'C',C:'B'}, positions={A:[105,145],B:[400,91],C:[665,224]};
      let slow='A',fast='A';
      const frame=(line,title,note,focus)=>listFrame(line,title,note,links,[head,vp('slow',slow),vp('fast',fast)],focus,positions);
      const frames=[listFrame(-1,'构造带环链表','12 后面的 37 和 54 首尾相接。沿 next 一直走将不会遇见 nullptr。',links,[head],['B','C'],positions),
        frame(0,'两个游标从头出发','初始位置相同是人为设置，要先移动再比较。',['A'])];
      for(let round=0;round<2;round++) {
        frames.push(frame(1,'检查快指针能否迈步','fast 和它的直接后继都非空，可以安全读取两次 next。',[fast]));
        slow=links[slow]; frames.push(frame(2,'慢指针迈一步','slow 到达 '+values[slow]+'。',[slow]));
        fast=links[links[fast]]; frames.push(frame(3,'快指针迈两步','fast 到达 '+values[fast]+'。比较时看的是地址。',[fast]));
        const met=slow===fast;
        frames.push(frame(4,met?'同址相遇':'本轮尚未相遇',met?'两个游标都保存 0x410。函数返回 true。':'slow 与 fast 的地址不同，继续下一轮。',met?[slow]:[slow,fast]));
      }
      return frames;
    })(),
    quiz:quiz('一条无环链表里出现两个值都是 37 的结点。可以比较 slow->value 和 fast->value 来判环吗？',['可以，值相等就是相遇','不可以，要比较两个指针的地址','只比较结点的 next 是否都非空'],1,'不同结点可以存相同的数据。判环中的相遇要求两个游标确实到达同一个对象。')
  });

  globalThis.ATLAS.push(...lessons);
})();
