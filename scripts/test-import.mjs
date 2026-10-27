import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {catalog} from '../catalog.js';
const script=resolve('scripts/import-library.mjs');const dir=mkdtempSync(join(tmpdir(),'bookhouse-import-'));
try{
 const originalPath=join(dir,'original.md');const paragraph='甲乙丙丁戊己庚辛壬癸'.repeat(310);writeFileSync(originalPath,paragraph);
 const book={id:'fixture',title:'导入测试数据（非作品）',author:'test',version:'v1',sourceTask:'fixture',sourceFile:'original.md',originalPath,chapters:[{id:'fixture-1',title:'测试',paragraphs:[paragraph]}]};
 const run=batch=>{writeFileSync(join(dir,'batch.json'),JSON.stringify(batch));return spawnSync(process.execPath,[script,join(dir,'batch.json')],{cwd:dir,encoding:'utf8'});};
 const reset=()=>{writeFileSync(join(dir,'catalog.js'),'sentinel');writeFileSync(join(dir,'import-manifest.json'),JSON.stringify({sources:[]}));};
 const unchanged=()=>assert.equal(readFileSync(join(dir,'catalog.js'),'utf8'),'sentinel');
 reset();assert.notEqual(run({books:[{...book,chapters:[{id:'fixture-1',title:'x',paragraphs:['伪造正文'.repeat(1000)]}]}]}).status,0);unchanged();
 reset();assert.notEqual(run({books:[{...book,chapters:[{id:'fixture-1',title:'x',paragraphs:[paragraph.slice(0,10)]}]}]}).status,0);unchanged();
 reset();assert.notEqual(run({books:[book,{...book,id:'fixture-copy'}]}).status,0);unchanged();
 const b=catalog.find(b=>b.id==='tide');const r=b.perspectives.programmer;
 const reviewPath=join(dir,'review.json');writeFileSync(reviewPath,JSON.stringify(r));
 reset();assert.notEqual(run({reviews:[{...r,book_id:b.id,role:'critic',version:'wrong-version',originalPath:reviewPath}]}).status,0);unchanged();
 reset();assert.notEqual(run({reviews:[{...r,sourceHash:'0'.repeat(64),book_id:b.id,role:'critic',originalPath:reviewPath}]}).status,0);unchanged();
 const bad={...r,chapterId:'absent'};writeFileSync(reviewPath,JSON.stringify(bad));
 reset();assert.notEqual(run({reviews:[{...bad,book_id:b.id,role:'critic',originalPath:reviewPath}]}).status,0);unchanged();
 reset();const ok=run({books:[book]});assert.equal(ok.status,0,ok.stderr);
 const parsed=JSON.parse(readFileSync(join(dir,'catalog.js'),'utf8').replace(/^export const catalog = /,'').replace(/;\s*$/,''));
 assert.equal(parsed.find(b=>b.id==='fixture').chapters[0].paragraphs[0],paragraph);
 console.log('Importer rejects fabricated/short bodies and stale/broken reviews before writing; valid manuscript preserves text PASS');
}finally{rmSync(dir,{recursive:true,force:true});}
