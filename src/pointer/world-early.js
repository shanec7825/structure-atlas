const WORLD_EARLY = {
  1: {
    title:'两块场地能省几轮',
    question:'四人单循环，开第二块场地会让比赛总数减少吗？',
    condition:'四人各交手一次，每场五分钟。每人同一轮只能打一场。',
    choices:['一块场地','两块场地'],
    experiment(variant){
      const capacity=variant===1?2:1;
      const rounds=[['AB','CD'],['AC','BD'],['AD','BC']];
      const schedule=rounds.flatMap(round=>capacity===1?round.map(match=>[match]):[round]);
      const matches=schedule.flat().length,minutes=schedule.length*5;
      return {
        rows:[{label:'第一轮',value:schedule[0].join(' ＋ ')},{label:'总场数',value:matches+' 场'},{label:'最短赛程',value:schedule.length+' 轮 · '+minutes+' 分钟'}],
        observation:capacity===1?'AB 和 CD 没有共用选手，却要轮流等场。':'AB 与 CD 同时开赛；接下来的两轮也能各排两场。',
        mechanism:'六场比赛仍须逐场完成。把没有共同选手的两场放在同一轮，可缩短总用时。',
        limit:'四人同时最多打两场。即使再开一块场地，每人仍要打三场，至少三轮。'
      };
    }
  },
  2: {
    title:'最后一个空槽',
    question:'只在训练带末尾添一拍，原来那张地址标签还能用吗？',
    condition:'带内已有跑、停、跳三项。每项占 4 字节，现有标签指向「跳」。',
    choices:['还空一格','原带已满'],
    experiment(variant){
      const previous=['跑','停','跳'],capacity=variant===1?3:4;
      const oldBase=0x100,newBase=previous.length===capacity?0x240:oldBase;
      const oldAt=oldBase+4*2,redirected=newBase!==oldBase;
      const next=redirected?Array.from(previous):previous;next.push('蹲');
      const address=n=>'0x'+n.toString(16).toUpperCase();
      return {
        rows:[{label:'追加结果',value:next.join(' · ')},{label:'迁移旧项',value:(redirected?next.length-1:0)+' 项'},{label:'跳的位置',value:address(oldAt)+' → '+address(newBase+4*2)},{label:'旧标签',value:redirected?'已失效':'仍指向跳'}],
        observation:redirected?'新带装下四项，旧带被释放。按旧标签读取会访问失效对象。':'新拍写入第四格；前面的对象保留原地址。',
        mechanism:'向量连续存放元素。容量不足时，本模型另开双倍容量的新带，迁移原有对象后释放旧带。',
        limit:'地址为示意值。已有空位时尾插为 O(1)；迁移 n 个定长元素的该次尾插为 O(n)。几何扩容下连续尾插均摊 O(1)。'
      };
    }
  },
  3: {
    title:'手里只有一个门牌',
    question:'知道「拍」住在哪里，就能从单链表中摘下这个结点吗？',
    condition:'入口的复查员能看到整条链。操作者没有入口，只能沿手中门牌的 next 向前走；四个结点的身份必须保留。',
    choices:['只有目标地址','另有前驱地址'],
    experiment(variant){
      const target=0x40, predecessor=variant===1?0xA0:null,entry=0x180;
      const nodes=new Map([[entry,{s:'咚',next:0xA0}],[0xA0,{s:'嚓',next:target}],[target,{s:'拍',next:0x210}],[0x210,{s:'嗒',next:null}]]);
      function walk(start){const heard=[];for(let n=start;n!==null;n=nodes.get(n).next)heard.push(nodes.get(n).s);return heard;}
      const reachable=walk(target),relinked=predecessor!==null&&nodes.get(predecessor).next===target;
      if(relinked)nodes.get(predecessor).next=nodes.get(target).next;
      const address=n=>n===null?'∅':'0x'+n.toString(16).toUpperCase();
      const cells=[...nodes.entries()].sort(([a],[b])=>a-b).map(([id,node])=>({
        id:address(id),sound:node.s,next:address(node.next),held:id===target||id===predecessor
      }));
      return {
        plot:{type:'addresses',cells},
        rows:[{label:'手中门牌',value:relinked?'0x40 ＋ 0xA0':'0x40'},{label:'从目标能读到',value:reachable.join(' → ')},{label:'改写前驱',value:relinked?'嚓.next ← 0x210':'够不到嚓.next'},{label:'入口复查',value:walk(entry).join(' → ')}],
        observation:relinked?'改写嚓的出口后，复查员从嚓直接跳到嗒。「拍」仍然存活，已经离开主链。':'能读写「拍」，也能读到「嗒」，却无法沿 next 回到「嚓」并改写它的出口。',
        mechanism:'摘掉目标对象，必须修改指向它的那一栏。单向结点只保存自己的出口，前驱地址无法从门牌数值推算。',
        limit:'额外给出前驱后摘链为 O(1)；如果只补给入口，则可从头 O(n) 寻找前驱。这里不执行释放，也不允许用复制后继数据替代摘除指定对象。'
      };
    }
  },
  4: {
    title:'总是被挤到最后的人',
    question:'同样的入场名单，只换取人的一端，白号何时登场？',
    condition:'开始时白号已在等候，尚未放行。随后红、蓝、绿依次从末端加入，每加入一人就放行一人，共放行三次。',
    choices:['从末端放行','从前端放行'],
    experiment(variant){
      const stack=variant!==1,line=['白'],order=[];
      for(const next of ['红','蓝','绿']){line.push(next);order.push(stack?line.pop():line.shift());}
      const turn=order.indexOf('白');
      return {
        rows:[{label:'三次出场',value:order.join(' → ')},{label:'仍在等',value:line.join(' · ')},{label:'白号',value:turn<0?'三轮都未出场':'第 '+(turn+1)+' 轮出场'}],
        observation:stack?'每轮新来的人恰好挡在出口，白号一直压在底下。':'白号在出口最前。红号要等到第二轮，绿号还在队尾。',
        mechanism:stack?'这扇门实行后进先出。新的请求能反复越过旧请求。':'这扇门实行先进先出。新加入者不会插到已经等待者之前。',
        limit:stack?'若持续照此到人，白号可能永远等不到；一旦停止到人并继续放行，它就会出场。':'能否最终出场还取决于是否继续放行。队列只规定次序，不能保证服务速度。'
      };
    }
  }
};
