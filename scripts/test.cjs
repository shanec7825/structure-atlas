const {spawnSync}=require('node:child_process');
const {readdirSync}=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['scripts/build.cjs'];
for(const area of ['pointer','structures','algorithms']){
 const dir=path.join(root,'src',area);
 for(const filename of readdirSync(dir).sort()){
  if(filename.endsWith('.cjs'))files.push(path.join('src',area,filename));
 }
}
for(const file of files){
 const r=spawnSync(process.execPath,[file],{cwd:root,stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0)process.exit(r.status??1);
}
