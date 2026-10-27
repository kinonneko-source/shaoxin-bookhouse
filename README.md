# 烧心书屋 ♨

一个静态 AI 文学讽刺示例：AI 写刻意暴露写作毛病的原创短小说，四位虚构 AI 评论员逐句拆台。

仓库：https://github.com/kinonneko-source/shaoxin-bookhouse （私有）

## 启动

需要 Python 3；构建与内容校验另需 Node.js 18+。运行应用无需安装 npm 依赖。

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

浏览器打开 http://127.0.0.1:4173 。请通过 HTTP 服务打开，ES 模块不能直接双击 `index.html` 使用。

也可 `npm run dev` 启动同一服务。

```sh
npm test
npm run build
```

将 `dist/` 的四个文件上传到任意静态托管服务即可。Hash 路由无需配置服务器重写。当前没有开通公开部署；GitHub 仓库私有，访问需要账号权限。

## 首版内容与交互

- 三篇原创虚构小说：797 / 846 / 828 字（含标点，不含标题），分别展示空泛排比、设定矛盾和情绪套模。
- 编程、文案、编辑、读者四位虚构 AI 角色；每篇六条主评论，总计十八条，另有八条互怼回复。
- 首页书架、小说阅读、预置评论、引用回看高亮、三个字号、下一篇、说明页、无效小说地址回退。
- 手机/桌面响应式排版，语义化导航、键盘焦点、减少动画偏好。

所有小说和评论均为本项目新写的 AI 生成虚构内容；角色不代表真实模型，无真人评论、点赞、热度或实时调用。页面明确标注演示属性。不使用外部 API、分析脚本、Cookie、浏览器存储或第三方资源，不收集数据。托管服务自身的访问日志由部署方管理。

## 文件

- `data.js`：全部原创正文、角色、评论和回复。每条评论含可在正文找到的原句。
- `app.js`：Hash 路由及阅读交互。
- `style.css`：全部视觉，无外部字体和图片依赖。
- `scripts/check.mjs`：字数范围、评论数量、角色覆盖、引用一致性校验。
- `scripts/verify_browser.py`：可选 Chromium/Playwright 实际浏览器验证与截图。

可选浏览器复验：安装 Python `playwright` 并安装其 Chromium 后执行：

```sh
python3 scripts/verify_browser.py ../evidence
```

本工作台的浏览器运行库位于用户缓存，执行时使用：

```sh
LD_LIBRARY_PATH=/workspace/.cache/browser-libs/usr/lib/x86_64-linux-gnu python3 scripts/verify_browser.py ../evidence
```

浏览器测试是 Chromium 自动化验证，不代表真实 iOS Safari / Android 设备兼容性认证。
