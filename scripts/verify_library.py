from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
import json, subprocess, sys
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
catalog=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {catalog} from './catalog.js';import {books} from './data.js';console.log(JSON.stringify({catalog,legacy:books.filter(b=>!catalog.some(c=>c.id===b.id))}))"],cwd=root))
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
results=[];errors=[];external=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':1000})
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':900});page.goto(base)
   expect(page.locator('.book-card')).to_have_count(len(catalog['catalog'])+len(catalog['legacy']))
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   page.screenshot(path=str(out/f'shelf-{width}.png'),full_page=True)
   quotes=0;chapters=0
   for b in catalog['catalog']:
    for c in b['chapters']:
     page.goto(base+f"#serial/{b['id']}/{c['id']}")
     expect(page.locator('.reading-head h1')).to_have_text(b['title']);expect(page.locator('.prose > p')).to_have_count(len(c['paragraphs']))
     expect(page.locator('[aria-current="page"]')).to_have_text(c['title']);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,b['id'],c['id'])
     chapters+=1
    reviews=[r for r in b['perspectives'].values() if r.get('text')]
    for i,r in enumerate(reviews):
     page.locator('.review-quote').nth(i).click()
     expect(page.locator(f"#serial-p-{r['paragraph']}.highlight")).to_contain_text(r['quote'])
     assert f"/{r['chapterId']}/quote/{r['paragraph']}" in page.url
     quotes+=1
    if b['id'] in ['rain','moon','email']:
     page.goto(base+f"#read/{b['id']}");expect(page.locator('.reading-head h1')).to_have_text(b['title']);assert '#serial/' in page.url
   for b in catalog['legacy']:
    page.goto(base+f"#read/{b['id']}");expect(page.locator('.prose > p')).to_have_count(len(b['paragraphs']))
    for i,r in enumerate(b['comments']):
     page.locator('[data-quote]').nth(i).click();expect(page.locator('.prose .highlight')).to_contain_text(r['quote']);quotes+=1
   results.append({'width':width,'catalogWorks':len(catalog['catalog']),'legacyWorks':len(catalog['legacy']),'chaptersChecked':chapters,'quotesChecked':quotes,'overflow':False})
  b=next(b for b in catalog['catalog'] if b['id']=='lamp');c=b['chapters'][0]
  page.goto(base+f"#serial/{b['id']}/{c['id']}");page.locator('#follow').click();page.locator('#serial-p-12').scroll_into_view_if_needed();page.wait_for_timeout(350)
  saved=page.evaluate("JSON.parse(localStorage.getItem('shaoxin-reading-v1')).lamp")
  assert saved['follow'] and saved['paragraph']>0
  page.reload();expect(page.locator('#follow')).to_have_text('取消追更');page.goto(base+'#following');page.get_by_text('继续阅读',exact=True).click();page.wait_for_timeout(300);assert page.evaluate('scrollY')>0
  page.locator('#mark-read').click();page.goto(base+'#following');expect(page.locator('.follow-item')).to_contain_text(f"{len(b['chapters'])-1} 章未读")
  results.append({'readingProgress':'follow/reload/paragraph resume/read-unread PASS'})
  assert not errors,errors;assert not external,external;browser.close()
finally:server.shutdown()
(out/'library-browser-results.json').write_text(json.dumps({'results':results,'console_errors':errors,'external_requests':external},ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))
