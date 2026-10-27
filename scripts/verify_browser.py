"""Optional browser validation: python -m pip install playwright; playwright install chromium."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
import json, sys
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent/'evidence'
out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':1050},device_scale_factor=1)
  errors=[];external=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
  page.goto(base);page.locator('.book-card').first.wait_for()
  assert page.locator('.book-card').count()==6
  page.screenshot(path=str(out/'desktop-shelf.png'),full_page=True)
  results.append('Desktop shelf: 6 cards visible; screenshot saved')
  for book in ['rain','moon','email']:
   page.locator(f'.book-card[href="#read/{book}"]').click()
   expect(page.locator('.prose > p')).to_have_count(7)
   assert page.locator('.comment').count()==6
   assert page.locator('.reply').count()>=2
   page.locator('#font-size').select_option('24')
   assert page.locator('.prose').evaluate('(e)=>getComputedStyle(e).fontSize')=='24px'
   page.locator('.reading-head .button').click()
   assert page.url.endswith('/comments')
   page.locator('[data-quote="0"]').click()
   assert page.locator('.prose .highlight').count()==1
   assert page.locator('.prose .highlight').evaluate('(e)=>e.getBoundingClientRect().top')<1050
   page.locator('.reader-top a').first.click()
   page.locator('.book-card').first.wait_for()
   assert page.locator('.book-card').count()==6
   results.append(f'{book}: reader, 7 paragraphs, 6 comments, replies, 24px font, comments jump, quote highlight, home navigation PASS')
  page.goto(base+'#read/moon');page.locator('.prose').wait_for()
  page.screenshot(path=str(out/'desktop-reader.png'),full_page=True)
  page.locator('.reader-top a').last.click();page.wait_for_url('**/#read/email');assert page.url.endswith('email')
  page.goto(base+'#about');expect(page.locator('.about')).to_have_count(1)
  page.goto(base+'#read/missing');expect(page.locator('main')).to_contain_text('找不到这本书')
  results.append('Next story, about page, invalid-book fallback PASS')
  for width in [360,390,768,1024,1440]:
   page.set_viewport_size({'width':width,'height':844})
   for route in ['','#read/rain','#read/moon/comments','#about']:
    page.goto(base+route)
    page.wait_for_function("document.querySelector('main').innerText.length > 0")
    page.wait_for_timeout(100)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),f'Overflow at {width} {route}'
   results.append(f'No horizontal overflow at {width}px: shelf / reader / comments / about')
  page.set_viewport_size({'width':390,'height':844})
  page.goto(base);page.screenshot(path=str(out/'mobile-shelf.png'),full_page=True)
  page.locator('.book-card').first.click()
  page.locator('.reading-head .button').click()
  assert page.locator('.comments').is_visible()
  page.screenshot(path=str(out/'mobile-reader.png'),full_page=True)
  touch=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
  touch.goto(base)
  touch.locator('.book-card').first.tap()
  touch.locator('.reading-head .button').tap()
  expect(touch.locator('.comments')).to_be_visible()
  touch.locator('[data-quote="0"]').tap()
  expect(touch.locator('.prose .highlight')).to_have_count(1)
  touch.close()
  page.emulate_media(reduced_motion='reduce')
  assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='auto'
  assert not errors,errors
  assert not external,external
  results.append('Mobile touch-sized navigation, reduced motion, JS console, zero external requests PASS')
  browser.close()
finally:server.shutdown()
report={'browser':'Chromium / Playwright','results':results,'console_errors':errors,'external_requests':external}
(out/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
