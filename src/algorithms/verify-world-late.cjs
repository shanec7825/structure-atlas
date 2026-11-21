'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const load=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const w=vm.runInNewContext(load('world-late.js')+';WORLD_LATE'),plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(Object.keys(w),['9','10','11','12']);
const result=(n,v)=>plain(w[n].experiment(v));
for(const spec of Object.values(w)){
  assert.equal(spec.choices.length,2);
  for(const v of [0,1]){
    const experiment=plain(spec.experiment(v));
    for(const k of ['observation','mechanism','limit'])assert(experiment[k]);
    assert(experiment.rows.length>=2);
    assert(experiment.rows.every(x=>typeof x.label==='string'&&typeof x.value==='string'&&x.value.length));
    spec.experiment(1-v);assert.deepEqual(plain(spec.experiment(v)),experiment);
  }
  assert.notDeepEqual(plain(spec.experiment(0)).rows,plain(spec.experiment(1)).rows);
}
const values=(n,v)=>result(n,v).rows.map(x=>x.value);
assert.deepEqual(values(9,0),['20 号 / 1 格','6 → 0 → 1','命中 1 格']);
assert.deepEqual(values(9,1),['20 号 / 1 格','6 → 0','查无此箱']);
assert.deepEqual(values(10,0),['1.9 秒','抢修 › 返听 › 和声','0.1 秒']);
assert.deepEqual(values(10,1),['2.1 秒','返听 › 抢修 › 和声','1.9 秒']);
assert.deepEqual(values(11,0),['1、3、5 拍','3 句','1 拍']);
assert.deepEqual(values(11,1),['1、5 拍','2 句','0 拍']);
assert.deepEqual(values(12,0),['7 种','10 次','2 层']);
assert.deepEqual(values(12,1),['1 种','21 次','6 层']);
for(const [variant,expected] of [[0,[6,4]],[1,[6,5,4,3,2,1]]]){
  const {rows,plot}=result(12,variant);
  assert.deepEqual(plot,{type:'partitions',byDepth:expected,max:6});
  assert.equal(plot.byDepth.reduce((sum,n)=>sum+n,0),parseInt(rows.find(r=>r.label==='键比较').value,10));
}
const scope={JOURNEY:{},esc:x=>String(x)};
vm.runInNewContext(load('journey-finale.js'),scope);
const r=scope.JOURNEY[11],drums=r.initial({voices:[0,1,2],personal:true});
assert.match(r.view(drums).scene,/data-voice="0"/);
assert.match(r.view(drums).scene,/data-voice="1"/);
assert.match(r.view(drums).scene,/data-voice="2"/);
const later=r.act(drums,'next','',{});assert.match(r.view(later).scene,/本次比对第 1 格/);
const s=scope.JOURNEY[12],test=s.act(s.initial(),'run','quick',{values:'0 4 8',rank:2});
assert.match(s.view(test).scene,/--width:0%/);assert.match(s.view(test).scene,/--width:50%/);
assert.match(s.view(test).controls,/<legend>排好所有记录<\/legend>/);
assert.match(s.view(test).controls,/<legend>只查一个位置<\/legend>/);
console.log('PASS all 8 counterfactual readings, repeatability after switching, synchronized sound notation, accurate zero/half scale and sorting control groups.');
