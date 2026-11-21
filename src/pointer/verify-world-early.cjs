'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const chapters = vm.runInNewContext(fs.readFileSync(path.join(__dirname,'world-early.js'),'utf8')+'\nWORLD_EARLY;');
assert.equal(Object.keys(chapters).length,4);
const result = {};
for(const [n,spec] of Object.entries(chapters)){
  assert.equal(spec.choices.length,2);
  result[n]=[0,1].map(v=>{
    const out=spec.experiment(v);
    assert.equal(JSON.stringify(out),JSON.stringify(spec.experiment(v)));
    assert(out.rows.length>=2 && out.rows.length<=4);
    for(const k of ['observation','mechanism','limit'])assert(out[k].length>5);
    return Object.fromEntries(out.rows.map(r=>[r.label,r.value]));
  });
  assert.notDeepEqual(result[n][0],result[n][1]);
}
assert.deepEqual(result[1].map(x=>x['最短赛程']),['6 轮 · 30 分钟','3 轮 · 15 分钟']);
assert.deepEqual(result[1].map(x=>x['总场数']),['6 场','6 场']);
assert.deepEqual(result[2].map(x=>x['追加结果']),Array(2).fill('跑 · 停 · 跳 · 蹲'));
assert.deepEqual(result[2].map(x=>x['迁移旧项']),['0 项','3 项']);
assert.deepEqual(result[2].map(x=>x['跳的位置']),['0x108 → 0x108','0x108 → 0x248']);
assert.deepEqual(result[3].map(x=>x['从目标能读到']),Array(2).fill('拍 → 嗒'));
assert.deepEqual(result[3].map(x=>x['入口复查']),['咚 → 嚓 → 拍 → 嗒','咚 → 嚓 → 嗒']);
for(const variant of [0,1]){
  const {plot}=chapters[3].experiment(variant);
  assert.equal(plot?.type,'addresses');
  const cells=Array.from(plot.cells);
  assert.deepEqual(cells.map(c=>c.id),['0x40','0xA0','0x180','0x210']);
  assert.deepEqual(cells.map(c=>c.sound),['拍','嚓','咚','嗒']);
  assert.deepEqual(cells.map(c=>c.next),['0x210',variant?'0x210':'0x40','0xA0','∅']);
  assert.deepEqual(cells.filter(c=>c.held).map(c=>c.id),variant?['0x40','0xA0']:['0x40']);
}
assert.deepEqual(result[4].map(x=>x['三次出场']),['红 → 蓝 → 绿','白 → 红 → 蓝']);
assert.deepEqual(result[4].map(x=>x['仍在等']),['白','绿']);
console.log('PASS — four independent two-condition simulations, repeatability, traces, budgets and address outcomes');
