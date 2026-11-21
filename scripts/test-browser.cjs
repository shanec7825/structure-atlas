const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
for(const suite of ['rhythm-browser','journey-browser','fieldbook-browser','reader-browser']){
 const r=spawnSync(process.execPath,[path.join('tests',suite+'.cjs')],{cwd:root,stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0)process.exit(r.status??1);
}
