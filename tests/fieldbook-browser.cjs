const {chromium}=require('playwright');
const path=require('node:path'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
const url=pathToFileURL(path.resolve('index.html')).href;
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined});
 try{
  const errors=[],downloads=[],a=await browser.newContext({offline:true,viewport:{width:1360,height:860}});
  const page=await a.newPage();page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))downloads.push(r.url())});
  await page.goto(url);const img=await page.locator('.photo-bench').evaluate(async b=>{const pic=new Image();pic.src=getComputedStyle(b).backgroundImage.slice(5,-2);await pic.decode();return [pic.naturalWidth,pic.naturalHeight]});assert.deepEqual(img,[1536,1024]);
  await page.screenshot({path:'artifacts/art-studio.png',fullPage:true});
  await page.locator('#begin-take').click();for(const [i,f] of [[0,.18],[1,.51],[2,.82]]){
   const surface=await page.locator('.photo-bench').boundingBox();await page.mouse.click(surface.x+surface.width*f,surface.y+surface.height*.48);
   assert((await page.locator('#beat-live').innerText()).includes(['底鼓','军鼓','踩镲'][i]));await page.waitForTimeout(90);
  }
  await page.locator('#finish-take').click();assert.equal(await page.locator('.take-meter i').count(),3);
  await page.locator('[data-mode=journey]').click();
  const expected=[[],['30','15'],['0x108','0x248'],[],[],['32','128'],['2','3'],[],[],['6 → 0 → 1','6 → 0'],['0.1','1.9'],['3','2'],['10','21']];
  const values=()=>page.locator('.world-values').innerText(),jump=n=>page.locator('#chapter-choice').selectOption(String(n));
  for(let n=1;n<=12;n++){
   await jump(n);const buttons=page.locator('.world-switch button');assert.equal(await buttons.count(),2);
   await buttons.nth(0).click();const before=await values();await page.locator('.world-proof summary').click();await buttons.nth(1).focus();await page.keyboard.press('Space');const after=await values();
   assert.notEqual(before,after,n);assert.equal(await buttons.nth(1).getAttribute('aria-pressed'),'true');assert(await page.locator('.world-proof').evaluate(x=>x.open));assert(await page.locator('.world-proof p').count()===2);
   if(expected[n].length){assert(before.includes(expected[n][0]),n+' '+before);assert(after.includes(expected[n][1]),n+' '+after)}
   if(n===6||n===9)await page.screenshot({path:'artifacts/art-chapter-'+n+'.png',fullPage:true});
   await buttons.first().click();assert.equal(await values(),before);
  }
  await jump(3);await page.locator('[data-world-choice="1"]').click();assert.equal(await page.locator('.address-plot .held').count(),2);
  await page.locator('.world-proof summary').click();await page.locator('#begin-take').click();assert(await page.locator('.world-proof').evaluate(x=>x.open));await page.keyboard.press('1');await page.locator('#finish-take').click();
  assert((await page.locator('.toy-prompt').innerText()).includes('这一击'));assert(await page.locator('#open-connections').isHidden());assert(await page.locator('.world-proof').evaluate(x=>x.open));
  await page.locator('#start-loop').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden});
  assert(await page.locator('.world-proof').evaluate(x=>x.open));assert.equal(await page.locator('#start-loop').innerText(),'循环播放');
  await jump(5);await page.locator('[data-world-choice="1"]').click();assert((await page.locator('.bits-plot').innerText()).includes('120 bit'));
  await jump(6);await page.locator('.world-switch button').nth(1).click();await page.locator('[data-op=pass]').click();assert.equal(await page.locator('[data-world-choice="1"]').getAttribute('aria-pressed'),'true');
  assert((await page.locator('.pitch-plot').getAttribute('aria-label')).includes('A、C、E、D'));
  await jump(12);await page.locator('[data-world-choice="1"]').click();assert.equal(await page.locator('.depth-dots i').count(),21);
  for(const width of [390,320]){await page.setViewportSize({width,height:840});for(let n=1;n<=12;n++){
   await jump(n);await page.locator('[data-world-choice="1"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+n);
   if(width===390&&n===6)await page.screenshot({path:'artifacts/art-phone.png',fullPage:true});
  }}
  assert.equal(downloads.length,0);assert.deepEqual(errors,[]);
  console.log('PASS offline photograph decode and 3 instrument hit zones; all 24 controlled-world conditions; reversibility, keyboard/reading state, numerical oracles, 390/320px without document overflow, no external network requests.');
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
