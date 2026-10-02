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

  // Wait for the monthly goal text to be visible
  await page.waitForSelector('text=Goal', { timeout: 10000 });
  await page.waitForTimeout(800);

  console.log('Taking desktop full screenshot...');
  await page.screenshot({ path: './screenshots/desktop-full.png', fullPage: true });

  const monthlyCard = await page.locator('text=Goal').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
  if (monthlyCard) {
    console.log('Taking monthly card screenshot...');
    await monthlyCard.screenshot({ path: './screenshots/monthly-card.png' });
  }

  // Mobile testing
  console.log('Testing mobile view...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  console.log('Taking mobile calendar view screenshot...');
  await mobilePage.screenshot({ path: './screenshots/mobile-full.png' });

  // Switch to mobile Goals tab
  console.log('Clicking mobile Goals nav button...');
  await mobilePage.locator('nav button').filter({ hasText: 'Goals' }).click();
  await mobilePage.waitForTimeout(500);

  console.log('Taking mobile goals tab screenshot...');
  await mobilePage.screenshot({ path: './screenshots/mobile-goals.png' });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Playwright error:', err);
  process.exit(1);
});
