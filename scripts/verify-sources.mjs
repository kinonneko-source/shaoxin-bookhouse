import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {catalog} from '../catalog.js';
const out=process.argv[2],inbox=process.argv[3]||'/workspace/inbox';
const sourcePaths={tide:path.join(inbox,'退潮后请及时注销月亮.md'),umbrella:path.join(inbox,'一把伞的充分必要条件.md'),lamp:path.join(inbox,'首批小说原文.md')};
for(const f of fs.readdirSync(out).filter(f=>f.endsWith('归一化.json'))){const data=JSON.parse(fs.readFileSync(path.join(out,f)));for(const b of data.books||[])sourcePaths[b.id]=b.originalPath;}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');const result=[];
for(const b of catalog){
 const file=sourcePaths[b.id];assert(file&&fs.existsSync(file),`${b.id}: missing original`);const raw=fs.readFileSync(file);assert.equal(hash(raw),b.sha256,`${b.id}: original hash changed`);
 let body=raw.toString('utf8').replace(/\r\n/g,'\n');
 if(body.includes('## 正文\n'))body=body.split('## 正文\n')[1];else body=body.replace(/^# [^\n]*\n/,'');
 if(['tide','umbrella'].includes(b.id))body=body.replace(/^## /gm,'');
 if(b.id==='lamp')body=body.replace(/^作者角色：[^\n]*$/gm,'').replace(/^## [^\n]*$/gm,'');
 body=body.replace(/\n（完）\s*$/,'');
 const expected=body.trim().split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);const actual=b.chapters.flatMap(c=>c.paragraphs);
 assert.equal(hash(JSON.stringify(actual)),hash(JSON.stringify(expected)),`${b.id}: paragraphs differ (actual ${actual.length}, source ${expected.length})`);
 const reviews=[];
 for(const [role,r] of Object.entries(b.perspectives))if(r.text){
  const reviewFile=r.reviewFile&&[path.join(out,r.reviewFile),path.join(inbox,r.reviewFile)].find(f=>fs.existsSync(f));
  if(reviewFile){const rr=fs.readFileSync(reviewFile);assert.equal(hash(rr),r.reviewSHA256,`${b.id}/${role}: review snapshot hash mismatch; refresh/reimport current cumulative file`);assert(rr.toString().includes(r.quote)&&rr.toString().includes(r.text));}
  reviews.push({role,sourceHash:r.sourceHash,reviewSHA256:r.reviewSHA256||null,sourceVersion:r.version,chapterId:r.chapterId,paragraph:r.paragraph,quote:r.quote});
 }
 result.push({book_id:b.id,title:b.title,version:b.version,authorVersion:b.authorVersion||null,sourceFile:b.sourceFile,sourceFileId:b.sourceFileId||null,sourceMessageId:b.sourceMessageId||null,sha256:b.sha256,readingHash:hash(JSON.stringify(b.chapters)),chapters:b.chapters.length,paragraphs:actual.length,han:(actual.join('').match(/\p{Script=Han}/gu)||[]).length,originalParagraphsEqual:true,reviews});
}
fs.writeFileSync(path.join(out,'来源核验.json'),JSON.stringify({generatedAt:new Date().toISOString(),note:'全文件SHA256与已入库sourceHash一致；去除原稿元信息、章标题及独立完结标记后逐段完整对照。tide/umbrella保留正文节标题；汉字数口径为入库阅读段落（含节标题）。评论源为实际收到的累计快照，核原句及原文SHA。',works:result},null,2));console.log(`${result.length} originals: full hashes and complete paragraph sequences PASS`);
