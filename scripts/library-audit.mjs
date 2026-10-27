import {books} from '../data.js';
import {catalog} from '../catalog.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
const roles=['programmer','editor','critic','host'];
export function inspectReview(b,r){
 if(!r?.text)return '待补';
 const chapter=b.chapters.find(c=>c.id===r.chapterId);
 if(r.version!==b.version||r.sourceHash!==b.sha256)return '版本不符';
 if(!r.quote||!Number.isInteger(r.paragraph)||!chapter?.paragraphs[r.paragraph]?.includes(r.quote))return '引用无效';
 if(!r.author||!r.source||r.text.trim().length<40)return '评价待核';
 return '已核引用';
}
const existing=new Set(catalog.map(b=>b.id));
const legacy=books.filter(b=>!existing.has(b.id)).map(b=>({id:b.id,title:b.title,version:'legacy-v1',author:'首版AI演示',chapters:[{id:b.id+'-1',title:'全文',paragraphs:b.paragraphs}],perspectives:{},legacy:true}));
export const rows=[...legacy,...catalog].map(b=>{
 const han=(b.chapters.flatMap(c=>c.paragraphs).join('').match(/\p{Script=Han}/gu)||[]).length;
 return {book_id:b.id,title:b.title,version:b.version,han,body:han>=3000?'已入库':'待扩写',sourceTask:b.sourceTask||null,sourceFile:b.sourceFile||'data.js',sourceHash:b.sha256||null,readingHash:crypto.createHash('sha256').update(JSON.stringify(b.chapters)).digest('hex'),perspectives:Object.fromEntries(roles.map(k=>[k,b.legacy?(k==='programmer'?'旧演示评，待版本化':'待补'):inspectReview(b,b.perspectives[k])]))};
});
if(process.argv[1]?.endsWith('library-audit.mjs')){
 const out=process.argv[2]||'.';fs.mkdirSync(out,{recursive:true});
 const planned=JSON.parse(fs.readFileSync(new URL('../library-plan.json',import.meta.url)));
 const complete=rows.filter(r=>r.body==='已入库'&&roles.every(k=>r.perspectives[k]==='已核引用')).length;
 const pending=planned.batches.flatMap(batch=>Array.from({length:Math.max(0,batch.count-catalog.filter(b=>b.sourceTask===batch.task).length)},(_,i)=>({book_id:`待收-${batch.key}-${i+1}`,title:'待作者原件（不是已入库作品）',version:'—',han:0,body:'缺原件',perspectives:Object.fromEntries(roles.map(k=>[k,'待原文']))}))).slice(0,Math.max(0,20-rows.length));
 const matrix=[...rows,...pending];
 fs.writeFileSync(out+'/四视角缺项矩阵.json',JSON.stringify({generatedAt:new Date().toISOString(),target:20,received:rows.length,substantial:rows.filter(r=>r.body==='已入库').length,complete,planned,rows:matrix},null,2));
 fs.writeFileSync(out+'/四视角缺项矩阵.md',`# 二十部四视角缺项矩阵\n\n实际原文 ${rows.length} 部，正文达到3000汉字 ${rows.filter(r=>r.body==='已入库').length} 部，正文及四视角全部满足 ${complete} 部。待收行只是供稿名额，不计作品；3000汉字为本次扩库最低完整稿检查线，不替代情节审校。旧演示的文案/读者角色不能当评论家/纪录片主持人。\n\n|book_id|作品|版本|正文汉字|正文|程序员|编辑|评论家|原创纪录片主持人|\n|---|---|---|---:|---|---|---|---|---|\n`+matrix.map(r=>`|${r.book_id}|${r.title}|${r.version}|${r.han}|${r.body}|${roles.map(k=>r.perspectives[k]).join('|')}|`).join('\n')+'\n');
 console.log(JSON.stringify({received:rows.length,substantial:rows.filter(r=>r.body==='已入库').length,complete}));
}
