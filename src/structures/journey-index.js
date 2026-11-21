(() => {
  "use strict";
  const book = typeof JOURNEY === "undefined" ? (globalThis.JOURNEY ||= {}) : JOURNEY;
  const safe = x => String(x).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const button = (op,label,value="",attrs="") => `<button type="button" data-op="${op}" data-v="${safe(value)}" ${attrs}>${label}</button>`;
  const svg = (w,h,label,body) => `<svg class="ji-art" viewBox="0 0 ${w} ${h}" role="group" aria-label="${safe(label)}" xmlns="http://www.w3.org/2000/svg"><title>${safe(label)}</title>${body}</svg>`;
  const text = (x,y,content,size=14,color="#263e42",more="") => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}" ${more}>${safe(content)}</text>`;
  const nums = arr => arr.join(" → ");
  const height = n => n?.h ?? 0;
  function growTree(sequence,balanced) {
    const events=[];
    function update(n) { n.h=1+Math.max(height(n.l),height(n.r)); return n; }
    function rotate(n,toRight) {
      const up=toRight?n.l:n.r;
      if(toRight){n.l=up.r;up.r=n;}else{n.r=up.l;up.l=n;}
      update(n);update(up);
      events.push({at:n.k,top:up.k,way:toRight?"右旋":"左旋",step:current});
      return up;
    }
    let current=0;
    function insert(n,k){
      if(!n) return {k,h:1,l:null,r:null};
      if(k<n.k)n.l=insert(n.l,k);else n.r=insert(n.r,k);
      update(n);
      if(!balanced)return n;
      const diff=height(n.l)-height(n.r);
      if(diff>1){if(k>n.l.k)n.l=rotate(n.l,false);return rotate(n,true);}
      if(diff< -1){if(k<n.r.k)n.r=rotate(n.r,true);return rotate(n,false);}
      return n;
    }
    let root=null;
    for(const k of sequence){current++;root=insert(root,k);}
    return {root,events};
  }
  function visits(n,key) {
    const result=[];
    while(n){result.push(n.k);if(n.k===key)break;n=key<n.k?n.l:n.r;}
    return result;
  }
  function treePicture(root,sorted,path,color,name,depth) {
    const W=332,H=Math.max(156,71+depth*33),p=name==="AVL"?"ji-away":"ji-home";
    let edges="",nodes="";
    const x=k=>sorted.length<2?W/2:28+276*sorted.indexOf(k)/(sorted.length-1);
    function chart(n,d){
      if(!n)return;
      const cx=x(n.k),cy=54+d*33;
      for(const child of [n.l,n.r])if(child){
        const lit=path.includes(n.k)&&path.includes(child.k);
        edges+=`<path d="M${cx} ${cy} Q${cx} ${cy+14} ${x(child.k)} ${cy+33}" fill="none" stroke="${lit?"#ffd77b":"#abbfb1"}" stroke-width="${lit?3.9:1.7}" stroke-linecap="round"/>`;chart(child,d+1);
      }
      const lit=path.includes(n.k);
      nodes+=`<g class="ji-interact" data-op="query-node" data-v="${n.k}" tabindex="0" role="button" aria-label="查询 ${n.k} 号运动员">
        <circle cx="${cx}" cy="${cy}" r="17" fill="transparent"/><g transform="translate(${cx} ${cy})">
        <ellipse cx="1" cy="9" rx="11" ry="4" fill="#062922" opacity=".42"/>
        <path d="M-5-12l-7 3-5 7 5 4 3-4v14H9V-2l3 4 5-4-5-7-7-3q-5 5-10 0Z" fill="url(#${p}-shirt)" stroke="${lit?"#ffdb80":"#e7e7d1"}" stroke-width="${lit?2.3:1.1}"/>
        <path d="M-5-11q5 7 10 0m-19 10 4 3m20-3-4 3" fill="none" stroke="#fff4cb" stroke-width="1.3"/>
        ${text(0,7,n.k,13,"#fffdf1","font-family='Arial,sans-serif' font-weight='800'")}</g></g>`;
    }
    chart(root,0);
    const levels=Array.from({length:height(root)},(_,d)=>`<path d="M12 ${54+d*33}h308" stroke="#c9d6bc" opacity=".16" stroke-width="1" stroke-dasharray="2 5"/>`).join("");
    return svg(W,H,name,`<defs><linearGradient id="${p}-field" x2="0" y2="1"><stop stop-color="#315c52"/><stop offset="1" stop-color="#20473f"/></linearGradient>
      <linearGradient id="${p}-shirt" x2=".8" y2="1"><stop stop-color="${name==="AVL"?"#bd7145":"#557eae"}"/><stop offset=".63" stop-color="${color}"/><stop offset="1" stop-color="${name==="AVL"?"#87432b":"#324c73"}"/></linearGradient></defs>
      <rect x="1" y="2" width="330" height="${H-5}" rx="9" fill="#897861"/><rect x="4" y="5" width="324" height="${H-12}" rx="7" fill="url(#${p}-field)" stroke="#c3af8c"/>
      <path d="M13 32H319" stroke="#d0d7c0" opacity=".55"/>${levels}
      ${text(15,25,name,15,"#fff5d8",'style="text-anchor:start" font-weight="720"')}${text(316,25,"高 "+height(root),14,"#e6e6cc",'style="text-anchor:end"')}${edges}${nodes}
      ${!root?text(166,83,"等待第一位入场",15,"#deead8"):""}`);
  }
  function makeTeam(ctx) {
    const tint=(ctx?.voices||[]).slice(0,4).reduce((s,v)=>s+(Number(v)||0),0)%6;
    const sequence=[1,2,3,4,5,6,7,8,9].map(x=>x*7+tint);
    return {sequence,entered:3,orderText:sequence.join(" "),queryText:String(sequence.at(-1)),query:null,notice:"前三位已入场。继续放人，或自己安排一份名单。"};
  }
  book[7]={
    title:"双场入队",invite:"给同一队球员排一份入场顺序，看两位教练把人排出什么形状。",form:"并排球衣阵列",
    related:["bst-insert","bst-search","avl-rotate"],initial:makeTeam,
    act(s,op,value,fields={}){
      const orderText=String(fields.teamOrder??s.orderText),queryText=String(fields.teamQuery??s.queryText);
      const base={...s,orderText,queryText};
      if(op==="order"){
        const parts=orderText.trim().split(/[\s,，、]+/),sequence=parts.map(Number);
        if(!orderText.trim()||parts.length>9||parts.some(t=>!/^\d{1,2}$/.test(t)||+t<1)||new Set(sequence).size!==sequence.length)
          return {...base,notice:"请输入 1 至 9 个互异的 1–99 号球衣，用空格或逗号分开。"};
        return {...base,sequence,entered:0,query:null,notice:"两块场地已腾空。按入场键放入你名单中的第一位。"};
      }
      if(op==="enter"||op==="enter-all"){
        const entered=op==="enter-all"?s.sequence.length:Math.min(s.sequence.length,s.entered+1);
        return {...base,entered,query:null,notice:entered===s.entered?"名单上的球员已全部入场。":op==="enter-all"?"名单上的球员已按顺序全部入场。":s.sequence[entered-1]+" 号刚在两块场地同时入队。"};
      }
      if(op==="query"||op==="query-node"){
        const raw=String(op==="query-node"?value:queryText).trim();
        if(!/^\d{1,2}$/.test(raw)||+raw<1)return {...base,notice:"查询号码须为 1–99 的整数。"};
        return {...base,queryText:raw,query:+raw,notice:""};
      }
      return base;
    },
    view(s){
      const used=s.sequence.slice(0,s.entered),sorted=[...used].sort((a,b)=>a-b);
      const bst=growTree(used,false),avl=growTree(used,true);
      const paths=s.query===null?[[],[]]:[visits(bst.root,s.query),visits(avl.root,s.query)];
      const recent=avl.events.filter(e=>e.step===s.entered),rot=recent.map(e=>e.at+" "+e.way+"，"+e.top+" 升起").join("；");
      const found=used.includes(s.query);
      const scene=`<div class="ji-dual">${treePicture(bst.root,sorted,paths[0],"#3d6191","普通 BST",height(bst.root))}${treePicture(avl.root,sorted,paths[1],"#a25c36","AVL",height(avl.root))}</div>
        <div class="ji-order" aria-label="入场名单"><small>入场顺序</small>${s.sequence.map((k,i)=>`<span class="${i<s.entered?"ji-in":i===s.entered?"ji-next":""}" aria-label="${k} 号，${i<s.entered?"已入场":i===s.entered?"下一位":"候场"}">${k}</span>`).join("")}</div>`;
      return {scene,controls:`<div class="ji-controls"><label>入场次序<input name="teamOrder" value="${safe(s.orderText)}" maxlength="65" placeholder="如 30 10 20"></label>${button("order","采用名单")}
        ${button("enter","下一位入场","",s.entered===s.sequence.length?"disabled":"")}${button("enter-all","余下全部入场","",s.entered===s.sequence.length?"disabled":"")}
        <label>查球衣号<input name="teamQuery" type="text" inputmode="numeric" maxlength="2" value="${safe(s.queryText)}"></label>${button("query","查找")}</div>`,
        caption:s.notice || (s.query!==null?`${s.query} 号${found?"已找到":"未入场"}。BST 经过 ${nums(paths[0])||"空树"}；AVL 经过 ${nums(paths[1])||"空树"}。`:""),
        math:s.query!==null?`访问结点：BST ${paths[0].length} 个，AVL ${paths[1].length} 个；当前树高分别为 ${height(bst.root)}、${height(avl.root)}。`:
          `入场 ${used.length} 人；BST 高 ${height(bst.root)}，AVL 高 ${height(avl.root)}。本次末位入场${rot?"触发 "+rot:"未触发旋转"}；累计 ${avl.events.length} 次单旋。`,
        cpp:s.query!==null?`Node* p = root; int visits = 0;\nwhile (p) {\n  ++visits;\n  if (p->k == ${s.query}) break;\n  p = ${s.query} < p->k ? p->left : p->right;\n}\n// 针对两棵树分别从根开始计数`:
          'Node* insertAVL(Node* p, int k) {\n  if (!p) return leaf(k);\n  if (k < p->k) p->left = insertAVL(p->left,k);\n  else p->right = insertAVL(p->right,k);\n  updateHeight(p);\n  return rebalance(p); // 失衡时单旋或双旋，返回子树新根\n}',
        why:"树高按路径上的结点数计算，空树高 0。球衣之间的线是父子关系，两树中序排列相同。AVL 的每个结点都有 |左高 − 右高| ≤ 1，查询最坏 O(log n)。普通 BST 的形状随入场次序改变，最坏可以是一条长为 n 的链。",
        challenge:"用同一组 7 个编号，分别按升序和你自己设计的次序入场。找出一位球员，让两种次序的普通 BST 查询访问数相差至少 3。"};
    }
  };

  const xy=(x,y)=>[70+(x-1)*88,292-(y-1)*72];
  const full=[.5,6.5,.5,4.5];
  const posKey=(x,y)=>x+","+y;
  const pString=([x,y])=>"("+x+","+y+")";
  function partition(ps,bounds=full,depth=0){
    if(!ps.length)return null;
    const axis=depth%2, sorted=[...ps].sort((a,b)=>a[axis]-b[axis]||a[1-axis]-b[1-axis]);
    const mid=Math.floor(sorted.length/2),point=sorted[mid],left=[...bounds],right=[...bounds];
    left[axis*2+1]=point[axis];right[axis*2]=point[axis];
    return {point,axis,bounds,size:ps.length,left:partition(sorted.slice(0,mid),left,depth+1),right:partition(sorted.slice(mid+1),right,depth+1)};
  }
  const disjoint=(a,b)=>a[1]<b[0]||a[0]>b[1]||a[3]<b[2]||a[2]>b[3];
  function scan(n,q,result){
    if(!n)return;
    if(disjoint(n.bounds,q)){result.regions.push(n.bounds);result.skipped+=n.size;return;}
    result.seen.push(n.point);
    const [x,y]=n.point;
    if(x>=q[0]&&x<=q[1]&&y>=q[2]&&y<=q[3])result.hits.push(n.point);
    scan(n.left,q,result);scan(n.right,q,result);
  }
  function court(s,root,r) {
    const inputSet = new Set(s.points.map(p=>p.join(","))),hits=new Set(r.hits.map(p=>p.join(","))),seen=new Set(r.seen.map(p=>p.join(",")));
    function rect(b,attrs,pad=0){
      const [x,y]=xy(b[0],b[3]),[x2,y2]=xy(b[1],b[2]);
      return `<rect x="${x-pad}" y="${y-pad}" width="${x2-x+2*pad}" height="${y2-y+2*pad}" ${attrs}/>`;
    }
    let lines="";
    function cut(n){
      if(!n)return;
      if(n.left||n.right){
        const [x,y]=n.point,[xmin,xmax,ymin,ymax]=n.bounds;
        const [ax,ay]=n.axis?xy(xmin,y):xy(x,ymin),[bx,by]=n.axis?xy(xmax,y):xy(x,ymax);
        lines+=`<path d="M${ax} ${ay}L${bx} ${by}" fill="none" stroke="${n.axis?"#975840":"#346e80"}" stroke-width="2.4" stroke-dasharray="${n.axis?"8 4":"3 3"}"/>`;
      }cut(n.left);cut(n.right);
    }cut(root);
    let grid="",labels="";
    for(let x=1;x<=6;x++)for(let y=1;y<=4;y++){
      const k=posKey(x,y),[cx,cy]=xy(x,y),present=inputSet.has(k),hit=hits.has(k);
      const select=s.anchor?.[0]===x&&s.anchor?.[1]===y;
      const action=s.mode==="plot"?(present?"移除":"放置")+"落点":"选择框角";
      grid+=`<g class="ji-interact ji-point" data-op="spot" data-v="${k}" data-hit="${hit}" tabindex="0" role="button" aria-label="${action} (${k})${present?(hit?"，框内命中":seen.has(k)?"，已检查":"，整区跳过"):""}">
        <rect x="${cx-39}" y="${cy-32}" width="78" height="64" rx="7" fill="transparent"/>
        ${present?`<g transform="translate(${cx} ${cy})" opacity="${hit||seen.has(k)?1:.67}">
          <ellipse cx="3" cy="8" rx="12" ry="7" fill="#66503a" opacity=".34"/>
          ${hit?'<circle r="16" fill="none" stroke="#225c59" stroke-width="2.6"/>':""}
          <circle r="11.7" fill="url(#${hit?"ji-orange":seen.has(k)?"ji-blueball":"ji-ash"})" stroke="${hit?"#844424":"#40534c"}" stroke-width="1.4"/>
          <path d="M-11-4q12-3 22 9M-5-10q9 9 4 21m-9-6q7-6 8-16" fill="none" stroke="${hit?"#88472c":"#586760"}" stroke-width="1.2"/>
          <path d="M-7-7q2-2 4-2" stroke="#fff7db" opacity=".8" stroke-width="2" stroke-linecap="round"/></g>`:`<path d="M${cx-3} ${cy}h6m-3-3v6" stroke="#826747" stroke-width="1.5"/>`}
        ${select?`<circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#fff099" stroke-width="3"/>`:""}</g>`;
    }
    for(let x=1;x<=6;x++)labels+=text(xy(x,1)[0],350,x,14);
    for(let y=1;y<=4;y++)labels+=text(15,xy(1,y)[1]+5,y,14);
    return svg(580,365,"kd 树球场，横坐标 1 至 6，纵坐标 1 至 4",`<defs>
      <pattern id="ji-hatch" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M-2 2l4-4m-2 9l9-9m-2 11l4-4" stroke="#273f41" stroke-width="1.8" opacity=".42"/></pattern>
      <pattern id="ji-parquet" width="130" height="32" patternUnits="userSpaceOnUse"><rect width="130" height="32" fill="#dcb989"/><rect y="16" width="130" height="16" fill="#e3c399"/><path d="M0 0h130M0 16h130M27 0v16m68 0v16" stroke="#a5825e" opacity=".39"/><path d="M42 8q23-3 54-1m-71 15q20 2 35 1" stroke="#b58f67" opacity=".35" fill="none"/></pattern>
      <radialGradient id="ji-orange" cx=".29" cy=".22" r=".82"><stop stop-color="#ffd29c"/><stop offset=".5" stop-color="#e69253"/><stop offset="1" stop-color="#a85831"/></radialGradient>
      <radialGradient id="ji-blueball" cx=".3" cy=".2" r=".85"><stop stop-color="#dbdfe4"/><stop offset=".45" stop-color="#9baeb5"/><stop offset="1" stop-color="#597988"/></radialGradient>
      <radialGradient id="ji-ash" cx=".3" cy=".2" r=".85"><stop stop-color="#d0cab9"/><stop offset="1" stop-color="#959285"/></radialGradient></defs>
      <rect x="24" y="41" width="532" height="291" rx="7" fill="#987555"/>
      <rect x="25" y="38" width="530" height="290" rx="6" fill="url(#ji-parquet)" stroke="#8e7657" stroke-width="2.4"/>
      <path d="M35 142h77v83H35m511-83h-77v83h77" fill="#728e82" opacity=".57"/>
      <g stroke="#ffefcd" fill="none" stroke-width="2.6"><rect x="35" y="48" width="511" height="272" rx="1"/><path d="M290 48v272m-255-178h77v83H35m511-83h-77v83h77M35 64h24a122 122 0 0 1 0 240H35m511-240h-24a122 122 0 0 0 0 240h24"/><circle cx="290" cy="184" r="38"/><circle cx="112" cy="184" r="26"/><circle cx="469" cy="184" r="26"/></g>
      <g fill="none" stroke="#64766b" stroke-width="2"><path d="M43 169v30m494-30v30"/><circle cx="49" cy="184" r="5"/><circle cx="531" cy="184" r="5"/></g>
      ${r.regions.map(b=>rect(b,'fill="url(#ji-hatch)"')).join("")}${lines}
      ${rect(s.q,'fill="#fff2a2" fill-opacity=".26" stroke="#296865" stroke-width="4" rx="3"',5)}
      ${grid}${labels}<circle cx="108" cy="18" r="6" fill="#d98548"/>${text(164,23,"框内 "+r.hits.length,15)}<circle cx="251" cy="18" r="6" fill="#7898a1"/>${text(315,23,"框外已查 "+(r.seen.length-r.hits.length),15)}<rect x="405" y="12" width="14" height="13" fill="url(#ji-hatch)"/>${text(472,23,"整区跳过 "+r.skipped,15)}`);
  }
  function firstCourt(ctx) {
    const shift=(ctx?.voices?.[0]??0)%2;
    return {points:[[1,1],[2,3],[3,2],[4,4],[5,1+shift],[6,3]],q:[1,3,1,2],mode:"plot",anchor:null,notice:"点交叉位放球，再点一次收回。"};
  }
  book[8]={
    title:"球场落点分区",invite:"自己布一场落点，再画一个框，看看哪些区域可以整块略过。",form:"可编辑球场",related:["bst-search","btree-root-split"],initial:firstCourt,
    act(s,op,value,fields,ctx){
      if(op==="plot"||op==="box")return {...s,mode:op,anchor:null,notice:op==="plot"?"点一个位置布球，或点已有的球收回。":"点第一个框角，再点对角；框边也计入结果。"};
      if(op==="restore")return firstCourt(ctx);
      if(op!=="spot"||!/^[1-6],[1-4]$/.test(String(value)))return s;
      const p=String(value).split(",").map(Number);
      if(s.mode==="plot"){
        const present=s.points.some(v=>v[0]===p[0]&&v[1]===p[1]);
        const points=present?s.points.filter(v=>v[0]!==p[0]||v[1]!==p[1]):[...s.points,p];
        return {...s,points,notice:`${present?"收回":"放入"}落点 ${pString(p)}，已按各层中位点重新划分球场。`};
      }
      if(!s.anchor)return {...s,anchor:p,notice:"第一角是 "+pString(p)+"。再点一个位置完成范围框。"};
      const [x,y]=s.anchor;
      return {...s,anchor:null,q:[Math.min(x,p[0]),Math.max(x,p[0]),Math.min(y,p[1]),Math.max(y,p[1])],notice:"范围框已更新。斜纹区域的子树在检测落点前被跳过。"};
    },
    view(s){
      const root=partition(s.points),r={seen:[],hits:[],skipped:0,regions:[]};scan(root,s.q,r);
      return {scene:court(s,root,r),controls:`<div class="ji-controls">${button("plot","布置落点","","aria-pressed='"+(s.mode==="plot")+"'")}${button("box","点击两角框选","","aria-pressed='"+(s.mode==="box")+"'")}${button("restore","还原示例")}</div>`,
        caption:s.notice,
        math:`Q = [${s.q[0]},${s.q[1]}] × [${s.q[2]},${s.q[3]}]。逐点检测 ${r.seen.length}，剪去 ${r.skipped}，共 ${s.points.length} 个落点。命中 ${r.hits.map(pString).join("、")||"0 个落点"}。`,
        cpp:'void range(Node* n, Rect q) {\n  if (!n || disjoint(n->region,q)) return;\n  if (containsClosed(q,n->point)) emit(n->point);\n  range(n->left,q); range(n->right,q);\n}\n// disjoint 使用严格小于/大于；边界相接仍要检查',
        why:"这里选中位点建树，偶数层沿 x、奇数层沿 y 切割父区域。与分割线同坐标的点可能分在两侧，边界查询会检查两边。矩形区域与框分离时，里面所有点都可跳过。画面的厘米长度不参与剪枝；本实现逐层排序建树，范围查找最坏访问 n 个结点。",
        challenge:"让框只剩一条竖线，放一颗球恰在框边；能否在命中它的同时，让至少一个非空分区完全不必查看？"};
    }
  };

  // null is a never-occupied locker; false is a deleted locker.
  const keySum = key => Array.from(key).reduce((total,ch)=>total+ch.codePointAt(0),0);
  function probe(slots,key) {
    const m=slots.length,start=keySum(key)%m,path=[];
    let deleted=-1;
    for(let t=0;t<m;t++){
      const i=(start+t)%m;
      path.push(i);
      if(slots[i]===key)return {start,path,found:i,room:i};
      if(slots[i]===null)return {start,path,found:-1,room:deleted>=0?deleted:i};
      if(slots[i]===false&&deleted<0)deleted=i;
    }
    return {start,path,found:-1,room:deleted};
  }
  function operate(s,op,raw) {
    const key=String(raw??"").trim().normalize("NFC");
    const base={...s,keyText:key};
    if(!/^[\p{L}\p{N}]{1,4}$/u.test(key))return {...base,last:null,notice:"请用 1 至 4 个字母、汉字或数字给采样起名。"};
    const slots=[...s.slots],scan=probe(slots,key),last={...scan,key,op};
    let notice;
    if(op==="put"){
      if(scan.found>=0)notice=key+" 已存在于 "+scan.found+" 号柜，保持原样。";
      else if(scan.room<0)notice="绕行一整圈仍无空位。这次保存失败，可以扩大柜组。";
      else {const reused=slots[scan.room]===false;slots[scan.room]=key;notice=key+" 已放入 "+scan.room+" 号柜。"+(reused?"先确认整条探测链里没有重名，再复用遇见的第一个墓碑。":"");}
    }else if(op==="remove"){
      if(scan.found>=0){slots[scan.found]=false;notice="取出 "+key+"，在 "+scan.found+" 号留下墓碑。后续查找会继续越过它。";}
      else notice="没有找到 "+key+"，柜组保持原样。";
    }else{
      notice=scan.found>=0?"在 "+scan.found+" 号柜找到 "+key+"。":"没有 "+key+"。"+(slots[scan.path.at(-1)]===null?"遇到从未使用的空柜，查找可以停止。":"已探测完整一圈。");
    }
    return {...base,slots,last,notice};
  }
  function firstCabinet() {
    let s={slots:Array(7).fill(null),keyText:"O",last:null,notice:""};
    for(const key of ["A","H"])s=operate(s,"put",key);
    return {...s,keyText:"O",last:null,notice:"A 和 H 都从 2 号柜起步。给新采样 O 找个位置，看看它经过哪几扇门。"};
  }
  function cabinetArt(s){
    const m=s.slots.length,cols=Math.min(5,m),rows=Math.ceil(m/cols),H=67+rows*125;
    let doors="";
    const doorWidth=86,step=99,left=(540-((cols-1)*step+doorWidth))/2;
    for(let i=0;i<m;i++){
      const x=left+(i%cols)*step,y=37+Math.floor(i/cols)*125,v=s.slots[i];
      const idx=s.last?.path.indexOf(i)??-1,active=idx>=0;
      const marker=active?`<circle cx="74" cy="10" r="9.5" fill="#f0b359" stroke="#5f462e"/>${text(74,14,idx+1,12,"#3a2c21","font-weight='750'")}`:"";
      const inside=v?`<g><rect x="7" y="20" width="72" height="55" rx="5" fill="url(#ji-tape)" stroke="#152c2b"/>
        <path d="M12 25h62v19H12Z" fill="#f2dfb4"/><path d="M12 41h62" stroke="#da9862" stroke-width="3"/>
        ${text(43,39,v,Array.from(v).length>=4?13:17,"#2c3936","font-weight='750'")}
        <rect x="16" y="47" width="54" height="15" rx="7.5" fill="#243b3c" stroke="#9fb5a2"/>
        <g fill="#c7c8ad" stroke="#354744"><circle cx="24" cy="54.5" r="5"/><circle cx="62" cy="54.5" r="5"/></g>
        <g fill="#43564f"><circle cx="24" cy="54.5" r="2"/><circle cx="62" cy="54.5" r="2"/></g>
        <path d="M34 52h18v5H34Z" fill="#ae8c68"/><path d="M17 73l4-7h44l4 7" fill="#436559" stroke="#2d4a42"/></g>`:
        v===false?`<path d="M8 49l69-16 3 18-69 16z" fill="url(#ji-tomb)" stroke="#794e31"/><g transform="rotate(-13 43 51)">${text(43,56,"墓碑",14,"#533e2e","font-weight='750'")}</g>`:
        `${text(43,52,"空",16,"#e1d5bc")}`;
      const inner=`<rect x="1.8" y="3" width="86" height="101" rx="5" fill="#172524" opacity=".5"/>
        <rect width="86" height="100" rx="5" fill="#776f5e" stroke="${active?"#e8b062":"#444e48"}" stroke-width="${active?3:1.5}"/>
        <rect x="4" y="4" width="78" height="77" rx="4" fill="url(#ji-bay)" stroke="#272e2b"/>
        <path d="M8 9h69m-69 3h69" stroke="#1f2927" opacity=".53"/>
        ${inside}<path d="M5 82h76" stroke="#b4a183"/>
        ${text(43,95,"柜 "+i,13,"#fff0d1","font-weight='600'")}${marker}`;
      doors+=v?`<g class="ji-interact" transform="translate(${x} ${y})" data-op="locker-find" data-v="${safe(v)}" tabindex="0" role="button" aria-label="寻找采样 ${safe(v)}">${inner}</g>`:
        `<g transform="translate(${x} ${y})">${inner}</g>`;
    }
    const path=s.last?.path??[];
    const line=path.length?"探测柜号　"+path.join(" → "):"空柜 "+s.slots.filter(v=>v===null).length+"　／　墓碑 "+s.slots.filter(v=>v===false).length;
    return svg(540,H,"开放寻址采样柜",`<defs>
      <linearGradient id="ji-console" x2=".12" y2="1"><stop stop-color="#53605a"/><stop offset=".7" stop-color="#323e3a"/><stop offset="1" stop-color="#26322e"/></linearGradient>
      <linearGradient id="ji-bay" x2=".2" y2="1"><stop stop-color="#263431"/><stop offset=".37" stop-color="#394742"/><stop offset="1" stop-color="#48524a"/></linearGradient>
      <linearGradient id="ji-tape" x2="1" y2=".5"><stop stop-color="#8fa696"/><stop offset=".5" stop-color="#708d7f"/><stop offset="1" stop-color="#4e7066"/></linearGradient>
      <pattern id="ji-tomb" width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="#e8b77d"/><path d="M-3 3l6-6m-3 16L13 0m-3 16 6-6" stroke="#c29159" stroke-width="4"/></pattern></defs>
      <rect x="4" y="17" width="532" height="${H-25}" rx="11" fill="#59493a"/>
      <rect x="5" y="13" width="530" height="${H-28}" rx="9" fill="url(#ji-console)" stroke="#536052" stroke-width="1.6"/>
      <g stroke="#c29869" stroke-width="6"><path d="M12 22v${H-50}m516 0V22"/></g>
      <path d="M25 25h490m-490 ${H-83}h490" stroke="#a9a693" opacity=".54"/>
      ${doors}${text(270,H-25,line,15,"#ede8c5","font-weight='600'")}`);
  }
  book[9]={
    title:"地下录音室的采样柜",invite:"给采样起个短名，制造一次撞柜，再试着删除挡在前面的那一把键。",form:"开放寻址采样柜",
    related:["hash-probe","hash-tombstone"],initial:firstCabinet,
    act(s,op,v,f={}){
      const raw=f.sampleKey??s.keyText;
      if(op==="locker-find")return operate(s,"find",v);
      if(["put","find","remove"].includes(op))return operate(s,op,raw);
      if(op==="resize"){
        const m=Number(f.lockerSize),keys=s.slots.filter(k=>typeof k==="string");
        if(![5,7,9].includes(m))return s;
        if(keys.length>m)return {...s,keyText:String(raw),last:null,notice:"现有 "+keys.length+" 个采样放不进 "+m+" 个柜，未改动柜组。"};
        const slots=Array(m).fill(null);
        for(const key of keys)slots[probe(slots,key).room]=key;
        return {...s,slots,keyText:String(raw),last:null,notice:"按旧柜号顺序将 "+keys.length+" 个键重新散列进 "+m+" 个柜。旧墓碑已清空。"};
      }
      return s;
    },
    view(s){
      const m=s.slots.length,live=s.slots.filter(v=>typeof v==="string").length,dead=s.slots.filter(v=>v===false).length,L=s.last;
      return {scene:cabinetArt(s),controls:`<div class="ji-controls"><label>采样名<input name="sampleKey" maxlength="12" value="${safe(s.keyText)}" placeholder="如 A、鼓、O"></label>${button("put","存入")}${button("find","查找")}${button("remove","取出并留墓碑")}<label>柜数<select name="lockerSize">${[5,7,9].map(n=>`<option value="${n}" ${n===m?"selected":""}>${n}</option>`).join("")}</select></label>${button("resize","重排柜组")}</div>`,
        caption:s.notice,
        math:L?`h(${L.key}) = ${keySum(L.key)} mod ${m} = ${L.start}；本次实际探测 ${L.path.length} 格，活键 ${live}，墓碑 ${dead}。`:`h(key) = Unicode 码点和 mod ${m}；装填因子 α = ${live}/${m}，另有 ${dead} 个墓碑。`,
        cpp:'int probe(const std::u32string& key, bool inserting) {\n  int h = codePointSum(key) % M, tomb = -1;\n  for (int t=0; t<M; ++t) {\n    int i=(h+t)%M; const Slot& s=a[i];\n    if (s.live() && s.key==key) return i;\n    if (s.empty()) return inserting ? (tomb<0 ? i : tomb) : -1;\n    if (s.deleted() && tomb<0) tomb=i;\n  }\n  return inserting ? tomb : -1;\n}\n// 取出时先查找，再将命中的槽标为 deleted。',
        why:"线性探测依次检查 (h+t) mod M。空柜表示这条链不可能再找到该键，墓碑表示这里曾被占用，继续往后查。插入时先记最早墓碑，确认没有重名再复用。单次最坏探测 M 格，墓碑多时即使活键少也可能很慢。",
        challenge:"在 7 柜中存 A、H、O，取出 A，再找 O。能否造出一个活键只有 1 个、但查找仍需至少 3 次探测的柜组？"};
    }
  };
})();
