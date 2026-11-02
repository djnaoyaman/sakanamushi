const {chromium}=require('playwright');
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const source=fs.readFileSync('favicon.png');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'346c65e94ce77fae2a620c72af66331821ae1d73cd92b87674e232ca30e02194');
const html=fs.readFileSync('index.html','utf8');
const apple=html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)[0];
assert.deepEqual(source,Buffer.from(apple.match(/href="data:image\/png;base64,([^"]+)"/)[1],'base64'));
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
assert.deepEqual(manifest.icons.map(i=>i.sizes),['180x180','192x192','512x512']);
for(const size of [192,512]) {
 const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`);
 assert.equal(icon.type,'image/png');assert.equal(icon.purpose,'any');
 assert.equal(icon.src,`/sakanamushi/android-chrome-${size}.png?v=20261102-1619`);
 const b=fs.readFileSync(`android-chrome-${size}.png`);
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);
}
(async()=>{
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage({viewport:{width:780,height:660}});
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.hostname!=='127.0.0.1')return route.abort();
   if(u.pathname.startsWith('/sakanamushi/'))return route.continue({url:u.origin+u.pathname.slice('/sakanamushi'.length)+u.search});
   return route.continue();
  });
  await page.goto('http://127.0.0.1:8765/sakanamushi/');
  const href=await page.locator('link[rel="manifest"]').getAttribute('href');
  assert.equal(href,'/sakanamushi/site.webmanifest?v=20261102-1619');
  const checks=await page.evaluate(async href=>{
   const response=await fetch(href);const m=await response.json();const results=[];
   for(const i of m.icons){
    const r=await fetch(i.src);const blob=await r.blob();const bitmap=await createImageBitmap(blob);
    results.push({src:i.src,status:r.status,type:blob.type,width:bitmap.width,height:bitmap.height});bitmap.close();
   }
   return results;
  },href);
  for(const [i,row] of checks.entries()){
   assert.equal(row.status,200);assert.equal(row.type,'image/png');assert.equal(`${row.width}x${row.height}`,manifest.icons[i].sizes);
  }
  // Visual comparison at realistic shortcut display sizes, no OS install performed.
  await page.setContent(`<style>body{font:16px sans-serif;background:#f7f5ef;color:#222;margin:24px}table{border-spacing:24px}td{text-align:center}img{display:block;margin:auto}th{font-weight:normal}</style><h1>Existing artwork · Android size exports</h1><p>Source detail remains 180px; no new artwork.</p><table><tr><th>Rendered size</th>${['Original 180','Android 192','Android 512'].map(s=>`<th>${s}</th>`).join('')}</tr>${[48,64,96,180].map(size=>`<tr><td>${size}px</td>${manifest.icons.map(i=>`<td><img alt="${i.sizes}" width="${size}" height="${size}" src="http://127.0.0.1:8765${i.src}"></td>`).join('')}</tr>`).join('')}</table>`);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  fs.mkdirSync('test-artifacts/profile',{recursive:true});
  await page.screenshot({path:'test-artifacts/profile/android-icon-comparison.png',fullPage:true});
  fs.writeFileSync('test-artifacts/profile/android-icon-results.json',JSON.stringify(checks,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
