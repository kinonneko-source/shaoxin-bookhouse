import {catalog} from '../catalog.js';import fs from 'node:fs';import crypto from 'node:crypto';
const out=process.argv[2];const ids=process.argv[3]==='--all'?catalog.map(b=>b.id):process.argv.slice(3);const selected=catalog.filter(b=>ids.includes(b.id));
if(selected.length!==ids.length)throw new Error('Unknown or duplicate book_id');
fs.mkdirSync(out,{recursive:true});
const name=ids.join('_').length>120?'读稿-'+selected.length+'部-'+crypto.createHash('sha256').update(selected.map(b=>b.id+':'+b.version).join('|')).digest('hex').slice(0,12):ids.join('_');console.log(name);
fs.writeFileSync(`${out}/${name}-定位书目.json`,JSON.stringify({books:selected.map(b=>({book_id:b.id,title:b.title,author:b.author,authorVersion:b.authorVersion||null,version:b.version,sourceFile:b.sourceFile,sourceHash:b.sha256,readingHash:crypto.createHash('sha256').update(JSON.stringify(b.chapters)).digest('hex'),chapters:b.chapters.map(c=>({id:c.id,title:c.title,paragraphs:c.paragraphs.length})),sourceTask:b.sourceTask,revisionAuthor:b.revisionAuthor}))},null,2));
fs.writeFileSync(`${out}/${name}-定位正文.md`,selected.map(b=>`# ${b.title}\n\nbook_id: ${b.id} | version: ${b.version}${b.authorVersion?' | authorVersion: '+b.authorVersion:''} | sourceHash: ${b.sha256}\n\n`+b.chapters.map(c=>`## ${c.id} ${c.title}\n\n`+c.paragraphs.map((p,i)=>`[${c.id}:p${i}] ${p}`).join('\n\n')).join('\n\n')).join('\n\n---\n\n'));
