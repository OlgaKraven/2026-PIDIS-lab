import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const labs = JSON.parse(await readFile(resolve(root, 'src/labs.json'), 'utf8'));
const missing = [];

for (const lab of labs) {
  for (const path of [lab.reportUrl, lab.input_file]) {
    try { await stat(resolve(root, path)); } catch { missing.push(`${lab.id}: ${path}`); }
  }
  assert.match(lab.materialUrl, /^https:\/\/github\.com\/OlgaKraven\/2026-PIDIS-lab\/blob\/main\//);
  assert.match(lab.lmsUrl, /^https:\/\/lms\.synergy\.ru\/$/);
  for (const lecture of lab.lectures) assert.match(lecture.url, /^https:\/\/olgakraven\.github\.io\/2026-PISID[34]-lecture\//);
}

const markdownFiles = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.name.endsWith('.md')) markdownFiles.push(path);
  }
}
for (const directory of ['content', 'inputs', 'teacher', 'docs']) await collect(resolve(root, directory));
markdownFiles.push(resolve(root, 'README.md'), resolve(root, 'SOURCES.md'), resolve(root, 'coverage-matrix.md'));

for (const file of markdownFiles) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^https?:\/\//.test(target) || target.startsWith('mailto:')) continue;
    try { await stat(resolve(dirname(file), decodeURIComponent(target))); } catch { missing.push(`${file}: ${target}`); }
  }
}

assert.deepEqual(missing, [], `Неразрешённые локальные ссылки:\n${missing.join('\n')}`);
console.log(`Проверено: ${labs.length} работ, ${markdownFiles.length} Markdown-файлов, локальные ссылки разрешены.`);
