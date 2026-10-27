// Run from repository root: node scripts/import-library.mjs normalized-batch.json
// Normalized batch: {books:[{...catalog shape, originalPath}], reviews:[{book_id,...review,role,originalPath}]}.
// originalPath is read only. Review placeholders remain missing until actual review source arrives.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {catalog} from '../catalog.js';
import {inspectReview} from './library-audit.mjs';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const batch=JSON.parse(fs.readFileSync(process.argv[2]));
const next=structuredClone(catalog), manifest=JSON.parse(fs.readFileSync('import-manifest.json'));
for(const input of batch.books||[]){
 const {originalPath,...b}=input;
 assert(originalPath&&fs.existsSync(originalPath),'Author original must exist');
 const raw=fs.readFileSync(originalPath);const source=raw.toString('utf8').replace(/\r\n/g,'\n');
 assert(/^[a-z][a-z0-9-]*$/.test(b.id),'Stable safe book_id required');
 assert(b.title&&b.author&&b.version&&b.sourceTask&&b.sourceFile);
 assert(b.chapters?.length&&new Set(b.chapters.map(c=>c.id)).size===b.chapters.length);
 let cursor=0;
 for(const chapter of b.chapters){
  assert(chapter.id&&chapter.title&&chapter.paragraphs.length);
  for(const p of chapter.paragraphs){assert(typeof p==='string'&&p.trim());const pos=source.indexOf(p,cursor);assert(pos>=cursor,`${b.id}: paragraph missing/out of order in original: ${p.slice(0,30)}`);cursor=pos+p.length;}
 }
 const text=b.chapters.flatMap(c=>c.paragraphs).join('');
 assert((text.match(/\p{Script=Han}/gu)||[]).length>=3000,`${b.id}: needs full manuscript`);
 assert(!next.some(x=>x.id!==b.id&&x.chapters.flatMap(c=>c.paragraphs).join('')===text),'Same body cannot be a new work');
 b.sha256=digest(raw);
 b.perspectives=Object.fromEntries(['programmer','editor','critic','host'].map(k=>[k,{status:'待补'}]));
 const old=next.findIndex(x=>x.id===b.id);
 if(old>=0){assert(next[old].version!==b.version,'Version change required to replace work');next[old]=b;}else next.push(b);
 manifest.sources=manifest.sources.filter(x=>x.id!==b.id);
 manifest.sources.push({id:b.id,title:b.title,author:b.author,version:b.version,sourceTask:b.sourceTask,sourceFile:b.sourceFile,sha256:b.sha256,sourceFileId:b.sourceFileId,sourceMessageId:b.sourceMessageId,reviewStatus:b.reviewStatus,importTask:'6d01043a-a91b-4c73-8925-5fe0e28c6d7a'});
}
for(const input of batch.reviews||[]){
 const {book_id,role,originalPath,...r}=input;
 const b=next.find(b=>b.id===book_id);assert(b,'Unknown review book');
 assert(['programmer','editor','critic','host'].includes(role));
 assert(originalPath&&fs.existsSync(originalPath),'Review source must exist');
 const raw=fs.readFileSync(originalPath);const reviewSource=raw.toString('utf8');
 assert(reviewSource.includes(r.quote)&&reviewSource.includes(r.text),'Review must match delivered original');
 assert.equal(r.version,b.version,'Review version mismatch');
 if(r.sourceHash)assert.equal(r.sourceHash,b.sha256,'Review source hash mismatch');if(r.readingHash)assert.equal(r.readingHash,digest(JSON.stringify(b.chapters)),'Review reading hash mismatch');r.sourceHash=b.sha256;r.reviewFile=originalPath.split('/').at(-1);r.reviewSHA256=digest(raw);r.status='已收原件，引用已核';
 assert.equal(inspectReview(b,r),'已核引用');b.perspectives[role]=r;
}
for(const b of next)for(const r of Object.values(b.perspectives))if(r.text)assert.equal(inspectReview(b,r),'已核引用');
// Validate everything before writing either final file.
fs.writeFileSync('catalog.js','export const catalog = '+JSON.stringify(next,null,2)+';\n');
manifest.task='6d01043a-a91b-4c73-8925-5fe0e28c6d7a';manifest.classification='独立作品按book_id计数；扩写替换同ID，不累加';
fs.writeFileSync('import-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Imported ${batch.books?.length||0} manuscripts, ${batch.reviews?.length||0} reviews; ${next.length} catalog works.`);
