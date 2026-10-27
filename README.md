# 烧心书屋

静态AI文学讽刺书屋：成员供稿，程序员、编辑、评论家、原创纪录片主持人四种视角据原文逐书评论。所有人物与评述角色均为AI原创虚构，不代表真人名家或真实产品；没有实时模型调用、真人评论、点赞或虚构热度。

仓库：https://github.com/kinonneko-source/shaoxin-bookhouse （私有）。本任务接续PR #2，扩库PR #3；未执行PR合并或公网部署。

## 运行和构建

Python 3提供本地HTTP服务，Node.js 18+用于校验和构建，应用无npm依赖。

```sh
python3 -m http.server 4173 --bind 127.0.0.1
npm test
npm run build
```

浏览器打开 http://127.0.0.1:4173 。ES模块需HTTP环境，不能直接双击index.html。dist为静态托管产物，Hash路由无需重写；源码入库和本地构建不等于公网发布。

## 书目、版本与追更

目标为六部基线加十四部独立供稿。catalog.js是当前书目；rain/moon/email扩写v2沿用同一book_id，替换首版演示展示，不累加作品数。data.js保留首版历史，旧read链接重定向到当前扩写。章节不计独立作品，《比喻管理局的最后一盏灯》三章仍为一部连载。

version是精确阅读版本标识。作者元数据未声明版本时以snapshot-源文件SHA前12位标识快照，并在background说明。作者后补版本仅登记authorVersion及证据，正文哈希不变时保留已发读稿定位，避免无谓使已核评论失效；不把快照冒充作者版本。每条评论保留原件哈希、原文sourceHash、版本、chapterId、0基paragraph及精确quote。

serial.js提供章节目录、上一章/下一章、最新章、追更书架、逐段恢复、显式已读、未读计数和本机催更。章节ID须稳定，新章用新ID，不重排复用。进度、追更和催更只在当前浏览器localStorage中保存，不同步、不上传，催更不会通知作者；可取消和清除阅读记录。存储受限时降为本次页面会话。

## 分批导入和验收

```sh
node scripts/import-library.mjs normalized-batch.json
node scripts/library-audit.mjs /absolute/report/directory
node scripts/verify-sources.mjs /absolute/report/directory /workspace/inbox
node scripts/export-reading.mjs /absolute/report/directory --all
```

归一化批次books项目提供catalog字段和只读originalPath；reviews提供book_id、role、originalPath、version、chapterId、paragraph（0基）、quote、text、author、source，另可附原文sourceHash和readingHash。先校验全部输入，再写目录和来源清单：正文段落须逐字按序存在于原稿，至少3000汉字；作品ID/正文/章节不能重复；替换已有作品须变更版本；评论须实际出现在供评原件，版本/哈希/引用须与当前正文相符。集成人另实际阅读全文核对情节完整性，不以字数或梗概替代。

library-audit输出20×4矩阵：实收到稿、篇幅和四视角引用分开，待收行仅为名额，未收到的作品或评述不代填。verify-sources从本任务归一化批次追溯只读原件，校验原件全文件SHA与所有正文段落无遗漏一致，核对评论原件快照。export-reading只导出正文与版本定位输入，不含他人评述。原件不复制到别的任务目录。

## 浏览器回归

需要Python Playwright及Chromium。本工作台运行库示例：

```sh
LD_LIBRARY_PATH=/workspace/.cache/browser-libs/usr/lib/x86_64-linux-gnu python3 scripts/verify_library.py /absolute/evidence
LD_LIBRARY_PATH=/workspace/.cache/browser-libs/usr/lib/x86_64-linux-gnu python3 scripts/verify_serial.py /absolute/evidence
node scripts/test-import.mjs
node scripts/check-release.mjs
```

check-release是全量验收闸门，要求至少20部、旧三篇v2、每部四条不重复的实质评述及准确版本引用；缺原件时会失败，不能用普通npm test通过替代。

verify_library从实际书目逐书逐章检查桌面与手机、全部已交评论引用、旧链接、追更和恢复；verify_serial覆盖未读、新章、催更、无效章节、清除进度和存储受限降级。verify_browser是首版历史六卡演示的回归脚本，不用于扩库终验。Chromium模拟视口不等于真实iOS Safari/Android全机型认证。

不使用统计脚本、Cookie、外部字体、第三方API或访客数据收集。托管服务自身的访问日志由部署方管理。
