import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const filePath = 'file://' + path.resolve('./preview-bento-options.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Capture Option 1
  await page.screenshot({ path: './screenshots/bento-option-1.png' });

  // Click Option 2
  await page.click('#btn-opt-2');
  await page.waitForTimeout(400);
  await page.screenshot({ path: './screenshots/bento-option-2.png' });

  // Click Option 3
  await page.click('#btn-opt-3');
  await page.waitForTimeout(400);
  await page.screenshot({ path: './screenshots/bento-option-3.png' });

  // Click Option 4
  await page.click('#btn-opt-4');
  await page.waitForTimeout(400);
  await page.screenshot({ path: './screenshots/bento-option-4.png' });

  // Click Option 5
  await page.click('#btn-opt-5');
  await page.waitForTimeout(400);
  await page.screenshot({ path: './screenshots/bento-option-5.png' });

  // Click Compare
  await page.click('#btn-opt-compare');
  await page.waitForTimeout(400);
  await page.screenshot({ path: './screenshots/bento-options-compare.png' });

  console.log('All 5 option screenshots captured!');
  await browser.close();
}

run().catch(console.error);
