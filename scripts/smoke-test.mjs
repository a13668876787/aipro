import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 4321;
const url = `http://127.0.0.1:${port}/`;

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Preview server did not respond at ${url}`);
}

function startPreview() {
  return spawn('npm', ['run', 'preview'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function runViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const title = await page.locator('h1').first().innerText();
  await page.locator('[data-search-input]').first().fill('Codex');
  const visible = await page.locator('[data-card]:not([hidden])').count();
  await page.locator('[data-card]:not([hidden]) [data-save]').first().click();
  const savedCount = await page.locator('[data-saved-list] article').count();
  await page.locator('[data-card]:not([hidden]) [data-read]').first().click();
  const readPressed = await page.locator('[data-card]:not([hidden]) [data-read]').first().getAttribute('aria-pressed');
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.close();

  if (!title.includes('每日 AI 资讯')) throw new Error(`${viewport.name}: unexpected hero title ${title}`);
  if (visible < 1) throw new Error(`${viewport.name}: search did not leave any visible cards`);
  if (savedCount < 1) throw new Error(`${viewport.name}: saved list did not update`);
  if (readPressed !== 'true') throw new Error(`${viewport.name}: read state did not update`);
  if (pageWidth > viewport.width) throw new Error(`${viewport.name}: horizontal overflow ${pageWidth} > ${viewport.width}`);
  if (errors.length) throw new Error(`${viewport.name}: browser errors: ${errors.join('; ')}`);

  return { viewport: viewport.name, visible, savedCount, pageWidth };
}

async function runAdminCheck(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(`${url}admin/`, { waitUntil: 'domcontentloaded' });
  const title = await page.locator('h1').first().innerText();
  const endpointInput = await page.locator('[data-admin-endpoint]').count();
  const keyInput = await page.locator('[data-admin-key]').count();
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.close();

  if (!title.includes('运营后台')) throw new Error(`admin: unexpected title ${title}`);
  if (endpointInput !== 1 || keyInput !== 1) throw new Error('admin: connection form missing');
  if (pageWidth > 1280) throw new Error(`admin: horizontal overflow ${pageWidth} > 1280`);
  if (errors.length) throw new Error(`admin: browser errors: ${errors.join('; ')}`);

  return { viewport: 'admin', endpointInput, keyInput, pageWidth };
}

let preview;
try {
  preview = startPreview();
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    results.push(await runViewport(browser, viewport));
  }
  results.push(await runAdminCheck(browser));
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (preview) preview.kill('SIGTERM');
}
