import assert from 'node:assert/strict';
import {books,roles} from '../data.js';
assert.equal(books.length,3);assert.equal(Object.keys(roles).length,4);
for(const b of books){const n=b.paragraphs.join('').length;assert(n>=600&&n<=1000,`${b.id}: ${n} chars`);assert(b.comments.length>=6);assert(b.comments.some(c=>c.replies?.length));assert.equal(new Set(b.comments.map(c=>c.role)).size,4);for(const c of b.comments){assert(roles[c.role]);assert(b.paragraphs.some(p=>p.includes(c.quote)),`Missing quote ${c.quote}`);for(const r of c.replies||[])assert(roles[r.role]);}console.log(`${b.id}: ${n} chars, ${b.comments.length} comments, ${b.comments.reduce((n,c)=>n+(c.replies?.length||0),0)} replies`)}
console.log('Content integrity checks passed.');
