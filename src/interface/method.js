
let microIndex=0,microAnswer=null;
const micro=[
 {code:'int x = 12, y = 37;',before:[12,37,'—','—'],after:[12,37,'—','—'],ask:'纸上有两个整数。读 x 得到 12；如果读 &x，你拿到哪一个？',options:['12','0x100（x 的位置）','37'],key:1,read:'&x 读作“x 在哪里”。把地址写在格子边框外，把 12 写在格子里面。',focus:[]},
 {code:'int* p = &x; int* q = &y;',before:[12,37,'—','—'],after:[12,37,'0x100','0x200'],ask:'现在要给 p 赋初值。请预测 p 这个格子里面会写什么。',options:['x 的数据 12','p 自己的地址 0x300','x 的地址 0x100'],key:2,read:'p 也占一个格子。它自己的位置是 0x300，里面记录着 x 的地址 0x100。q 同理记下 y 的地址。',focus:[2,3]},
 {code:'p = q;',before:[12,37,'0x100','0x200'],after:[12,37,'0x200','0x200'],ask:'先读等号右边 q 里面的地址，再看左边。哪一格要擦掉重写？',options:['p 的格子','x 的格子','y 的格子'],key:0,read:'q 格子里是 0x200，把这个数抄到 p。x 仍然是 12，y 仍然是 37，但现在两根指针都能找到 y。',focus:[2]},
 {code:'*p = 9;',before:[12,37,'0x200','0x200'],after:[12,9,'0x200','0x200'],ask:'先用手指按住 p 里的地址，再去找对应门牌。这次 9 要写到哪里？',options:['p 的格子','y 的格子','x 的格子'],key:1,read:'*p 读作“去 p 记下的位置”。你的手指从 p 走到 0x200，把 y 的数据改为 9。p 和 q 继续保存原地址。',focus:[1]},
 {code:'p = &x;',before:[12,9,'0x200','0x200'],after:[12,9,'0x100','0x200'],ask:'最后把 p 挪回 x。执行之后，如果沿 q 去读取 *q，看到多少？',options:['12','37','9'],key:2,read:'p 改回 0x100，q 一直保存 0x200。沿 q 读到 y 上一步写入的 9。你已经分别做过“换地址”和“沿地址改值”。',focus:[2]}
];
function methodView(){
 const m=micro[microIndex],correct=microAnswer===m.key,seen=microAnswer!==null,vals=correct?m.after:m.before;
 const names=['x','y','p','q'],addr=['0x100','0x200','0x300','0x400'];
 const cards=vals.map((v,i)=>`<div class="memory-card ${correct&&m.focus.includes(i)?'write':''}"><small>${names[i]} 的位置 ${addr[i]}</small><strong>${esc(v)}</strong><small>${i<2?'存数据':v==='—'?'尚未建立':'存地址'}</small></div>`).join('');
 return titleBlock('先弄明白一个地址','准备一张纸和一支笔。把地址写在格子外，把值写在格子里。每次只擦掉真正被写入的那一格。')+
 `<div class="mini-lesson"><span class="tiny">纸笔同行　${microIndex+1} / ${micro.length}</span><h2><code>${esc(m.code)}</code></h2><div class="memory-sheet">${cards}</div><p>${esc(m.ask)}</p>${m.options.map((o,i)=>`<button data-micro-answer="${i}" class="choice ${i===microAnswer?(correct?'selected':'miss'):''}">${esc(o)}</button>`).join('')}${seen?`<div class="feedback ${correct?'':'miss'}">${esc(correct?m.read:['把 x 的内容和它的门牌分开看。','等号右侧的 &x 取出 x 的门牌。','左边写的是 p。用手指盖住等号右边，再看写入目标。','先读 p 里的门牌 0x200，再找门牌相同的变量。','顺着 q 的地址去看，不用经过 p。'][microIndex])}</div>`:''}<div class="ctrls">${btn('回看上一张',`data-micro-move="-1" ${microIndex===0?'disabled':''}`)}${microIndex<4?btn('翻到下一张',`data-micro-move="1" ${!correct?'disabled':''}`):correct?lessonLink(byId.get('list-walk'),'试着读一次 next'):''}</div><small>十六进制地址是为推演分配的示意值。短横线表示对象尚未声明。</small></div>
 <section class="section"><h2>同一个难点，换四种练法</h2><div class="methodgrid">${[
 ['用两张纸分开对象和指针','卡片正面写“12”，角上写地址，另一张小纸条只写地址。移动小纸条时，装着 12 的卡片留在桌上。这适合练“移动游标”。','list-walk'],
 ['把一行代码读成动作','读 p->next = n 时说：“找到 p 指着的结点，打开 next 格，把 n 保存的地址抄进去。”逐字指给自己看，再去验证箭头。','list-insert'],
 ['盯住一个反例','把新结点接入的两行交换。在第一次写入后停住，用手沿 head 走，看看旧后继还能从哪里找到。','list-insert-order'],
 ['隔天换数，闭卷重建','今天用 12、37，明天换成 4、8。先独立画出反转两结点的全过程，再打开三指针实验。能解释暂存后继的理由，就少背了一条公式。','list-reverse']
 ].map(([t,p,id])=>`<article class="study"><h3>${t}</h3><p>${p}</p><div class="ctrls">${lessonLink(byId.get(id),'用实验试一次')}</div></article>`).join('')}</div></section><article class="guide"><h2>今天不想再看链表，也有路可走</h2><p>从数组上的二分和排序入手，只跟踪下标。栈与队列也可以用数组实现。学树时先在纸上走出遍历次序，等形状和规则熟悉了，再看 C++ 如何连接结点。</p><div class="ctrls">${lessonLink(byId.get('binary-bound'))}${lessonLink(byId.get('sort-insertion'))}${lessonLink(byId.get('tree-inorder'))}</div></article>`;
}
document.addEventListener('click',ev=>{
 const t=ev.target.closest('button');if(!t)return;
 if(t.dataset.microAnswer!==undefined){microAnswer=Number(t.dataset.microAnswer);renderBody()}
 if(t.dataset.microMove!==undefined){microIndex=Math.max(0,Math.min(4,microIndex+Number(t.dataset.microMove)));microAnswer=null;renderBody()}
});
