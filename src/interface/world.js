const worldCases=Object.assign({},WORLD_EARLY,WORLD_MIDDLE,WORLD_LATE);
const worldChoices=new Map();
const stationTitles=['','编一张对阵表','剪一条训练带','','攀岩路线','给鼓点编码','传球路线','两棵搜索树','球场落点','采样柜','音乐节调度台','找一段鼓点','终点线的名次'];
const stationPremises=['',
 '两位队员打完一场才记一次。试着多加一人，先猜要补几场。',
 '时间带里每段长短不同，内存里每条记录占一格。点一个剪口，插入新动作。',
 '',
 '队友沿你走过的岩点上攀，你从最后一处撤回。点亮圈内的岩点，编出两三步路线。',
 '一击鼓声对应一个符号。把两束声音接成一枝，看看哪种接法让整句用的比特最少。',
 '一条连线允许一次双向传球。点两件球衣接通或拆掉一条线，再试着把球传到终点。',
 '相同号码、相同入场次序。两边都按左小右大排，右边还会旋转失衡的子树。',
 '每次落球留下两个坐标。布好落点后，用两个角圈出要找的球。',
 '柜号由采样名算出。两个名字算到同一柜，就向后试一格。',
 '舞台每次处理一项请求。紧急的先处理，同样紧急的按到达次序处理。',
 '同一击可以是上一句的结尾，也是下一句的开头。写下想找的短句，再去整段里听。',
 '每条成绩带着运动员的身份。要找中位数，究竟需要确定多少人的名次？'
];
function pitchPlot(plot){
 const layout={A:[25,73],B:[148,25],C:[104,119],E:[215,119],D:[296,73]};
 const onRoute=new Set(plot.fast.slice(1).map((n,i)=>plot.fast[i]+n));
 const paths=plot.edges.map(([u,v,seconds])=>{
  const [x1,y1]=layout[u],[x2,y2]=layout[v],hot=onRoute.has(u+v);
  return `<g><path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${hot?'#1b5269':'#a3b4b8'}" stroke-width="${hot?4:2}" ${hot?'':'stroke-dasharray="4 3"'}/><text class="pitch-cost" x="${(x1+x2)/2}" y="${(y1+y2)/2-5}">${seconds} 秒</text></g>`;
 }).join('');
 const nodes=Object.entries(layout).map(([key,[x,y]])=>`<g transform="translate(${x} ${y})"><circle r="12" fill="${plot.fast.includes(key)?'#234b5d':'#f3f6f4'}" stroke="#577780"/><text y="4" fill="${plot.fast.includes(key)?'#fff':'#233e4a'}">${key}</text></g>`).join('');
 return `<svg class="pitch-plot" viewBox="0 0 324 142" role="img" aria-label="从左向右传给 D，实线为最快路线 ${esc(plot.fast.join('、'))}。"><g text-anchor="middle">${paths}${nodes}</g></svg>`;
}
function worldPlot(p){
 if(!p)return '';
 if(p.type==='pitch')return pitchPlot(p);
 if(p.type==='addresses'){
  const cells=p.cells.map(c=>`<tr class="${c.held?'held':''}"><th scope="row">${esc(c.id)}${c.held?' <span class="in-hand">手持</span>':''}</th><td>${esc(c.sound)}</td><td>${esc(c.next)}</td></tr>`).join('');
  return `<table class="address-plot"><caption>按内存地址排列</caption><thead><tr><th>地址</th><th>音</th><th>next</th></tr></thead><tbody>${cells}</tbody></table>`;
 }
 if(p.type==='bits'){
  const strip=(label,body,overhead)=>`<div class="measure-row"><span>${label}</span><div class="measure-track"><i style="width:${100*body/p.max}%"></i>${overhead?`<b style="width:${100*overhead/p.max}%"></b>`:''}</div><strong>${body+overhead} bit</strong></div>`;
  return `<div class="bits-plot" role="img" aria-label="等长编码 ${p.fixed} bit；变长正文 ${p.payload} bit，码表另占 ${p.header} bit。">${strip('等长',p.fixed,0)}${strip('变长',p.payload,p.header)}<p>蓝色为正文，斜纹为随附码表。</p></div>`;
 }
 if(p.type==='partitions'){
  return `<div class="depth-plot" aria-label="各划分层的键比较次数">${p.byDepth.map((count,i)=>`<div class="measure-row"><span>第 ${i+1} 层</span><div class="depth-dots" aria-hidden="true">${'<i></i>'.repeat(count)}</div><strong>${count} 次</strong></div>`).join('')}</div>`;
 }
 return '';
}
function experimentOutput(spec,choice){
 const result=spec.experiment(choice);
 return `${worldPlot(result.plot)}<dl class="world-values">${result.rows.map(item=>`<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('')}</dl><p class="world-observation">${esc(result.observation)}</p><details class="world-proof"><summary>为什么会这样</summary><p>${esc(result.mechanism)}</p><p><strong>适用边界</strong>　${esc(result.limit)}</p></details>`;
}
function worldPanel(n){
 const spec=worldCases[n],choice=worldChoices.get(n)||0;
 return `<section class="world-panel" data-world-chapter="${n}" aria-label="独立对照实验：${esc(spec.title)}"><div class="world-setup"><h2>${esc(spec.question)}</h2><p>${esc(spec.condition)}</p></div><div class="world-trial"><div class="world-switch" role="group" aria-label="改变实验条件">${spec.choices.map((label,i)=>`<button data-world-choice="${i}" type="button" aria-pressed="${i===choice}">${esc(label)}</button>`).join('')}</div><div class="world-readout" aria-live="polite" aria-atomic="true">${experimentOutput(spec,choice)}</div></div></section>`;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-world-choice]');if(!button)return;
 const panel=button.closest('[data-world-chapter]'),n=Number(panel.dataset.worldChapter),choice=Number(button.dataset.worldChoice);
 if(!worldCases[n]||![0,1].includes(choice))return;
 worldChoices.set(n,choice);
 panel.querySelectorAll('[data-world-choice]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
 const out=panel.querySelector('.world-readout'),wasOpen=out.querySelector('details').open;
 out.innerHTML=experimentOutput(worldCases[n],choice);
 out.querySelector('details').open=wasOpen;
});
