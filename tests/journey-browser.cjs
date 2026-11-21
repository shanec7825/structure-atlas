const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const url=pathToFileURL(path.resolve('index.html')).href;
async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1360,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(4500);
  const loc=s=>p.locator(s).first(),click=s=>loc(s).click();
  const op=(k,v)=>click('[data-op="'+k+'"]'+(v===undefined?'':'[data-v="'+v+'"]'));
  const chapter=async n=>{await p.locator('#chapter-choice').selectOption(String(n));await p.waitForFunction(n=>location.hash==='#journey/'+n,n)};
  const ctx=n=>p.evaluate(n=>JSON.parse(localStorage.getItem('structure-atlas-workshop-v1/'+n)),n);
  const math=()=>loc('.journey-math').textContent(),caption=()=>loc('.station-caption').innerText();
  await p.goto(url+'#journey/4');await loc('#chapter-choice').waitFor();
  for(let n=1;n<=12;n++){
   await p.locator('#chapter-choice').selectOption(String(n));
   assert((await loc('.journey-view h1').innerText()).trim());
   await click('[data-journey-fold="reason"] > summary');
   assert((await loc('.reason-grid code').innerText()).length>20,n);
   await click('[data-journey-fold="transfer"] > summary');await click('.paper-test details > summary');
   assert((await loc('.paper-test details p').innerText()).length>28,n);
   await click('[data-journey-fold="further"] > summary');assert((await p.locator('.related-list [data-lesson]').count())>0,n);
  }
  await chapter(1);await op('count','1');assert((await caption()).includes('15 场'));await op('rule','relay');assert((await caption()).includes('5 场'));
  await chapter(2);await loc('[name="kind"]').selectOption({label:'走路'});await loc('[name="seconds"]').fill('77');
  await op('cut',1);assert.equal(await loc('[name="seconds"]').inputValue(),'77');await op('insert');assert((await caption()).includes('77 秒走路'));assert((await math()).includes('复制 4'));
  await chapter(4);const c2=loc('[data-op="hold"][data-v="17"]');await c2.focus();await p.keyboard.press('Enter');await op('hold','13');await op('hold','7');await op('compare');
  assert((await caption()).includes('C4')&&(await caption()).includes('C2'));await p.reload();assert((await caption()).includes('C4'));
  await p.screenshot({path:'artifacts/workshop-climb.png',fullPage:true});
  await chapter(5);await loc('[name="score"]').fill('低高低低');await op('score');await loc('[name="score"]').fill('鼓鼓镲');await p.reload();assert.equal(await loc('[name="score"]').inputValue(),'鼓鼓镲');await chapter(3);
  await click('#begin-take');for(const k of ['1','2','3','2']){await p.keyboard.press(k);await p.waitForTimeout(90)}await click('#finish-take');
  const take=await p.evaluate(()=>JSON.parse(localStorage.getItem('structure-atlas-progress-v1')).beatChain.nodes);
  assert.deepEqual(take.map(x=>x.voice),[0,1,2,1]);
  await chapter(5);assert.equal(await loc('[name="score"]').inputValue(),'鼓鼓镲');await op('recording');assert.equal(await loc('[name="score"]').inputValue(),'咚啪嚓啪');await p.reload();assert.equal(await loc('[name="score"]').inputValue(),'咚啪嚓啪');
  await chapter(6);await op('player',0);await op('player',5);await op('pass');assert((await math()).includes('最少 1 次'));
  await click('[data-journey-fold="further"] > summary');await click('[data-lesson="articulation-cut"]');await click('#next');await click('[data-chapter="6"]');assert((await math()).includes('最少 1 次'));
  await chapter(7);await loc('[name="teamOrder"]').fill('10 20 30 40 50');await op('order');await op('enter-all');await loc('[name="teamQuery"]').fill('50');await op('query');assert((await caption()).includes('10')&&(await caption()).includes('AVL'));
  await chapter(8);await op('box');await op('spot','1,1');await op('spot','3,2');assert((await math()).includes('[1,3] × [1,2]'));
  await chapter(9);await loc('[name="sampleKey"]').fill('O');await op('put');await op('find');assert((await caption()).includes('O'));
  await chapter(10);await loc('[name="request"]').fill('我的返听');await loc('[name="urgency"]').fill('9');await op('add');await op('end');assert((await loc('.station-scene').innerText()).includes('我的返听'));await op('pop');await op('end');
  await chapter(11);await op('record');assert.equal((await loc('[name="source"]').inputValue()).replaceAll(' ',''),'咚啪嚓啪');await loc('[name="motif"]').fill('啪嚓');await op('search');await op('end');assert.equal(await loc('[data-audition]').getAttribute('data-audition'),'1,2');
  await loc('[name="source"]').fill('哒哒哒');await loc('[name="motif"]').fill('哒哒');await op('search');await op('end');assert.equal(await loc('[data-audition]').getAttribute('data-audition'),'1,1');await click('[data-audition]');assert((await loc('#journey-audio-status').innerText()).includes('试听'));
  await chapter(12);await click('.fin-extra > summary');await op('beats');assert(await loc('.fin-extra').evaluate(el=>el.open));assert.equal(await p.evaluate(()=>document.activeElement.dataset.op),'beats');
  const gaps=take.map(x=>Math.round(x.gap));assert.deepEqual((await loc('[name="values"]').inputValue()).split(' ').map(Number),gaps);
  await op('median');await op('end');assert((await caption()).includes(String(gaps.toSorted((a,b)=>a-b)[1])));assert.equal(await p.locator('.fin-extra table tbody tr').count(),3);
  await p.screenshot({path:'artifacts/workshop-finale.png',fullPage:true});assert((await ctx(12)).steps.length>=3);
  await click('[data-mode="exam"]');await loc('#draft').waitFor();await click('[data-mode="journey"]');assert.equal(await loc('#chapter-choice').inputValue(),'12');
  for(const width of [390,320]){
   const phone=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url+'#journey/4');
   for(let n=1;n<=12;n++){await phone.locator('#chapter-choice').selectOption(String(n));assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' / '+n)}
   await phone.locator('#chapter-choice').selectOption('4');await phone.locator('[data-op="hold"][data-v="17"]').tap();await phone.locator('[data-op="compare"]').tap();assert((await phone.locator('.station-caption').innerText()).includes('C2'));if(width===390)await phone.screenshot({path:'artifacts/workshop-phone.png',fullPage:true});await phone.close();
  }
  const broken=await browser.newPage();broken.on('pageerror',e=>errors.push(e.message));
  await broken.addInitScript(()=>{localStorage.setItem('structure-atlas-workshop-v1/4','{"steps":[]}');Object.defineProperty(Storage.prototype,'setItem',{value(){throw Error('unavailable')}})});
  await broken.goto(url+'#journey/4');await broken.locator('[data-op="hold"][data-v="17"]').click();assert((await broken.locator('.station-caption').innerText()).includes('当前页面'));
  assert.deepEqual(errors,[]);console.log('PASS all 12 chapter routes and exercises, deep lab and return, chapter recall, custom score drafts and real recording through chapters 5 / 11 / 12, operator persistence, sort disclosure/focus, 390px and 320px no horizontal document overflow, touch and keyboard, damaged storage and save failure.');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
