import fs from 'node:fs';import assert from 'node:assert/strict';
import {designs} from '../authoring/design.mjs';import {dataset} from '../authoring/datasets.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const original=read('authoring/original-labs.json'),{labs}=read('src/data/labs.json'),variants=read('authoring/original-variants.json'),data=read('src/data/variant-data.json');
assert.equal(labs.length,20);assert.equal(variants.length,30);let sets=0,records=0;
for(let i=0;i<labs.length;i++){
 const l=labs[i],o=original[i];for(const k of ['id','number','title','semester','points'])assert.equal(l[k],o[k],`${l.id}:${k}`);assert.equal(l.blockTitle,o.section);
 assert(Math.abs(l.rubric.reduce((n,r)=>n+Number(r[2]),0)-l.points)<1e-6);assert.equal(l.task.length,designs[i].steps.length);
 assert(fs.existsSync('public/reports/'+l.reportFile));
 for(const v of variants){const generated=dataset(designs[i],v);assert.deepEqual(data[l.id][v.id],generated.sections);assert(generated.recordCount>=[0,12,32,48,64][designs[i].level]);
  for(const s of generated.sections){assert(s.table.rows.every(r=>r.length===s.table.columns.length));assert.equal(new Set(s.table.rows.map(r=>r[0])).size,s.table.rows.length);}
  const text=JSON.stringify(generated.sections);assert(!/PISID[34]-lecture|прочитайте лекци|время выполнения|минут на|портфолио/i.test(text));
  sets++;records+=generated.recordCount;
 }
}
const totals=labs.reduce((a,l)=>(a[l.semester]=(a[l.semester]||0)+l.points,a),{});assert.deepEqual(totals,{5:43,6:30,7:27});
for(const f of ['src/data/labs.json','src/data/variant-data.json','src/data/methodology.ts'])assert(!/https?:[^" ]*lecture|durationBlocks|plannedMinutes|teacher_answer/.test(fs.readFileSync(f,'utf8')));
fs.mkdirSync('quality',{recursive:true});fs.writeFileSync('quality/structure.json',JSON.stringify({labs:20,variants:30,sets,records,totals,status:'passed'},null,2));console.log({sets,records,totals,status:'passed'});
