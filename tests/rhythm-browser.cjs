async function run(){
 const {chromium}=require('playwright');
 const path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
 const app=pathToFileURL(path.resolve('index.html')).href;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true});
 try{
 const p=await browser.newPage({viewport:{width:1400,height:860}});p.setDefaultTimeout(4000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const click=s=>p.locator(s).first().click(),txt=s=>p.locator(s).first().innerText();
 const open=async hash=>{await p.goto(app+'#'+hash);await p.waitForFunction(hash=>document.body.dataset.page===hash.split('/')[0],hash)};
 await open('method');assert.equal(await p.locator('[data-drum]').count(),3);assert(!(await p.locator('#catalog').count()));await p.screenshot({path:'artifacts/rhythm-desktop.png'});
 await click('#demo-take');await p.waitForTimeout(360);await click('#start-loop');assert.equal(await p.locator('[data-route-id]').count(),6);await click('#open-connections');await click('[data-beat-select="1"]');await p.locator('#beat-after').selectOption('5');await click('.gl-detail summary');assert((await txt('.gl-example:visible')).includes('P1 → P3 → P4 → P5 → P6 → P2'));await click('#apply-splice');
 const getOrder=()=>p.locator('[data-route-id]').evaluateAll(els=>els.map(e=>Number(e.dataset.routeId)));assert.deepEqual(await getOrder(),[0,2,3,4,5,1]);await click('#undo-splice');assert.deepEqual(await getOrder(),[0,1,2,3,4,5]);
 await click('#begin-take');await p.keyboard.press('1');await p.waitForTimeout(220);await p.keyboard.press('3');await p.waitForTimeout(125);await click('[data-drum="1"]');await p.waitForTimeout(150);await click('#finish-take');const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('structure-atlas-progress-v1')).beatChain);
 assert.deepEqual(saved.nodes.map(n=>n.voice),[0,2,1]);assert(saved.nodes[0].gap>=175&&saved.nodes[1].gap>=90);await click('#open-connections');await click('[data-beat-select="2"]');await p.locator('#beat-after').selectOption('-1');await click('#apply-splice');assert.deepEqual(await getOrder(),[2,0,1]);await p.reload();assert.deepEqual(await getOrder(),[2,0,1]);await click('#audio-toggle');assert.equal(await p.locator('#audio-toggle').getAttribute('aria-pressed'),'false');await click('#start-loop');await p.waitForTimeout(60);const played=await p.locator('[data-route-id].now').getAttribute('data-route-id');assert.equal(played,'2');
 await click('[data-mode="shelf"]');await p.locator('#find').fill('AVL');assert.equal(await p.locator('.spines button').count(),1);await click('.spines button');await click('#next');await click('.quiet-inspect summary');await click('.quiet-replay summary');await p.locator('#timeline').fill(await p.locator('#timeline').getAttribute('max'));assert(await p.locator('#next').isDisabled());assert(await p.locator('.quiet-inspect').evaluate(el=>el.open));
 const ids=await p.evaluate(()=>ATLAS.map(l=>l.id));for(const id of ids){await p.evaluate(v=>{location.hash='lab/'+v},id);await p.waitForFunction(v=>document.querySelector('.quiet-lab')?.dataset.lessonId===v,id);assert(!(await p.locator('.quiet-inspect').evaluate(el=>el.open))||id==='avl-rotate');await click('#next')}
 await open('compare');await p.locator('#pair').selectOption('3');await p.locator('#arr').fill('1, 2, 2, 4');await p.locator('#key').fill('2');await click('#arrayForm button');await p.locator('#timeline').fill(await p.locator('#timeline').getAttribute('max'));assert.equal(await p.locator('.duet .var-chip').filter({hasText:'结果 1'}).count(),2);
 await open('sandbox');await click('#assign');await p.locator('#lhs').selectOption('p->next');await p.locator('#rhs').selectOption('n');await click('#assign');assert((await txt('.progress-note')).includes('完成'));
 await open('paper');await click('[data-micro-answer="1"]');await click('[data-micro-move="1"]');assert((await txt('.mini-lesson')).includes('2 / 5'));
 await open('exam');await p.locator('#draft').fill('我的推理');await click('#reveal');await p.locator('[data-point="0"]').check();await p.reload();assert.equal(await p.locator('#draft').inputValue(),'我的推理');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(app);await mobile.locator('#begin-take').waitFor();await mobile.screenshot({path:'artifacts/rhythm-mobile.png'});await mobile.locator('#begin-take').tap();for(const v of [1,0,2])await mobile.locator(`[data-drum="${v}"]`).tap();await mobile.locator('#finish-take').tap();assert.equal(await mobile.locator('[data-route-id]').count(),3);await mobile.locator('#open-connections').tap();assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.screenshot({path:'artifacts/rhythm-edit.png'});await mobile.setViewportSize({width:320,height:695});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS keyboard/touch recording, nonuniform user timing, demo rewiring, undo, live order, local persistence, silence, '+ids.length+' quiet labs, code/replay, 4 study modes, 390/320px reduced motion, zero page errors');

 const check=await browser.newPage();check.on('pageerror',e=>errors.push(e.message));
 await check.addInitScript(()=>{const key='structure-atlas-progress-v1';localStorage.setItem(key,JSON.stringify({beatOriginal:{head:0,nodes:[null]}}));Object.defineProperty(Storage.prototype,'setItem',{value(){throw Error('quota')}})});
 await check.goto(app);await check.locator('#begin-take').click();
 const p0=check.locator('[data-drum="0"]'),box=await p0.boundingBox();
 await check.mouse.move(box.x+box.width*.5,box.y+box.height*.45);await check.mouse.down();
 assert((await check.locator('#beat-live').innerText()).includes('第 1 击'));await check.waitForTimeout(100);await check.mouse.up();assert.equal(await check.locator('#live-tape i').count(),1);
 await check.keyboard.press('2');await check.keyboard.press('3');await check.locator('#finish-take').click();assert((await check.locator('.take-sheet').innerText()).includes('未能保存'));await check.locator('#open-connections').click();await check.locator('[data-beat-select="2"]').click();await check.locator('#beat-after').selectOption('-1');await check.locator('#apply-splice').click();await check.locator('#start-loop').click();assert((await check.locator('#beat-live').innerText()).includes('第 1 拍 · P3'));await check.close();assert.deepEqual(errors,[]);

 console.log("PASS press onset, no release duplication, corrupt storage, save failure and reordered beat index");
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1})
