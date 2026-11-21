const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const url=pathToFileURL(path.resolve('index.html')).href;
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
  const c=await browser.newContext({offline:true,viewport:{width:1280,height:820}});
  const p=await c.newPage(),errors=[],remote=[];
  p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
  await p.goto(url);await p.getByRole('link',{name:'全书目录',exact:true}).click();
  const chapters=p.locator('.directory-chapter'),input=p.locator('#contents-search');
  assert.equal(await chapters.count(),12);
  const refs=await p.locator('.directory-links [href^="#read/"]').evaluateAll(a=>a.map(x=>x.hash.slice(1)));
  assert.equal(new Set(refs).size,64);
  for(const [word,ref] of [['红黑树','8.3'],['B 树','8.2'],['KMP','11.3'],['BM','11.4'],['Karp-Rabin','11.5']]){
   await input.fill(word);assert(await p.locator('.directory-links [href="#read/'+ref+'"]').isVisible());
  }
  await input.fill('zzzzzzzz');assert.equal(await chapters.count(),0);await input.fill('');
  await chapters.first().locator('summary').click();await p.locator('.directory-links [href="#read/1.1"]').click();
  let demos=0;const go=async ref=>{
   await p.evaluate(ref=>{location.hash=ref},ref);
   await p.waitForFunction(ref=>document.querySelector('.section-reader')?.dataset.sectionId===ref.slice(5),ref);
  };
  for(const ref of refs){
   await go(ref);assert(await p.locator('.worked li').count()>=3);assert((await p.locator('.reader-practice > p').innerText()).trim());
   const solution=p.locator('.reader-practice > details').first();await solution.locator('summary').first().click();assert(await solution.locator('p').first().isVisible());
   if(await p.locator('#reader-demo').count()){
    demos++;await p.locator('#reader-preset').selectOption('1');const before=await p.locator('.demo-state').innerText();
    if(!await p.locator('[data-demo-shift="1"]').isDisabled()){
     await p.locator('[data-demo-shift="1"]').click();assert.notEqual(await p.locator('.demo-state').innerText(),before);
    }
   }
  }
  assert(demos>=12);
  await go('read/1.1');
  await p.locator('#reader-input').fill('111,66');await p.locator('#reader-input-form button').click();
  await p.locator('[data-demo-shift="1"]').click();const progress=await p.locator('.reader-actions output').innerText();
  await p.locator('#reader-input').fill('9,6');const step=await p.locator('.demo-state').innerText();
  await p.locator('.reader-related a').first().click();await p.locator('.quiet-lab').waitFor();await p.locator('#content > a[href="#read/1.1"]').click();
  assert.equal(await p.locator('#reader-input').inputValue(),'9,6');assert.equal(await p.locator('.reader-actions output').innerText(),progress);assert.equal(await p.locator('.demo-state').innerText(),step);
  await p.locator('.skip').focus();await p.keyboard.press('Enter');assert.equal(new URL(p.url()).hash,'#read/1.1');assert.equal(await p.evaluate(()=>document.activeElement.id),'main');
  await p.setViewportSize({width:320,height:740});
  for(const ref of ['read/6.9','read/7.4','read/8.2','read/11.4','read/12.2']){
   await go(ref);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),ref);
  }
  for(const [ref,raw] of [['read/7.4',' / 0'],['read/8.2','20 | ,10 | 30 | 0']]){
   await go(ref);await p.locator('#reader-input').fill(raw);await p.locator('#reader-input-form button').click();assert.equal(await p.locator('.reader-actions output').innerText(),'1 / 1');
  }
  await p.evaluate(()=>{location.hash='read/99.99'});await input.waitFor();assert.equal(new URL(p.url()).hash,'#contents');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);console.log('PASS all 64 reader routes, '+demos+' executable demonstrations, bilingual topic lookup, custom-input recovery, skip link, offline loading and phone layouts');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
