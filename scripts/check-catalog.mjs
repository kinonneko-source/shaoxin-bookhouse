import assert from 'node:assert/strict';
import {catalog} from '../catalog.js';
import {inspectReview} from './library-audit.mjs';
assert(catalog.length>=3);assert.equal(new Set(catalog.map(b=>b.id)).size,catalog.length);
const texts=new Set();
for(const b of catalog){
 assert(b.author&&b.sourceTask&&/^[a-f0-9]{64}$/.test(b.sha256));assert(b.version);assert.deepEqual(Object.keys(b.perspectives).sort(),['critic','editor','host','programmer']);
 assert(b.chapters.length);assert.equal(new Set(b.chapters.map(c=>c.id)).size,b.chapters.length);
 const body=b.chapters.flatMap(c=>c.paragraphs).join('');assert(body);assert(!texts.has(body),'Duplicate work body');texts.add(body);
 for(const r of Object.values(b.perspectives)){
  if(r.status==='待补'){assert(!r.text);continue;}
  assert.equal(inspectReview(b,r),'已核引用',`${b.id}: invalid review`);
 }
}
const lamp=catalog.find(b=>b.id==='lamp');assert.equal(lamp.status,'连载中');assert(lamp.chapters.length>=3);
console.log(`${catalog.length} catalog works: unique bodies, chapter IDs, review versions/hashes/quotes PASS`);
