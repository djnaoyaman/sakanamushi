const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const canonical='https://djnaoyaman.github.io/sakanamushi/';
(async()=>{
 const browser=await chromium.launch();const results=[];
 fs.mkdirSync('test-artifacts/profile',{recursive:true});
 try {
  for(const reducedMotion of ['no-preference','reduce']) for(const [width,height] of [[320,900],[390,900],[844,390],[1280,900]]) {
   const page=await browser.newPage({viewport:{width,height},reducedMotion});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.addInitScript(()=>{
    window.shareMock={shareMode:'success',copyMode:'success',shares:[],copies:[],resolve:null};
    const invoke=async(kind,value)=>{
     const m=window.shareMock;m[kind==='share'?'shares':'copies'].push(value);
     const mode=m[kind+'Mode'];
     if(mode==='cancel') throw new DOMException('Canceled','AbortError');
     if(mode==='reject') throw new DOMException('Rejected','NotAllowedError');
     if(mode==='pending') await new Promise(resolve=>{m.resolve=resolve;});
    };
    Object.defineProperty(navigator,'share',{configurable:true,get:()=>window.shareMock.shareMode==='unsupported'?undefined:value=>invoke('share',value)});
    Object.defineProperty(navigator,'clipboard',{configurable:true,get:()=>window.shareMock.copyMode==='unsupported'?undefined:{writeText:value=>invoke('copy',value)}});
   });
   await page.goto('http://127.0.0.1:8765/index.html?answer=private#history');
   assert.deepEqual(await page.evaluate(()=>[shareMock.shares,shareMock.copies]),[[],[]]);
   assert.equal(await page.locator('#shareSite').isVisible(),false);
   await page.locator('#splashScreen').click();
   const share=page.locator('#shareSite'),copy=page.locator('#copySiteLink'),status=page.locator('#shareStatus');
   const snapshot=()=>page.evaluate(()=>JSON.stringify({current,historyLog,audioEnabled,bgmPlaying,advanceTimer,countdownTimer,transitionTimer}));
   const initial=await snapshot();
   await share.focus();await share.press('Enter');
   await page.waitForFunction(()=>document.getElementById('shareSite').getAttribute('aria-disabled')==='false');
   assert.equal(await share.evaluate(e=>e===document.activeElement),true);
   assert.deepEqual(await page.evaluate(()=>shareMock.shares),[{url:canonical}]);
   await copy.click();await page.waitForFunction(()=>document.getElementById('shareStatus').textContent==='リンクをコピーしました。');
   assert.equal(await copy.evaluate(e=>e===document.activeElement),true);
   assert.deepEqual(await page.evaluate(()=>shareMock.copies),[canonical]);
   for(const mode of ['cancel','reject','unsupported']) {
    await page.evaluate(mode=>{shareMock.shareMode=mode;},mode);await share.click();
    await page.waitForFunction(()=>document.getElementById('shareSite').getAttribute('aria-disabled')==='false');
    assert.equal(await status.textContent()==='',mode==='cancel');
    assert.deepEqual(await page.evaluate(()=>shareMock.copies),[canonical],'no native failure/cancel auto-copy');
   }
   for(const mode of ['reject','unsupported']) {
    await page.evaluate(mode=>{shareMock.copyMode=mode;},mode);await copy.click();
    assert.ok(await page.locator('#shareManual').isVisible());
    assert.equal(await page.locator('#shareManualUrl').inputValue(),canonical);
    assert.match(await status.textContent(),/自動コピーできません/);
    assert.equal(await copy.evaluate(e=>e===document.activeElement),true,'failure retains trigger focus');
   }
   await page.locator('#shareManualUrl').focus();await page.keyboard.press('ControlOrMeta+A');
   assert.equal(await page.locator('#shareManualUrl').evaluate(e=>e.selectionEnd-e.selectionStart),canonical.length);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await page.screenshot({path:`test-artifacts/profile/share-manual-${reducedMotion}-${width}.png`,fullPage:true});
   for(const kind of ['share','copy']) {
    await page.evaluate(kind=>{shareMock[kind+'Mode']='pending';shareMock.resolve=null;},kind);
    const counts=await page.evaluate(()=>[shareMock.shares.length,shareMock.copies.length]);
    await page.evaluate(kind=>{
     const first=document.getElementById(kind==='share'?'shareSite':'copySiteLink');
     first.focus();first.click();first.click();document.getElementById(kind==='share'?'copySiteLink':'shareSite').click();
    },kind);
    assert.deepEqual(await page.evaluate(()=>[shareMock.shares.length,shareMock.copies.length]),counts.map((n,i)=>n+(i===(kind==='share'?0:1)?1:0)));
    assert.equal(await status.textContent(),'','no success before resolution');
    await page.evaluate(()=>shareMock.resolve());
    await page.waitForFunction(()=>document.getElementById('copySiteLink').getAttribute('aria-disabled')==='false');
   }
   assert.equal(await snapshot(),initial,'sharing does not alter quiz/history/timers/audio');
   await page.evaluate(()=>{shareMock.shareMode='success';shareMock.copyMode='success';});
   for(const [open,back] of [['pickUo','deckBack'],['openAuthor','backFromAuthor'],['openHistoryTitle','backFromHistory']]) {
    await page.locator('#'+open).click();assert.equal(await share.isVisible(),false);
    const count=await page.evaluate(()=>shareMock.shares.length);
    await page.evaluate(()=>document.getElementById('shareSite').click());
    assert.equal(await page.evaluate(()=>shareMock.shares.length),count,'hidden-screen programmatic action ignored');
    await page.locator('#'+back).click();assert.ok(await share.isVisible());
    const before=await snapshot();await share.click();
    await page.waitForFunction(()=>document.getElementById('shareSite').getAttribute('aria-disabled')==='false');
    assert.equal(await page.evaluate(()=>shareMock.shares.length),count+1,'one listener after navigation');
    assert.equal(await snapshot(),before,'navigation then sharing leaves app state unchanged');
   }
   // A late OS result must not steal focus from another screen.
   await page.evaluate(()=>{shareMock.shareMode='pending';});await share.click();
   await page.locator('#openAuthor').click();
   await page.locator('a[href="https://djnaoyaman.github.io/profile.html"]').focus();
   await page.evaluate(()=>shareMock.resolve());
   assert.equal(await page.locator('a[href="https://djnaoyaman.github.io/profile.html"]').evaluate(e=>e===document.activeElement),true);
   assert.deepEqual(errors,[]);results.push({width,height,reducedMotion,errors,mockOnly:true});await page.close();
  }
 } finally {fs.writeFileSync('test-artifacts/profile/share-results.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
