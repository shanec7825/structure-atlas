const A=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const scope=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,"sections-middle.js"),"utf8"),scope);
const lessons=vm.runInContext("SECTIONS_MIDDLE",scope),get=id=>lessons.find(s=>s.id===id);
const expectedIds=[[5,5],[6,12],[7,4],[8,4]].flatMap(([chapter,n])=>Array.from({length:n},(_,i)=>chapter+"."+(i+1)));
A.deepEqual(Array.from(lessons,s=>s.id),expectedIds);
const labs=new Set(),labFiles=["structures.js","supplement.js","../algorithms/algorithms.js","../algorithms/journey-depth.js","../pointer/deep.js"];
for(const name of labFiles) {
  const content=fs.readFileSync(path.join(__dirname,name),"utf8");
  for(const match of content.matchAll(/\bid\s*:\s*["']([\w-]+)["']/g))labs.add(match[1]);
}
for(const s of lessons){
  for(const key of ["title","premise","mechanism","check","answer"])A.ok(s[key].length>2);
  A.ok(s.trace.length>=3&&s.topics.length>0&&s.labs.every(id=>labs.has(id)));
  if(s.demo){A.ok(s.presets.length>=2);for(const p of s.presets)A.ok(s.demo(p.input).length>=3);}
}
A.match(get("5.1").demo("A:BCD;B:E;R:").at(-1),/A → B → E → C → D → R/);
A.match(get("5.1").demo("A:B;B:A")[0],/含环/);
A.match(get("5.1").demo("A:C;B:C")[0],/两次/);
function components(vertices,edges,skip){
  const seen=new Set();let n=0;
  for(const v of vertices)if(v!==skip&&!seen.has(v)){
    n++;const q=[v];seen.add(v);
    for(let i=0;i<q.length;i++)for(const e of edges)if(e.includes(q[i])){
      const to=e[0]===q[i]?e[1]:e[0];
      if(to!==skip&&!seen.has(to)){seen.add(to);q.push(to);}
    }
  }
  return n;
}
const possible=["AB","AC","AD","BC","BD","CD"];
for(let mask=1;mask<64;mask++){
  const edges=possible.filter((_,i)=>(mask>>i)&1),vertices=[...new Set(edges.join(""))];
  const count=components(vertices,edges),cuts=vertices.filter(v=>components(vertices,edges,v)>count).sort();
  const result=get("6.9").demo(edges.join(" ")).at(-1);
  const [,blocks,reported]=result.match(/^边块 (.+)。割点 (.+)。$/);
  A.deepEqual(blocks.split(" | ").flatMap(b=>b.split("/")).sort(),[...edges].sort());
  A.equal(reported,cuts.join("、")||"无");
}
A.match(get("6.9").demo("AB BC CA CD DE EF FD").at(-1),/AB\/AC\/BC \| CD \| DE\/DF\/EF。割点 C、D/);
function perms(items){return !items.length?[[]]:items.flatMap(k=>perms(items.filter(x=>x!==k)).map(t=>[k,...t]));}
for(const p of perms([1,2,3,4,5]))for(const remove of [1,2,3,4,5,6]){
  const result=get("7.4").demo(p.join(" ")+" / "+remove).at(-1);
  const [,shape,h]=result.match(/^结果 (.+)。高度 (\d+)。$/);
  const tokens=shape.match(/\d+|[∅(),]/g),keys=[];
  function parse(low,high){
    const t=tokens.shift();if(t==="∅")return 0;const k=+t;A.ok(low<k&&k<high);keys.push(k);
    if(tokens[0]!=="(")return 1;
    tokens.shift();const l=parse(low,k);A.equal(tokens.shift(),",");const r=parse(k,high);A.equal(tokens.shift(),")");
    A.ok(Math.abs(l-r)<=1);return 1+Math.max(l,r);
  }
  A.equal(parse(-Infinity,Infinity),+h);A.equal(tokens.length,0);
  A.deepEqual(keys.sort(),p.filter(k=>k!==remove).sort());
}
let btreeCases=0;
for(let a=1;a<=3;a++)for(let b=1;b<=3;b++){
  const l=[3,6,9].slice(0,a),r=[30,40,50].slice(0,b);
  for(const k of [...l,...r]){
    const result=get("8.2").demo("20 | "+l.join(" ")+" | "+r.join(" ")+" | "+k).at(-1);
    const actual=(result.match(/\d+/g)||[]).map(Number);A.deepEqual(actual,[...l,20,...r].filter(v=>v!==k));btreeCases++;
  }
}
for(const invalid of [" ,30 / 30"," / 0","5,,9 / 5","5,，9 / 9","1.0 2 / 2","0x10 / 16","1e1 / 10","0 4 / "]){
  A.equal(get("7.4").demo(invalid).length,1,"AVL should reject "+invalid);
}
for(const invalid of ["20 | ,10 | 30 | 0","20 | 3, | 30 | 3","20 | 1,,5 | 30 | 1","20 | 1.5 | 30 | 1","20 | 0xA | 30 | 10","20 | 0 | 30 | 0e0"]){
  A.equal(get("8.2").demo(invalid).length,1,"B-tree should reject "+invalid);
}
A.match(get("7.4").demo("0 / 0").at(-1),/结果 ∅。高度 0/);
A.match(get("7.4").demo("10, 0，20 / 0").at(-1),/结果 10\(∅,20\)/);
A.match(get("8.2").demo("20 | 0 | 30 | 0").at(-1),/根 \[20,30\]/);
console.log("PASS 25 sections, all lab IDs, all presets; forest errors; 63 graphs vs removal oracle; 720 AVL deletions incl misses; "+btreeCases+" B-tree leaf deletions; decimal parsing and literal zero.");
