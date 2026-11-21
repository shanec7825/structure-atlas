const WORLD_MIDDLE = (() => {
  const row=(label,value)=>({label,value});
  const join=path=>path.join(" → ");

  function codeCost(longTake){
    const copies=longTake?4:1,counts=[8,4,3,1].map(f=>f*copies);
    const heap=counts.slice();
    let payload=0;
    while(heap.length>1){heap.sort((a,b)=>a-b);const weight=heap.shift()+heap.shift();heap.push(weight);payload+=weight;}
    const fixed=counts.reduce((a,b)=>a+b,0)*2,header=2*counts.length,total=payload+header;
    return {plot:{type:"bits",fixed,payload,header,max:Math.max(fixed,total)},
      rows:[row("等长编码",fixed+" bit"),row("变长编码",payload+" + "+header+" = "+total+" bit"),row("净差额",total>fixed?"多用 "+(total-fixed)+" bit":"省下 "+(fixed-total)+" bit")],
      observation:copies+" 段共 "+(16*copies)+" 拍，"+(total>fixed?"码表开销盖过正文节省。":"每段省下的位数已摊平码表开销。"),
      mechanism:"用哈夫曼树决定码长。每 16 拍，正文从 32 bit 降到 28 bit；四种音色的码长各传 2 bit，一首只传一次。",
      limit:"两段恰好打平。双方约定规范码的排列规则、四种音色与总拍数；文件头、字节对齐未计入。"};
  }

  function routes(slow){
    const pitch={A:[["B",1],["C",1]],B:[["D",slow?5:1]],C:[["E",1]],D:[],E:[["D",1]]};
    function path(weighted){
      const cost={A:0},prev={},settled=new Set(),queue=["A"];
      while(queue.length){
        if(weighted)queue.sort((a,b)=>cost[a]-cost[b]);
        const u=queue.shift();
        if(settled.has(u))continue;
        if(u==="D")break;
        settled.add(u);
        for(const [v,w] of pitch[u]){
          const d=cost[u]+(weighted?w:1);
          if(d<(cost[v]??Infinity)){cost[v]=d;prev[v]=u;queue.push(v);}
        }
      }
      const out=[];for(let v="D";v!==undefined;v=prev[v])out.unshift(v);
      const seconds=out.slice(1).reduce((n,v,i)=>n+pitch[out[i]].find(([to])=>to===v)[1],0);
      return {nodes:out,seconds};
    }
    const fewest=path(false),fastest=path(true);
    const report=p=>join(p.nodes)+" · "+(p.nodes.length-1)+" 传 / "+p.seconds+" 秒";
    const edges=Object.entries(pitch).flatMap(([from,exits])=>exits.map(([to,seconds])=>[from,to,seconds]));
    return {plot:{type:"pitch",edges,fast:fastest.nodes},
      rows:[row("B 传 D",pitch.B[0][1]+" 秒"),row("最少传球",report(fewest)),row("最快到达",report(fastest))],
      observation:slow?"被盯防后，三次短传比两次传球早到 3 秒。":"每条线都耗时 1 秒，两种准则选中同一条路线。",
      mechanism:"广度优先搜索按传球次数分层。Dijkstra 按目前最小累计秒数确定结点。",
      limit:"边权不等时，少传一次未必更快。这里各传球耗时固定且非负，接球等待已计入线路时间。"};
  }

  function rotateLineup(rotated){
    const n=(k,l=null,r=null)=>({k,l,r});
    let root=n(30,n(20,n(10,n(5)),n(25)),n(40));
    if(rotated){const promoted=root.l;root.l=promoted.r;promoted.r=root;root=promoted;}
    const inorder=t=>t?[...inorder(t.l),t.k,...inorder(t.r)]:[];
    const height=t=>t?1+Math.max(height(t.l),height(t.r)):0;
    function find(k){
      const p=[];let t=root;
      while(t){p.push(t.k);if(k===t.k)break;t=k<t.k?t.l:t.r;}
      return join(p)+"（"+p.length+" 次）";
    }
    return {rows:[row("找 5 号",find(5)),row("找 40 号",find(40)),row("中序出场",inorder(root).join("、"))],
      observation:rotated?"树高降到 "+height(root)+"。5 号少走一步，40 号却多走一步。":"树高为 "+height(root)+"。5 号在深处，40 号就在根的右边。",
      mechanism:"20 升到 30 上方，原先夹在两者之间的 25 被接回 30 左边。因此键的大小次序得以保留。",
      limit:"平衡约束改善最坏查询深度，每个指定球员的路径仍可能变长。"};
  }

  function regionTest(touch){
    const xmax=touch?4:3;
    const points=[[1,1],[2,3],[3,4],[4,1],[4,2],[6,3],[7,4]];
    const found=[],tested=[];let skipped=0;
    function visit(ps,b,depth){
      if(!ps.length)return;
      if(b[0]>xmax||b[1]<1||b[2]>4||b[3]<1){skipped+=ps.length;return;}
      const dimension=depth%2;
      const sorted=ps.slice().sort((p,q)=>p[dimension]-q[dimension]||p[1-dimension]-q[1-dimension]);
      const i=Math.floor(sorted.length/2),p=sorted[i],left=[...b],right=[...b];
      tested.push(p);
      if(p[0]>=1&&p[0]<=xmax&&p[1]>=1&&p[1]<=4)found.push(p);
      left[dimension*2+1]=p[dimension];right[dimension*2]=p[dimension];
      visit(sorted.slice(0,i),left,depth+1);visit(sorted.slice(i+1),right,depth+1);
    }
    visit(points,[.5,7.5,.5,4.5],0);
    found.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    return {rows:[row("命中落点",found.map(p=>"("+p.join(",")+")").join(" ")),row("逐点检查",tested.length+" / 7"),row("整区跳过",skipped+" 点")],
      observation:touch?"右边界刚碰到分割线，右子树里的 (4,2) 也被框住。":"右子树所在区域从 x=4 开始；框只到 x=3，整棵右子树可以跳过。",
      mechanism:"先检验框与子树的空间区域是否相交，再检验单个落点。分割线上可以有多个同横坐标的点。",
      limit:"查询框包含边界。两块区域只要在边线上接触，就不能用「完全分离」剪枝。"};
  }
  return {
    5:{title:"寄出一段鼓点",question:"正文更短，寄出去也一定更小吗？",condition:"16 拍中四种音色分别出现 8、4、3、1 次。同一段可重复，码长表只寄一次。",choices:["寄 1 段","寄 4 段"],experiment:codeCost},
    6:{title:"球被盯住时",question:"少传一次，球一定更早到吗？",condition:"从 A 传到 D。只改变 B 传 D 的耗时，其余每条传球线都用 1 秒。",choices:["空位 · 1 秒","盯防 · 5 秒"],experiment:routes},
    7:{title:"队长换位",question:"树变矮，每个人都更好找吗？",condition:"同样六件球衣，固定查找 5 号与 40 号，只改变根处的一次右旋。",choices:["保持阵形","右旋根结点"],experiment:rotateLineup},
    8:{title:"压线也算落点",question:"框边刚好碰线，还能跳过另一半球场吗？",condition:"七个落点固定，纵向始终覆盖 1–4。把查询框的右沿从 x=3 推到分割线 x=4。",choices:["离线一格","贴到分割线"],experiment:regionTest}
  };
})();
