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
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Set auth token in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('tc_auth_token', 'mock_valid_token');
    localStorage.setItem('tc_auth_token_expiry', (Date.now() + 86400000 * 30).toString());
  });

  // Mock API routes with real data
  await page.route('**/api/health', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok', storage: 'R2 Cloudflare (study-tracker-db)', r2Bound: true })
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

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Goal', { timeout: 10000 });
  await page.waitForTimeout(600);

  console.log('Taking desktop collapsed screenshot...');
  await page.screenshot({ path: './screenshots/desktop-collapsed.png' });

  // Expand Month details
  const detailButtons = page.locator('button:has-text("detail")');
  console.log('Clicking month detail...');
  await detailButtons.first().click();
  await page.waitForTimeout(300);

  // Expand Week details
  console.log('Clicking week detail...');
  await detailButtons.nth(1).click();
  await page.waitForTimeout(300);

  console.log('Taking expanded screenshots...');
  await page.screenshot({ path: './screenshots/desktop-both-expanded.png' });

  // Crop weekly card
  const weekCard = page.locator('text=Week 40').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
  await weekCard.screenshot({ path: './screenshots/weekly-card-expanded.png' });

  console.log('All tests completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Playwright error:', err);
  process.exit(1);
});
