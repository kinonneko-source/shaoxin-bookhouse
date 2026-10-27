import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','style.css','app.js','data.js'])await copyFile(f,`dist/${f}`);
console.log('Built 4 static assets into dist/');
