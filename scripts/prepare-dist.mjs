import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

await mkdir(resolve(dist, 'reports'), { recursive: true });
await cp(resolve(root, 'reports'), resolve(dist, 'reports'), { recursive: true, force: true });
await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'));
await writeFile(resolve(dist, '.nojekyll'), '', 'utf8');

console.log('dist prepared: 31 DOCX templates, 404 fallback, .nojekyll');
