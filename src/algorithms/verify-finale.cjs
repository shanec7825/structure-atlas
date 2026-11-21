'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const scope = {JOURNEY:{},esc:x=>String(x).replaceAll('<','&lt;').replaceAll('>','&gt;')};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'journey-finale.js'),'utf8'),scope);
const stations=scope.JOURNEY,clean=x=>JSON.parse(JSON.stringify(x));
for(const j of Object.values(stations)){
  const view=j.view(j.initial({voices:[0,1,2]}));
  for(const key of ['scene','controls','caption','cpp','math','why','challenge'])assert.equal(typeof view[key],'string');
}
const h=stations[10];
let q=h.initial(),fifo=clean(q.frames[0].a);
function verifyHeap(){
  const a=q.frames.at(-1).a;
  for(let i=1;i<a.length;i++){
    const p=a[(i-1)>>1],c=a[i];
    assert(p.p>c.p || p.p===c.p&&p.id<c.id);
  }
}
for(let i=0;i<12;i++){
  const n={name:'音轨'+i,p:(i*17)%6,id:i+3};
  q=h.act(q,'add','',{request:n.name,urgency:String(n.p)});
  q=h.act(q,'end','',{});fifo.push(n);verifyHeap();
}
assert(h.act(q,'add','',{request:'满了',urgency:'3'}).error);
fifo.sort((a,b)=>b.p-a.p||a.id-b.id);
for(const n of fifo){
  q=h.act(q,'pop','',{});assert.equal(q.history.at(-1),n.name);
  q=h.act(q,'end','',{});verifyHeap();
}
assert(h.act(q,'pop','',{}).error);assert(h.act(q,'add','',{request:'',urgency:'2'}).error);

const words=n=>Array.from({length:2**n},(_,v)=>Array.from({length:n},(_,i)=>(v>>i)&1).join(''));
const r=stations[11],base=r.initial({voices:[0,1,2],personal:true});
assert.equal(base.origin,'我的录音');let kmps=0;
assert.deepEqual(clean(base.text),['咚','啪','嚓']);
// Import a personal performance, then paste its motif from the Huffman workshop.
const recording={voices:[0,1,2,1],personal:true};
const recorded=r.act(base,'record','',{motif:'啪嚓'},recording);
assert.deepEqual(clean(recorded.text),['咚','啪','嚓','啪']);
assert.deepEqual(clean(recorded.frames.at(-1).matches),[1]);
const recordingResult=r.view(r.act(recorded,'end','',{}));
assert.match(recordingResult.scene,/data-audition="1,2"/);
const strict=r.act(recorded,'search','',{motif:'12'});
assert.deepEqual(clean(strict.frames.at(-1).matches),[]);
for(let l=0;l<6;l++)for(const source of words(l))for(let m=0;m<4;m++)for(const pattern of words(m)){
  const test=r.act(base,'search','',{source,motif:pattern});
  const expected=Array.from({length:source.length+1},(_,i)=>i).filter(i=>source.startsWith(pattern,i));
  assert.deepEqual(clean(test.frames.at(-1).matches),expected);
  for(const f of test.frames){assert(f.i>=0&&f.i<=source.length);assert(f.j>=0&&f.j<=pattern.length);}
  kmps++;
}
const attack=r.act(base,'search','',{source:'<x> <x>',motif:'<x> <x>'});
assert(!r.view(attack).scene.includes('<x>'));
function audition(source,motif) {
  const frame=r.act(base,'search','',{source,motif});
  return r.view(r.act(frame,'end','',{})).scene.match(/data-audition="([^"]+)"/)?.[1];
}
assert.equal(audition('哒嚓咚啪','哒嚓咚啪'),'1,2,0,1');
assert.equal(audition('0 1 2 底鼓 军鼓 踩镲','0 1 2 底鼓 军鼓 踩镲'),'0,1,2,0,1,2');
// A custom symbol occurring before a conventional one cannot claim its sound.
assert.equal(audition('踏 咚 转','踏 咚'),'1,0');
assert.equal(audition('踏 咚 转','转'),'2');
assert.equal(audition('左 右 左','右 左'),'1,0');
assert.equal(audition('左 右 蹲 跳','蹲 跳'),undefined);
assert.equal(audition('0 1 2 跳','跳'),undefined);
assert.equal(audition('0 1 2 跳','1 2'),'1,2');
assert.equal(audition('constructor 咚','constructor 咚'),'1,0');
const s=stations[12],initial=s.initial();
const samples=[[2],[4,4,4,4],[12,9,12,8,11,10],[5,4,3,2,1],[0.1,0,0.01],[0,1,2,3,4],[3,1,4,5,2,6,5]];
let sorts=0;
for(const values of samples)for(const rule of ['last','middle'])for(const mode of ['quick','select','shell'])for(let k=1;k<=values.length;k++){
  const test=s.act(initial,'run',mode,{values:values.join(' '),rank:k,pivot:rule},{});
  const f=test.frames.at(-1),sorted=[...values].sort((x,y)=>x-y);
  if(mode==='select')assert.equal(f.answer.v,sorted[k-1]);else assert.deepEqual(clean(f.a.map(x=>x.v)),sorted);
  let c=0,w=0;
  for(const step of test.frames){
    assert(step.comparisons>=c&&step.comparisons<=c+1);
    assert(step.swaps>=w&&step.swaps<=w+1);
    assert.equal(new Set(step.a.map(x=>x.id)).size,values.length);
    c=step.comparisons;w=step.swaps;
  }
  assert.deepEqual(clean(test.totals[mode]),[c,w]);sorts++;
}
const imported=s.act(initial,'beats','',{}, {gaps:[203,900,300],personal:true});
assert.equal(imported.unit,'毫秒');
assert(s.view(imported).why.includes('循环收尾'));
assert(!s.view(initial).why.includes('循环收尾'));
assert.equal(s.act(initial,'median','',{values:'1 8 2 3'},{}).frames.at(-1).answer.v,2);
assert(s.act(initial,'run','select',{values:'1 2',rank:3},{}).error);
assert(s.act(initial,'run','shell',{values:'1e2 3'},{}).error);
const equal=s.act(initial,'run','quick',{values:'3 3 3 3',pivot:'middle'},{});assert.equal(equal.frames.at(-1).comparisons,6);
console.log('PASS 15 ordered dispatches with stable ties, '+kmps+' KMP traces, '+sorts+' full sorting/selection traces, editable boundaries and personal import.');
