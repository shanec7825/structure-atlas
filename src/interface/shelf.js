
function shelfRows(){
 const keyword=search.trim().toLowerCase();
 const families=groups.map((g,idx)=>{
  const items=byGroup(g).filter(l=>!keyword||[g,l.title,l.subtitle,l.id,l.chapter].join(' ').toLowerCase().includes(keyword));
  if(!items.length)return '';
  return `<details class="shelf-family" ${keyword||openGroup===g?'open':''}><summary>${glyph(idx)}<span>${esc(g)}</span><small>${items.length} 个实验</small></summary><div class="spines">${items.map(l=>`<button data-lesson="${esc(l.id)}"><strong>${esc(l.title)}</strong><span>${esc(l.subtitle)}</span></button>`).join('')}</div></details>`;
 }).join('');
 return families||'<p class="empty">没找到这个词。可以试试“查找”“树”或“KMP”。</p>';
}
function shelfView(){
 return `<div class="shelf-view"><header class="intro"><h1>课程架</h1></header><label class="shelf-search">${playIcon('book',18)}<input id="find" type="search" aria-label="搜索实验" placeholder="搜索结构或算法" value="${esc(search)}"></label><div id="catalog">${shelfRows()}</div><nav class="other-doors" aria-label="练习与资料">${[['compare','双屏对照'],['sandbox','指针沙盒'],['exam','期末自测'],['paper','纸笔练习'],['book','教材与阅读指南']].map(([k,v])=>`<button data-mode="${k}">${v}</button>`).join('')}</nav></div>`;
}
