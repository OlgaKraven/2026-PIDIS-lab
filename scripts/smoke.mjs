import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { strFromU8, unzipSync } from 'fflate';

const port = 4176;
const baseUrl = `http://127.0.0.1:${port}/2026-PIDIS-lab/`;
const node = process.execPath;
const preview = spawn(node, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore', shell: false });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Preview server did not start');
}

try {
  await waitForServer();
  const candidates = process.platform === 'win32' ? [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ] : [];
  const executablePath = candidates.find(existsSync);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /Проектирование начинается/ }).waitFor();
  assert.equal(await page.locator('.card').count(), 20);
  assert.equal(await page.locator('.semester-grid article').count(), 3);
  assert.equal(await page.locator('.variant-picker select option').count(), 30);
  await page.locator('.variant-picker:not(.compact) select').selectOption('6');
  assert.equal(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), true);
  assert.equal((await fetch(new URL('reports/C3_S5_LR01_Шаблон_отчёта.docx', baseUrl))).status, 200);
  await page.getByPlaceholder('ID, название или результат').fill('ER-диаграмма');
  assert.equal(await page.locator('.card').count(), 1);
  await page.getByRole('link', { name: /Открыть работу/ }).click();
  await page.getByRole('heading', { name: 'ER-диаграмма в 3НФ' }).waitFor();
  const contentBlocks = page.locator('.content-block');
  await contentBlocks.nth(8).waitFor({ state: 'attached' });
  assert.equal(await contentBlocks.count(), 9);
  assert.equal(await contentBlocks.locator('h2').count(), 9);
  assert.equal(await page.getByRole('button', { name: 'Скачать шаблон', exact: true }).count(), 1);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать шаблон', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'PV06_C4-S7-LR02_комплект.zip');
  const archivePath = await download.path();
  const entries = unzipSync(new Uint8Array(await readFile(archivePath)));
  assert.ok(entries['C4-S7-LR02_PV06.html']);
  assert.ok(entries['Исходные_данные/PV06_C4-S7-LR02.md']);
  assert.ok(entries['Шаблон_отчёта/C4-S7-LR02_template.docx']);
  const standalone = strFromU8(entries['C4-S7-LR02_PV06.html']);
  assert.match(standalone, /PV06/);
  assert.doesNotMatch(standalone, /<section class="lab-hero"/);
  assert.equal(await page.getByText(new RegExp('Moo' + 'dle', 'i')).count(), 0);
  const actionableErrors = errors.filter((message) => !message.includes('favicon.ico') && !message.startsWith('Failed to load resource:'));
  assert.equal(actionableErrors.length, 0, errors.join('\n'));
  await browser.close();
  console.log('Smoke test: структура, 30 вариантов, каталог и страница работы работают без ошибок консоли.');
} finally {
  preview.kill();
}
