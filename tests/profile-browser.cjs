const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
// The favicon must reuse the existing Apple icon, not a blank data PNG or new artwork.
const indexSource = fs.readFileSync('index.html', 'utf8');
assert.match(indexSource, /<link rel="icon" type="image\/png" href="\.\/favicon\.png">/);
const appleTag = indexSource.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)[0];
const appleData = appleTag.match(/href="data:image\/png;base64,([^"]+)"/)[1];
const faviconBytes = fs.readFileSync('favicon.png');
assert.deepEqual(faviconBytes, Buffer.from(appleData, 'base64'), 'favicon preserves existing site artwork bytes');
assert.ok(faviconBytes.length > 1000, 'favicon is not the previous single-color placeholder');

// Launch metadata remains consistent with the current page and reused icon.
assert.match(indexSource, /<meta property="og:image:type" content="image\/png">/);
assert.match(indexSource, /<meta name="twitter:image:alt" content="[^"]+">/);
const manifest = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
assert.equal(manifest.start_url, '/sakanamushi/'); assert.equal(manifest.scope, '/sakanamushi/');
assert.ok(manifest.name && manifest.description && manifest.display);
assert.equal(manifest.icons[0].src, '/sakanamushi/favicon.png');
assert.equal(manifest.icons[0].sizes, '180x180', 'do not misdeclare generated Android artwork');
const pageDate = indexSource.match(/"dateModified": "([^"]+)"/)[1];
assert.ok(indexSource.includes('datetime="'+pageDate+'"'));
assert.ok(fs.readFileSync('sitemap.xml', 'utf8').includes('<lastmod>'+pageDate+'</lastmod>'));
const notFound = fs.readFileSync('404.html', 'utf8');
assert.match(notFound, /name="robots" content="noindex,follow"/);
assert.match(notFound, /href="\/sakanamushi\/"/);
assert.match(notFound, /href="\/sakanamushi\/favicon\.png"/);
assert.match(notFound, /:focus-visible/); assert.ok(!/<script|<iframe|animation:/i.test(notFound));
assert.ok(!fs.readFileSync('sitemap.xml', 'utf8').includes('404.html'));
assert.ok(fs.readFileSync('llms.txt', 'utf8').includes('https://djnaoyaman.github.io/sakanamushi/'));
(async () => {
 const browser = await chromium.launch();
 fs.mkdirSync('test-artifacts/profile', { recursive: true });
 const results = [];
 try {
  for (const {width,height} of [{width:320,height:900},{width:390,height:900},{width:844,height:390},{width:1280,height:900}]) {
   const page = await browser.newPage({viewport:{width,height}});
   await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return u.hostname === '127.0.0.1' ? route.continue() : route.abort();
   });
   const errors=[]; page.on('pageerror', e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/index.html', {waitUntil:'networkidle'});
   await page.locator('#splashScreen').click();
   await page.locator('#openAuthor').click();
   await page.evaluate(async()=>{
    for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
    scrollTo(0,0);
   });
   await page.waitForTimeout(800);
   const link=page.locator('a[href="https://djnaoyaman.github.io/profile.html"]');
   assert.equal(await link.count(),1,'one central author link');
   await link.scrollIntoViewIfNeeded(); assert.ok(await link.isVisible(),'author link visible');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   const row={width,overflow,errors};results.push(row);
   await page.screenshot({path:`test-artifacts/profile/profile-${width}.png`,fullPage:true});
   assert.equal(overflow,false,'no horizontal overflow');
   assert.deepEqual(errors,[],'no JavaScript exceptions');
   await page.locator('#backFromAuthor').click();
   assert.equal(await page.locator('body').getAttribute('data-view'),'title');
   await page.locator('#openAuthor').click();
   assert.ok(await link.isVisible(),'repeated author navigation');
   await page.close();
   const recovery=await browser.newPage({viewport:{width,height}});
   await recovery.route('**/*', route => {
    const u=new URL(route.request().url());
    if(u.hostname!=='127.0.0.1') return route.abort();
    if(u.pathname.startsWith('/sakanamushi/')) return route.continue({url:u.origin+u.pathname.slice('/sakanamushi'.length)+u.search});
    return route.continue();
   });
   await recovery.goto('http://127.0.0.1:8765/sakanamushi/404.html',{waitUntil:'networkidle'});
   assert.match(await recovery.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
   const recoveryOverflow=await recovery.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(recoveryOverflow,false,'404 fits portrait/landscape viewport');
   await recovery.screenshot({path:`test-artifacts/profile/404-${width}.png`,fullPage:true});
   await recovery.getByRole('link',{name:'サイトの入口へ戻る'}).click();
   assert.ok(await recovery.locator('#splashScreen').isVisible(),'404 returns to site entry');
   results.push({width,height,notFoundOverflow:recoveryOverflow,recovery:true});
   await recovery.close();
  }
 } finally {
  fs.writeFileSync('test-artifacts/profile/results.json',JSON.stringify(results,null,2));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});

