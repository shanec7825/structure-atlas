'use strict';
const assert=require('node:assert/strict');
globalThis.ATLAS=[];require('./journey-depth.js');
const lookup=Object.fromEntries(ATLAS.map(l=>[l.id,l]));
for(const l of ATLAS){
  assert.equal(l.frames[0].line,-1);
  for(const f of l.frames){
    assert.ok(f.line>=-1&&f.line<l.code.length);
    const ids=new Set(f.nodes.map(n=>n.id));assert.equal(ids.size,f.nodes.length);
    for(const n of f.nodes){assert(n.x>=65&&n.x<=734);assert(n.y>=48&&n.y<=246);}
    for(const e of f.edges){assert(ids.has(e.from)&&ids.has(e.to));}
    assert(f.focus.every(id=>ids.has(id)));
  }
  assert(l.quiz.answer>=0&&l.quiz.answer<l.quiz.choices.length);
}
const left=lookup['leftist-meld'],root=left.frames.at(-1),children=new Map();
for(const e of root.edges){if(!children.has(e.from))children.set(e.from,{});children.get(e.from)[e.label]=e.to;}
const keys=Object.fromEntries(root.nodes.map(n=>[n.id,Number(n.value)]));
const ranks=Object.fromEntries(root.nodes.map(n=>[n.id,Number(n.detail.match(/\d+/)[0])]));
const visited=new Set();
function checkLeft(id){
 if(!id)return 0;
 assert(!visited.has(id));visited.add(id);
 const {L,R}=children.get(id)||{};const l=checkLeft(L),r=checkLeft(R);
 assert(l>=r);assert.equal(r+1,ranks[id]);for(const c of [L,R])if(c)assert(keys[id]<=keys[c]);
 return r+1;
}
assert.equal(checkLeft('A'),2);assert.equal(visited.size,5);
assert.deepEqual(children.get('A'),{L:'D',R:'B'});
const roll=lookup['rolling-match'],text='162323';
for(const f of roll.frames){
 const v=Object.fromEntries(f.vars);
 if(v.窗口指纹==='—')continue;
 const start=Number(v.哈希窗口.match(/\d+/)[0]);
 assert.equal(Number(v.窗口指纹),Number(text.slice(start,start+2))%7);
}
assert.equal(Object.fromEntries(roll.frames.at(-1).vars).已命中,'2、4');
assert.equal(roll.frames.filter(f=>f.title.includes('出现假阳性')).length,1);
const graph=lookup['articulation-cut'],end=graph.frames.at(-1);
const cuts=end.nodes.filter(n=>n.detail==='已判割点').map(n=>n.id);
const ids=end.nodes.map(n=>n.id),edges=end.edges;
function components(skip){
 const seen=new Set();let count=0;
 for(const u of ids){
  if(u===skip||seen.has(u))continue;
  count++;const q=[u];seen.add(u);
  while(q.length){
   const x=q.shift();
   for(const {from,to} of edges){const v=from===x?to:to===x?from:null;
    if(v&&v!==skip&&!seen.has(v)){seen.add(v);q.push(v);}}
  }
 }
 return count;
}
assert.deepEqual(cuts,ids.filter(id=>components(id)>components(null)));
assert.deepEqual(Object.fromEntries(end.nodes.map(n=>[n.id,n.value])),{A:'1 / 1',B:'2 / 2',C:'5 / 1',D:'3 / 2',E:'4 / 2',F:'6 / 1'});
console.log('PASS '+ATLAS.length+' advanced labs, '+ATLAS.reduce((acc,l)=>acc+l.frames.length,0)+' typed state frames; recursive heap ranks/order, every rolling hash, graph deletion oracle and DFS timestamps.');
