const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const context=vm.createContext({});
const file=path.join(__dirname,"world-middle.js");
vm.runInContext(fs.readFileSync(file,"utf8"),context);
const world=vm.runInContext("WORLD_MIDDLE",context);
const output=(chapter,alt)=>world[chapter].experiment(alt);
const values=(chapter,alt)=>Array.from(output(chapter,alt).rows,r=>r.value);
for(const id of [5,6,7,8]){
  assert.equal(world[id].choices.length,2);
  for(const variant of [0,1]){
    const v=output(id,variant);
    assert.equal(v.rows.length,3);
    assert.ok([v.observation,v.mechanism,v.limit].every(Boolean));
  }
}
assert.deepEqual(values(5,0),["32 bit","28 + 8 = 36 bit","多用 4 bit"]);
assert.deepEqual(values(5,1),["128 bit","112 + 8 = 120 bit","省下 8 bit"]);
assert.deepEqual(values(6,0),["1 秒","A → B → D · 2 传 / 2 秒","A → B → D · 2 传 / 2 秒"]);
assert.deepEqual(values(6,1),["5 秒","A → B → D · 2 传 / 6 秒","A → C → E → D · 3 传 / 3 秒"]);
for(const variant of [0,1]){
  const bits=output(5,variant).plot;
  assert.equal(bits.type,"bits");
  assert.equal(bits.fixed,variant?128:32);
  assert.equal(bits.payload,variant?112:28);
  assert.equal(bits.header,8);
  assert.equal(bits.max,Math.max(bits.fixed,bits.payload+bits.header));
  const {type,edges,fast}=output(6,variant).plot;
  assert.equal(type,"pitch");
  assert.equal(edges.length,5);
  edges.forEach(([from,to,sec])=>assert.equal(sec,variant&&from==="B"&&to==="D"?5:1));
  assert.deepEqual(Array.from(fast),variant?["A","C","E","D"]:["A","B","D"]);
  const elapsed=Array.from(fast).slice(1).reduce((sum,to,i)=>sum+edges.find(e=>e[0]===fast[i]&&e[1]===to)[2],0);
  assert.ok(values(6,variant)[2].endsWith(elapsed+" 秒"));
}
assert.deepEqual(values(7,0),["30 → 20 → 10 → 5（4 次）","30 → 40（2 次）","5、10、20、25、30、40"]);
assert.deepEqual(values(7,1),["20 → 10 → 5（3 次）","20 → 30 → 40（3 次）",values(7,0)[2]]);
for(const xmax of [3,4]){
  const pts=[[1,1],[2,3],[3,4],[4,1],[4,2],[6,3],[7,4]];
  const expected=pts.filter(([x])=>x<=xmax).map(p=>"("+p.join(",")+")").join(" ");
  const [actual,tested,skipped]=values(8,Number(xmax===4));
  assert.equal(actual,expected);
  assert.equal(parseInt(tested)+parseInt(skipped),7);
  assert.equal(parseInt(skipped),xmax===3?3:0);
}
console.log("PASS eight counterfactual outcomes: codebook break-even, shortest hops/time, AVL paths and preserved order, closed-boundary kd pruning.");
