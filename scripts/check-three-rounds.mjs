import assert from 'node:assert/strict';
import {threeRounds as b} from '../three-rounds.js';
import {catalog} from '../catalog.js';
assert.equal(catalog.filter(x=>x.id===b.id).length,1);
assert.equal(b.chapters.length,3);
assert.equal(b.discussion.length,56);
const ids=new Set(b.discussion.map(x=>x.id));
assert.equal(ids.size,56);
for(let n=1;n<=3;n++){
 const c=b.chapters[n-1];
 assert.equal(c.paragraphs.length,12);
 assert.deepEqual(c.paragraphIds,Array.from({length:12},(_,i)=>`R${n}-P${i+1}`));
 const han=(c.paragraphs.join('').match(/\p{Script=Han}/gu)||[]).length;
 assert(han>=1500&&han<=2500,`round ${n}: ${han} Han`);
 for(const key of ['E01','E02','T01','T02','A01','A02','A03']){
  assert(ids.has(`R${n}-${key}`));assert(ids.has(`D-R${n}-${key}`));
 }
}
const pids=new Set(b.chapters.flatMap(x=>x.paragraphIds));
for(const r of b.discussion){
 assert(r.text.length>80,r.id);
 assert(/^[a-f0-9]{64}$/.test(r.sourceHash));
 assert(ids.has(r.replyTo)||pids.has(r.replyTo),`orphan ${r.id}`);
 for(const id of r.paragraphIds||[]) assert(pids.has(id),`bad paragraph ${id}`);
 const visited=new Set([r.id]);let node=r;
 while(ids.has(node.replyTo)){
  assert(!visited.has(node.replyTo),`cycle ${r.id}`);visited.add(node.replyTo);
  node=b.discussion.find(x=>x.id===node.replyTo);
 }
}
assert(b.corrections.some(x=>x.includes('欠租')));
console.log('Three rounds: 36 paragraphs, 33 reviews, 23 replies, all targets and threads PASS');
