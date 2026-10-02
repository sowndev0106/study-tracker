import { chromium } from 'playwright';
import fs from 'fs';

const records = JSON.parse(fs.readFileSync('./r2-backup-records.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync('./r2-backup-targets.json', 'utf8'));
const settings = JSON.parse(fs.readFileSync('./r2-backup-settings.json', 'utf8'));

fs.mkdirSync('./screenshots', { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('tc_auth_token', 'mock_valid_token');
    localStorage.setItem('tc_auth_token_expiry', (Date.now() + 86400000 * 30).toString());
  });

  await page.route('**/api/health', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok', r2Bound: true })
  }));

  await page.route('**/api/records', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(records)
  }));

  await page.route('**/api/targets', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(targets)
  }));

  await page.route('**/api/settings', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(settings)
  }));

  console.log('Navigating to http://localhost:5173 on mobile...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  console.log('Taking mobile screenshot (start)...');
  await page.screenshot({ path: './screenshots/mobile-mon-thu.png', fullPage: true });

  // Scroll horizontally to see Fri - Sun
  const scrollContainer = page.locator('div.overflow-auto').first();
  if (await scrollContainer.isVisible()) {
    console.log('Scrolling horizontally to Fri-Sun...');
    await scrollContainer.evaluate(el => el.scrollLeft = 320);
    await page.waitForTimeout(300);
    await page.screenshot({ path: './screenshots/mobile-fri-sun.png', fullPage: true });

    console.log('Scrolling vertically down to week 4-5...');
    await scrollContainer.evaluate(el => el.scrollTop = 250);
    await page.waitForTimeout(300);
    await page.screenshot({ path: './screenshots/mobile-weeks-down.png', fullPage: true });
  }

  // Also switch to Goals tab to see how goals look on mobile
  const goalsNav = page.locator('button:has-text("Goals")');
  if (await goalsNav.isVisible()) {
    await goalsNav.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-goals.png', fullPage: true });
  }

  console.log('Mobile screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Playwright error:', err);
  process.exit(1);
});
