import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const all=[];function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())walk(f);else all.push(f)}}walk('dist');
for(const f of all){assert(!/private|teacher-guide|source-registry|answer-model|lecture-map/.test(f));if(/\.(js|json|html|css|map)$/.test(f)){const t=fs.readFileSync(f,'utf8');assert(!/plannedMinutes|sourceDurationBlocks|teacher_answer|PISID[34]-lecture|durationBlocks/.test(t),f);}}
console.log(JSON.stringify({files:all.length,status:'passed'}));
