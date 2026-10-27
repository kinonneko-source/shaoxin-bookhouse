from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
import json,sys,subprocess
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]; out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
expected=int(subprocess.check_output(['node','--input-type=module','-e',"import {catalog} from './catalog.js';import {books} from './data.js';console.log(catalog.length+books.filter(b=>!catalog.some(c=>c.id===b.id)).length)"],cwd=root));results=[];errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base);expect(page.locator('.book-card')).to_have_count(expected);page.screenshot(path=str(out/'desktop-shelf.png'),full_page=True)
  page.goto(base+'#serial/lamp/lamp-1');expect(page.locator('.prose')).to_contain_text('凌晨六点');expect(page.locator('.comment')).to_have_count(4)
  page.locator('#follow').click();page.locator('#serial-p-12').scroll_into_view_if_needed();page.wait_for_timeout(300)
  saved=page.evaluate("JSON.parse(localStorage.getItem('shaoxin-reading-v1')).lamp")
  assert saved['follow'] and saved['paragraph']>0
  page.reload();expect(page.locator('#follow')).to_have_text('取消追更')
  page.goto(base+'#following');expect(page.locator('.follow-item')).to_have_count(1);expect(page.locator('.follow-item')).to_contain_text('3 章未读');page.get_by_text('继续阅读',exact=True).click();page.wait_for_timeout(300)
  assert page.evaluate('window.scrollY')>0
  page.locator('#mark-read').click();page.goto(base+'#following');expect(page.locator('.follow-item')).to_contain_text('2 章未读')
  page.get_by_text('读最新章 →',exact=True).click();expect(page.locator('.reading-head')).to_contain_text('最后一盏灯不负责象征');page.locator('#urge').click();expect(page.locator('#urge-status')).to_contain_text('未发送给作者');page.reload();expect(page.locator('#urge')).to_have_text('已记录催更心愿')
  page.locator('.review-quote').first.click();expect(page.locator('.prose .highlight')).to_contain_text('他很难过');assert page.url.endswith('/quote/1')
  results.append('Follow/reload, paragraph resume, read/unread, latest chapter, urge persistence and cross-chapter quote PASS')
  # Simulate a later catalog release by keeping seen stable IDs while only the first two were read.
  page.evaluate("let s=JSON.parse(localStorage.getItem('shaoxin-reading-v1'));s.lamp.seen=['lamp-1','lamp-2'];localStorage.setItem('shaoxin-reading-v1',JSON.stringify(s))")
  page.reload();page.goto(base+'#following');expect(page.locator('.follow-item')).to_contain_text('1 章未读');results.append('New chapter remains unread with earlier stable chapter IDs PASS')
  for id in ['tide','umbrella']:
   page.goto(base+f'#serial/{id}/{id}-1');expect(page.locator('.prose')).to_be_visible();expect(page.locator('.end-mark')).to_contain_text('全文完');page.locator('.review-quote').first.click();expect(page.locator('.highlight')).to_have_count(1)
  for width in [360,390,768,1440]:
   page.set_viewport_size({'width':width,'height':844})
   for route in ['', '#serial/lamp/lamp-3','#serial/tide/tide-1','#following','#about']:
    page.goto(base+route);page.wait_for_timeout(100);assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,route)
  page.set_viewport_size({'width':390,'height':844});page.goto(base+'#serial/lamp/lamp-3');page.screenshot(path=str(out/'mobile-reader.png'),full_page=True)
  page.locator('#clear-progress').click();page.goto(base+'#following');expect(page.locator('.follow-item')).to_contain_text('3 章未读')
  page.goto(base+'#serial/lamp/lamp-1');page.locator('#follow').click();expect(page.locator('#follow')).to_have_text('加入追更书架');page.reload();expect(page.locator('#follow')).to_have_text('加入追更书架');page.goto(base+'#following');expect(page.locator('.follow-item')).to_have_count(0);results.append('Cancel follow persists after reload and removes shelf entry PASS')
  page.goto(base+'#serial/lamp/nope');expect(page.locator('main')).to_contain_text('找不到这一章')
  blocked=browser.new_context();blocked.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})");bp=blocked.new_page();bp.goto(base+'#serial/lamp/lamp-1');bp.locator('#follow').click();expect(bp.locator('.storage-note')).to_contain_text('存储不可用');bp.goto(base+'#following');expect(bp.locator('.follow-item')).to_have_count(1)
  results.append('Completed stories, mobile widths, clear reading, invalid chapter, unavailable storage PASS')
  assert not errors,errors;browser.close()
finally:server.shutdown()
(out/'serial-browser-results.json').write_text(json.dumps({'results':results,'console_errors':errors},ensure_ascii=False,indent=2));print('\n'.join(results))
