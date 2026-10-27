import assert from 'node:assert/strict';import {catalog} from '../catalog.js';import {inspectReview} from './library-audit.mjs';
assert(catalog.length>=20,'At least twenty independent works required');
assert.equal(new Set(catalog.map(b=>b.id)).size,catalog.length);
for(const id of ['rain','moon','email'])assert.equal(catalog.find(b=>b.id===id)?.version,'v2',`${id}: expansion v2 required`);
const bodies=new Set(),reviewTexts=new Set();let count=0;
for(const b of catalog){
 const body=b.chapters.flatMap(c=>c.paragraphs).join('');assert((body.match(/\p{Script=Han}/gu)||[]).length>=3000,`${b.id}: full manuscript required`);assert(!bodies.has(body),`${b.id}: duplicate body`);bodies.add(body);
 const authors=new Set();
 for(const role of ['programmer','editor','critic','host']){
  const r=b.perspectives[role];assert.equal(inspectReview(b,r),'已核引用',`${b.id}/${role}: original review missing or invalid`);
  assert(!reviewTexts.has(r.text),`${b.id}/${role}: generic duplicated review text`);reviewTexts.add(r.text);authors.add(r.author);count++;
 }
 assert.equal(authors.size,4,`${b.id}: distinct supplied perspective authors required`);
}
assert.equal(catalog.find(b=>b.id==='lamp').status,'连载中');
console.log(`Release acceptance PASS: ${catalog.length} independent complete manuscripts, ${count} substantive unique reviews with exact version/hash/quote anchors; serial preserved.`);
