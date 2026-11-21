const assert = require("node:assert/strict");
globalThis.JOURNEY = {};
require("./journey-index.js");
const [team, court, cabinet] = [7,8,9].map(n => JOURNEY[n]);

function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap(x => permutations(values.filter(v=>v!==x)).map(rest=>[x,...rest]));
}
function plainHeight(root) {
  return root ? 1+Math.max(plainHeight(root.left),plainHeight(root.right)) : 0;
}
function plainInsert(root, key) {
  if (!root) return {key,left:null,right:null};
  const side=key<root.key?"left":"right";
  root[side]=plainInsert(root[side],key);
  return root;
}
function plainVisits(root,k) {
  let count=0;
  while(root){count++;if(k===root.key)break;root=k<root.key?root.left:root.right;}
  return count;
}
for(const permutation of permutations([1,2,3,4,5])){
  let st=team.act(team.initial({voices:[2]}),"order","",{teamOrder:permutation.join(" ")});
  let root=null;
  for(const k of permutation){
    root=plainInsert(root,k);st=team.act(st,"enter");
    const display=team.view(st);
    assert.match(display.math,new RegExp("BST 高 "+plainHeight(root)+"，AVL 高 [123]"));
    assert.equal((display.scene.match(/data-op="query-node"/g)||[]).length,2*st.entered);
  }
  for(const k of [1,2,3,4,5,6]){
    const display=team.view(team.act(st,"query-node",String(k)));
    const [,b,a]=display.math.match(/BST (\d+) 个，AVL (\d+) 个/);
    assert.equal(+b,plainVisits(root,k));
    assert.ok(+a>=1&&+a<=3);
    assert.ok(display.caption.includes(k===6?"未入场":"已找到"));
  }
}
for(const [seq,rot] of [["1 2 3","左旋"],["3 2 1","右旋"],["3 1 2","左旋，2 升起；3 右旋"],["1 3 2","右旋，2 升起；1 左旋"]]){
  const st=team.act(team.act(team.initial(),"order","",{teamOrder:seq}),"enter-all");
  assert.ok(team.view(st).math.includes(rot));
}
const bad=team.act(team.initial(),"order","",{teamOrder:'"><script>1</script>'});
assert.ok(!team.view(bad).controls.includes("<script>"));
assert.ok(bad.notice.includes("互异"));

for(const variant of [0,1,2]){
  let st=court.initial({voices:[variant]});
  if(variant===1) for(let x=1;x<=6;x++)for(let y=1;y<=4;y++){
    if(!st.points.some(p=>p[0]===x&&p[1]===y))st=court.act(st,"spot",x+","+y);
  }
  if(variant===2) for(const p of [...st.points])st=court.act(st,"spot",p.join(","));
  st=court.act(st,"box");
  for(let x1=1;x1<=6;x1++)for(let x2=x1;x2<=6;x2++)for(let y1=1;y1<=4;y1++)for(let y2=y1;y2<=4;y2++){
    const test=court.act(court.act(st,"spot",x2+","+y2),"spot",x1+","+y1),result=court.view(test);
    assert.deepEqual(test.q,[x1,x2,y1,y2]);
    const matches=[...result.scene.matchAll(/data-v="(\d,\d)" data-hit="true"/g)].map(m=>m[1]).sort();
    const coordinates=[...result.math.matchAll(/\((\d),(\d)\)/g)].map(m=>m[1]+","+m[2]).sort();
    const brute=test.points.filter(([x,y])=>x>=x1&&x<=x2&&y>=y1&&y<=y2).map(p=>p.join(",")).sort();
    assert.deepEqual(matches,brute);
    assert.deepEqual(coordinates,brute);
    const [,seen,skipped]=result.math.match(/逐点检测 (\d+)，剪去 (\d+)/);
    assert.equal(+seen + +skipped,test.points.length);
    assert.equal((result.scene.match(/data-op="spot"/g)||[]).length,24);
  }
}

let st=cabinet.initial(),expected=new Set(["A","H"]);
for(const key of ["O","V","鼓","二","中","H","哒"]){
  const fresh=cabinet.act(st,"put","",{sampleKey:key});
  if(expected.has(key)||expected.size<st.slots.length)expected.add(key);
  st=fresh;
  assert.deepEqual(new Set(st.slots.filter(k=>typeof k==="string")),expected);
}
for(const key of ["A","V","O"]) {st=cabinet.act(st,"remove","",{sampleKey:key});expected.delete(key);}
for(const m of [5,9,7]){
  st=cabinet.act(st,"resize","",{lockerSize:m});
  assert.equal(st.slots.length,m);assert.equal(st.slots.includes(false),false);
  for(const key of expected)assert.ok(cabinet.act(st,"find","",{sampleKey:key}).last.found>=0);
}
let tomb=cabinet.act(cabinet.initial(),"put","",{sampleKey:"O"});
tomb=cabinet.act(tomb,"remove","",{sampleKey:"A"});
assert.equal(tomb.slots[2],false);
assert.deepEqual(cabinet.act(tomb,"find","",{sampleKey:"O"}).last.path,[2,3,4]);
const same=cabinet.act(tomb,"put","",{sampleKey:"O"});
assert.deepEqual(same.slots,tomb.slots);
const reuse=cabinet.act(tomb,"put","",{sampleKey:"V"});
assert.equal(reuse.slots[2],"V");
const lastSlot=cabinet.act(cabinet.initial(),"put","",{sampleKey:"E"});
assert.deepEqual(cabinet.act(lastSlot,"put","",{sampleKey:"L"}).last.path,[6,0]);
const escaped=cabinet.view(cabinet.act(st,"put","",{sampleKey:'"><img onerror=x>'}));
assert.ok(!escaped.controls.includes("<img"));
console.log("PASS 120 BST/AVL insertion permutations, four rotations, 630 closed kd rectangles incl empty/full courts, hash collisions, tombstones, wrap/resize, escaping.");
