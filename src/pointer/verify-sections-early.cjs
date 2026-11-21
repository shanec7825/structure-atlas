const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const rows = vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sections-early.js'),'utf8')+'\nSECTIONS_EARLY;');
const byId = new Map(rows.map(s=>[s.id,s]));
const expected = [5,8,5,6].flatMap((last,c)=>Array.from({length:last},(_,i)=>(c+1)+'.'+(i+1)));
assert.deepEqual(Array.from(byId.keys()),expected);
for(const s of rows){
  assert(s.trace.length>=3);assert(s.topics.length>=3);assert(s.labs.length);
  for(const k of ['title','premise','mechanism','check','answer'])assert(s[k].length>=6);
  for(const d of s.drills||[])assert(d.task&&d.answer&&d.title);
  if(s.demo)for(const p of s.presets){const v=s.demo(p.input);assert(v.length>=2);assert(v.every(x=>typeof x==='string'&&x.length));assert.equal(JSON.stringify(v),JSON.stringify(s.demo(p.input)));}
}
for(let c=1;c<=4;c++)assert(rows.some(s=>s.id.startsWith(c+'.')&&s.demo));
const demo=id=>byId.get(id).demo;
assert.match(demo('1.1')('65,39').at(-1),/13。$/);
assert.match(demo('1.1')('0,7').at(-1),/7。$/);
assert.equal(demo('1.1')('0,0').length,1);
const sorted=[-2,0,4,4,4,5,8,15,21];
for(let key=-3;key<=22;key++){
  const end=demo('2.6')(sorted.join(',')+' | '+key).at(-1),index=sorted.findLastIndex(x=>x<=key);
  if(index<0)assert.match(end,/−1/);else assert.equal(end,'答案秩 '+index+'，值 '+sorted[index]+'。');
}
assert.equal(demo('2.6')('2,1|1').length,1);
for(const a of [[9],[5,3,3,1],[-1,4,-5,0],[1,2,3],[4,1,3,2]]){
  const correct=a.slice().sort((x,y)=>x-y);
  assert.equal(demo('2.8')(a.join(',')).at(-1),'有序结果 '+correct.join('、')+'。');
  const stable=a.map((v,i)=>({v,id:String.fromCharCode(65+i)})).sort((x,y)=>x.v-y.v);
  assert.equal(demo('3.5')(a.join(',')).at(-1),'最终链 '+stable.map(e=>e.v+e.id).join(' → ')+'。');
}
const queen=demo('4.4');assert.match(queen('3').at(-1),/无解/);assert.match(queen(4).at(-1),/2、4、1、3/);
for(const n of [1,5,6]){
  const sol=queen(n).at(-1).match(/为 ([\d、]+)/)[1].split('、').map(Number);assert.equal(sol.length,n);assert.equal(new Set(sol).size,n);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)assert.notEqual(Math.abs(sol[j]-sol[i]),j-i);
}
console.log('PASS — all 24 sections; 5 pure demonstrations; 15 presets; independent checks for boundaries, duplicates, stable node identity and queen constraints.');
