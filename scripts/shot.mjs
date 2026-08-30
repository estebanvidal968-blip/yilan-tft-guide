import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire('C:/Users/admin/.workbuddy/binaries/node/workspace/');
const { chromium } = require('playwright');

const OUT = 'E:/AI_workbuddy/projects/lol-tft-guide/__screens__';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const base = 'http://localhost:3000';

async function shot(path, file, full = false) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: full });
  console.log('shot', file, '->', path);
}

await shot('/', 'home-real.png', true);
const link = await page.$('a.cc-link');
if (link) {
  const href = await link.getAttribute('href');
  await shot(href, 'comp-real.png', true);
}
await shot('/versions', 'versions-real.png', true);

await browser.close();
console.log('done');
