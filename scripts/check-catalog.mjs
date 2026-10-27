import assert from 'node:assert/strict';
import {catalog} from '../catalog.js';
assert.equal(catalog.length,3);assert.equal(new Set(catalog.map(b=>b.id)).size,3);
for(const b of catalog){assert(b.author&&b.sourceTask&&/^[a-f0-9]{64}$/.test(b.sha256));assert.equal(b.version,'v1');assert.equal(Object.keys(b.perspectives).length,4);assert.equal(new Set(b.chapters.map(c=>c.id)).size,b.chapters.length);for(const r of Object.values(b.perspectives)){if(r.status==='待补'){assert(!r.text);continue;}assert.equal(r.sourceHash,b.sha256);assert.equal(r.version,b.version);assert(b.chapters.find(c=>c.id===r.chapterId).paragraphs[r.paragraph].includes(r.quote));}}
const lamp=catalog.find(b=>b.id==='lamp');assert.equal(lamp.status,'连载中');assert.equal(lamp.chapters.length,3);
assert.deepEqual(lamp.chapters.map(c=>(c.paragraphs.join('').match(/[\u3400-\u4dbf\u4e00-\u9fff\u{20000}-\u{2fa1f}]/gu)||[]).length),[2091,2016,2099]);
assert(catalog.filter(b=>b.id!=='lamp').every(b=>b.status==='完结'&&b.chapters.length===1));
console.log('Independent catalog, chapter counts, review hashes and quote anchors PASS');
