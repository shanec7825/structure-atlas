function scrub(value){
 stop();if(mode==='lab')step=value;else compareStep=value;
 const holder=document.createElement('div');sceneCounter=0;
 holder.innerHTML=mode==='lab'?quietLabView():compareView();
 const selectors=mode==='lab'?['.scene','.varbar','.readout','.quiet-code']:['.duet'];
 for(const selector of selectors){
  const old=$(selector),fresh=holder.querySelector(selector);
  const x=old.scrollLeft;old.replaceWith(fresh);fresh.scrollLeft=x;
 }
 const next=holder.querySelector('.transport');
 for(const selector of ['#prev','#play','#next','output'])$('.transport '+selector).replaceWith(next.querySelector(selector));
 const node=$('#nodeRead');if(node)node.hidden=true;
 const line=$('.cline.current');if(line){line.parentElement.scrollTop=Math.max(0,line.offsetTop-line.parentElement.clientHeight/2)}
}
