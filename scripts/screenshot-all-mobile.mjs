import { chromium } from 'playwright';
import fs from 'fs';

const records = JSON.parse(fs.readFileSync('./r2-backup-records.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync('./r2-backup-targets.json', 'utf8'));
const settings = JSON.parse(fs.readFileSync('./r2-backup-settings.json', 'utf8'));

fs.mkdirSync('./screenshots/mobile-audit', { recursive: true });

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

  // 1. Calendar Month View (Initial)
  console.log('1. Calendar Month initial...');
  await page.screenshot({ path: './screenshots/mobile-audit/01-calendar-month.png' });

  // 2. Calendar Month View Scrolled X
  const scrollContainer = page.locator('div.overflow-auto').first();
  if (await scrollContainer.isVisible()) {
    console.log('2. Calendar Month scrolled X...');
    await scrollContainer.evaluate(el => el.scrollLeft = 320);
    await page.waitForTimeout(300);
    await page.screenshot({ path: './screenshots/mobile-audit/02-calendar-month-scrolled-x.png' });

    console.log('3. Calendar Month scrolled Y...');
    await scrollContainer.evaluate(el => el.scrollTop = 300);
    await page.waitForTimeout(300);
    await page.screenshot({ path: './screenshots/mobile-audit/03-calendar-month-scrolled-y.png' });

    // Reset scroll
    await scrollContainer.evaluate(el => { el.scrollLeft = 0; el.scrollTop = 0; });
    await page.waitForTimeout(200);
  }

  // 4. Switch to Week View
  console.log('4. Calendar Week View...');
  const weekTabBtn = page.locator('button:has-text("Week"):visible').first();
  if (await weekTabBtn.isVisible()) {
    await weekTabBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/04-calendar-week.png' });

    // Scroll week view X
    const weekScroll = page.locator('div.overflow-x-auto').first();
    if (await weekScroll.isVisible()) {
      await weekScroll.evaluate(el => el.scrollLeft = 280);
      await page.waitForTimeout(300);
      await page.screenshot({ path: './screenshots/mobile-audit/05-calendar-week-scrolled-x.png' });
    }

    // Switch back to month
    const monthTabBtn = page.locator('button:has-text("Month"):visible').first();
    if (await monthTabBtn.isVisible()) await monthTabBtn.click();
    await page.waitForTimeout(300);
  }

  // 5. Goals Tab
  console.log('5. Goals Tab...');
  const goalsNavBtn = page.locator('nav button:has-text("Goals")');
  if (await goalsNavBtn.isVisible()) {
    await goalsNavBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/06-goals-tab.png' });

    // Scroll Goals down
    const goalsScroll = page.locator('div.overflow-y-auto').first();
    if (await goalsScroll.isVisible()) {
      await goalsScroll.evaluate(el => el.scrollTop = 350);
      await page.waitForTimeout(300);
      await page.screenshot({ path: './screenshots/mobile-audit/07-goals-tab-scrolled.png' });
    }
  }

  // 6. Stats Tab
  console.log('6. Stats Tab...');
  const statsNavBtn = page.locator('nav button:has-text("Stats")');
  if (await statsNavBtn.isVisible()) {
    await statsNavBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/08-stats-tab.png' });

    const statsScroll = page.locator('div.overflow-y-auto').first();
    if (await statsScroll.isVisible()) {
      await statsScroll.evaluate(el => el.scrollTop = 400);
      await page.waitForTimeout(300);
      await page.screenshot({ path: './screenshots/mobile-audit/09-stats-tab-scrolled.png' });
    }
  }

  // 7. Day Detail Modal
  console.log('7. Day Detail Modal...');
  // Go back to calendar
  const calNavBtn = page.locator('nav button:has-text("Calendar")');
  await calNavBtn.click();
  await page.waitForTimeout(300);

  // Click date 2026-10-01
  const dayCell = page.locator('[data-date="2026-10-01"]').first();
  if (await dayCell.isVisible()) {
    await dayCell.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/10-day-detail-modal.png' });
    // Close modal
    const closeBtn = page.locator('button[title="Close"], button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // 8. New Session Modal (Floating + button in nav)
  console.log('8. New Session Modal...');
  const plusBtn = page.locator('nav button[title="Log Study Session"], nav button:has(svg.lucide-plus)');
  if (await plusBtn.isVisible()) {
    await plusBtn.first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/11-new-session-modal.png' });
    // Close modal
    const closeBtn = page.locator('button:has(svg.lucide-x)');
    if (await closeBtn.isVisible()) await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // 9. Config / Target Modal
  console.log('9. Config Modal...');
  const configBtn = page.locator('nav button:has-text("Config")');
  if (await configBtn.isVisible()) {
    await configBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: './screenshots/mobile-audit/12-config-modal.png' });
  }

  console.log('All mobile audit screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Playwright audit error:', err);
  process.exit(1);
});
