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

将 `dist/` 的全部文件上传到任意静态托管服务即可。Hash 路由无需配置服务器重写。当前没有开通公开部署；GitHub 仓库私有，访问需要账号权限。

## 首版内容与交互

- 三篇原创虚构小说：797 / 846 / 828 字（含标点，不含标题），分别展示空泛排比、设定矛盾和情绪套模。
- 编程、文案、编辑、读者四位虚构 AI 角色；每篇六条主评论，总计十八条，另有八条互怼回复。
- 首页书架、小说阅读、预置评论、引用回看高亮、三个字号、下一篇、说明页、无效小说地址回退。
- 手机/桌面响应式排版，语义化导航、键盘焦点、减少动画偏好。

首版小说与评论为原创 AI 虚构演示；新增三部为成员独立供稿；角色不代表真实模型，无真人评论、点赞、热度或实时调用。页面明确标注演示属性。不使用外部 API、分析脚本、Cookie或第三方资源，不收集数据。托管服务自身的访问日志由部署方管理。

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


## 独立新稿与连载（c44fd9d1）

`catalog.js` 登记三部独立新作，不覆盖 `data.js` 首版作品。两篇短篇以单篇完结呈现；《比喻管理局的最后一盏灯》首批三章保持连载中。章节 ID 必须稳定，新章使用新 ID，不能重排或复用旧 ID，否则未读提示会失真。

`serial.js` 实现章节目录、最新章、追更书架、逐段阅读进度、显式标记本章已读、未读章节数和章末催更。进度、追更和催更仅存在本机 localStorage；无跨设备同步，不发送给作者。浏览器禁止存储时降为当前页面会话，并显示提示。阅读记录可在作品侧栏清除，取消追更使用追更按钮，催更可再次点击取消。

每条程序员锐评关联正文版本、原件 SHA256、章节和段落，支持跨章节定位。编辑、评论家、主持人未取得内容时分别显示待补，不拿首版四角色代替。旧 ZIP 与旧背景缺项单列。`import-manifest.json` 保留新稿来源与审校状态：连载交付版已收到，正文与作者原件一致；交付信与入库交付版确认独立审校完成，组长最终验收另计；作者创作时未取得背景与审校者后续补核分开记录。

验证：`npm test` 同时检查首版与新稿完整性；`python3 scripts/verify_serial.py <证据目录>` 覆盖追更和持久化等实际浏览器操作。静态源码入库不等于公网发布，本分支未部署。

## 分批扩库与引用验收

集成续接PR #2，目标为6部基线加14部独立供稿。旧三篇扩写沿用rain/moon/email，不能以章节或改名重计作品。未到原件和三视角评论均显示待补，不把旧文案/读者角色换头像当作新视角。

`scripts/import-library.mjs` 读取归一化批次JSON：`books`项目附只读`originalPath`及catalog字段，`reviews`项目附`book_id`、`role`、`originalPath`、version、chapterId、paragraph（0基）、quote、text、author、source。先校验全部正文段落在原稿中的顺序、至少3000汉字、唯一ID/章节、版本变更、实际评论原件与精确引用，再更新目录及来源清单。不要把梗概、审校记录或未到手的文件路径当正文。导入前由集成人核对段落拆分是否完整，脚本不能判定情节完整性。

`node scripts/library-audit.mjs <报告目录>` 输出二十部四视角矩阵，分别记录实收、篇幅与四视角引用。`npm test`校验所有已收评论的版本/哈希/原句定位；缺评保留待补，不能因测试通过宣称全量验收。最后一批入库后运行构建、浏览器桌面/手机、引用与进度回归。PR合并与公网部署另报。
