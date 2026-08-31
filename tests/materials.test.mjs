import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const labs = JSON.parse(await readFile(resolve(root, 'src/labs.json'), 'utf8'));

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

test('каталог содержит 31 уникальную работу в распределении 19/7/5', () => {
  assert.equal(labs.length, 31);
  assert.equal(new Set(labs.map((lab) => lab.id)).size, 31);
  assert.equal(labs.filter((lab) => lab.course === 3 && lab.semester === 5).length, 19);
  assert.equal(labs.filter((lab) => lab.course === 3 && lab.semester === 6).length, 7);
  assert.equal(labs.filter((lab) => lab.course === 4 && lab.semester === 7).length, 5);
});

test('у каждой работы есть полный студенческий комплект', async () => {
  for (const lab of labs) {
    for (const key of ['id', 'title', 'section', 'goal', 'skill', 'situation', 'artifact', 'decision', 'example', 'expected', 'quality', 'reportUrl', 'materialUrl', 'lmsUrl']) {
      assert.equal(typeof lab[key], 'string', `${lab.id}: ${key}`);
      assert.ok(lab[key].trim(), `${lab.id}: ${key} пуст`);
    }
    assert.ok(lab.inputs.length >= 4, `${lab.id}: мало исходных данных`);
    assert.ok(lab.remember.length >= 4 && lab.remember.length <= 6, `${lab.id}: памятка должна содержать 4–6 пунктов`);
    assert.ok(lab.artifact_fields.length >= 5, `${lab.id}: мало полей артефакта`);
    assert.ok(lab.lectures.length >= 1, `${lab.id}: нет лекции`);
    assert.equal(lab.durationBlocks, 1, `${lab.id}: работа должна занимать один учебный блок`);
    assert.equal(lab.lmsUrl, 'https://lms.synergy.ru/');
    assert.ok((await stat(resolve(root, lab.reportUrl))).isFile(), `${lab.id}: нет DOCX`);
    assert.ok((await stat(resolve(root, lab.input_file))).isFile(), `${lab.id}: нет исходных данных`);
    for (const hidden of ['teacher_answer', 'acceptable', 'hint', 'discussion']) assert.equal(hidden in lab, false, `${lab.id}: преподавательское поле опубликовано`);
  }
});

test('публичные материалы не содержат устаревшего названия, таймингов или ответа преподавателя', async () => {
  const files = [...await walk(resolve(root, 'content')), resolve(root, 'src/main.tsx'), resolve(root, 'README.md'), resolve(root, 'SOURCES.md')];
  const banned = [new RegExp('Moo' + 'dle', 'iu'), /\b\d+\s*(минут|мин\.)/iu, /академическ\w*\s+час/iu, /ответ преподавателя/iu];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const pattern of banned) assert.doesNotMatch(text, pattern, `${file}: запрещённая формулировка`);
  }
});

test('комплект преподавателя содержит карточку и рубрику для каждой работы', async () => {
  const files = await readdir(resolve(root, 'teacher'));
  assert.equal(files.filter((name) => name.endsWith('_guide.md')).length, 31);
  assert.equal(files.filter((name) => name.endsWith('_rubric.md')).length, 31);
});
