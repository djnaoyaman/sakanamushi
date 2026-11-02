const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch();
 const results = [];
 try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
   for (const [width,height] of [[320,900],[390,900],[844,390],[1280,900]]) {
    const page = await browser.newPage({viewport:{width,height},reducedMotion});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await page.goto('http://127.0.0.1:8765/index.html');
    await page.locator('#splashScreen').click();
    const control=page.locator('#soundToggle');
    await page.keyboard.press('Tab');
    assert.equal(await control.evaluate(e=>e===document.activeElement),true,'sound toggle reachable by Tab');
    assert.equal(await control.evaluate(e=>e===document.activeElement),true);
    assert.notEqual(await control.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    await control.press('Enter'); assert.equal(await control.textContent(),'BGM OFF');
    await control.press('Space'); assert.equal(await control.textContent(),'BGM ON');
    await control.click(); assert.equal(await control.textContent(),'BGM OFF');
    const box=await control.boundingBox();
    assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=width && box.y+box.height<=height);
    assert.ok(await control.evaluate(e=>{const b=e.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===e;}));
    // Inject representative nonzero safe-area values into the actual rules.
    const inset=await page.evaluate(()=>{
     const sheet=document.querySelector('style');const original=sheet.textContent;
     sheet.textContent=original.replace(/env\(safe-area-inset-bottom, 0px\)/g,'34px').replace(/env\(safe-area-inset-right, 0px\)/g,'44px');
     const c=getComputedStyle(document.getElementById('soundToggle'));
     const result=[parseFloat(c.bottom),parseFloat(c.right)];sheet.textContent=original;return result;
    });
    assert.deepEqual(inset,width<=520?[44,54]:[50,60]);
    await page.locator('#pickUo').click();
    for(let i=0;i<2;i++) {
     const before=await page.locator('#deckCounter').textContent();
     const reading=await page.evaluate(()=>currentItem().reading);
     await page.getByRole('button',{name:reading,exact:true}).click();
     assert.ok(await page.locator('#deckReveal').isVisible());
     await page.waitForFunction(old=>document.getElementById('deckCounter').textContent!==old,before,{timeout:20000});
    }
    const duration=await page.locator('#deckCard').evaluate(e=>getComputedStyle(e).transitionDuration);
    assert.equal(duration,reducedMotion==='reduce'?'0s':'0.35s, 0.35s');
    if(reducedMotion==='reduce') {
     const visual=await page.locator('#deckCard').evaluate(e=>{e.classList.add('slide-out');const s=getComputedStyle(e);const a=[s.transform,s.opacity];e.classList.remove('slide-out');return a;});
     assert.deepEqual(visual,['none','1']);
     assert.equal(await page.locator('#deckQuestion').textContent(),'これ、なんて読む？');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('deckCard')).opacity==='1' && document.getElementById('deckQuestion').textContent==='これ、なんて読む？');
    await page.screenshot({path:`test-artifacts/profile/launch-${reducedMotion}-${width}.png`,fullPage:true});
    await page.locator('#deckBack').click();await page.locator('#pickMushi').click();
    assert.equal(await page.locator('#deckChoices button').count(),4);
    // Leaving mid-reveal must not schedule a stale advance in another deck.
    const nextReading=await page.evaluate(()=>currentItem().reading);
    await page.getByRole('button',{name:nextReading,exact:true}).click();
    await page.locator('#deckBack').click();
    await page.locator('#pickTori').click();
    const stable=await page.locator('#deckCounter').textContent();
    await page.waitForTimeout(4500);
    assert.equal(await page.locator('#deckCounter').textContent(),stable);
    // Explicitly enter the outgoing transition, then navigate before it fires.
    await page.evaluate(()=>{clearAllTimers();scheduleAdvance(true);});
    if(reducedMotion==='no-preference') {
     await page.waitForFunction(()=>document.getElementById('deckCard').classList.contains('slide-out'));
     await page.locator('#deckBack').click();await page.locator('#pickShokubutsu').click();
     const counter=await page.locator('#deckCounter').textContent();
     await page.waitForTimeout(500);
     assert.equal(await page.locator('#deckCounter').textContent(),counter);
     assert.equal(await page.locator('#deckCard').evaluate(e=>e.classList.contains('slide-out')),false);
    }
    assert.deepEqual(errors,[]); results.push({width,height,reducedMotion,inset,errors}); await page.close();
   }
  }
 } finally {fs.writeFileSync('test-artifacts/profile/launch-results.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
