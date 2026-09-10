# FanDo AI 实操工作坊

面向索否管理层的四节培训网页。第一版为公司内部评审及讲师投屏用途。

已上线：[打开培训工作坊](https://app.fandow.top/fd-222581/suofou-ai-workshop/)。需公司 OA 登录。发布登记已回读确认，验证细节见 `docs/validation.md`。

多人开发请先阅读 [协作说明](CONTRIBUTING.md)。源码提交与线上发布分开执行。

源码仓库：[TopZ2000/fando-training-workshop](https://github.com/TopZ2000/fando-training-workshop)。

## 使用

`release/FanDo-培训工作坊-离线评审版.html` 可直接用浏览器打开，课程脚本、样式和模拟 Word 参考均已内嵌。适用于本机评审及现场投屏备用；线上部署继续使用 `dist/`。离线文件没有 OA 登录功能，不是免鉴权的公网部署。

首页选择课程。每节按“任务目标、知识导入、分步实操、成果交付、分享复盘”推进；分步实操可直接选择任意步骤。右侧计时器可设为 1—180 分钟。顶部可开启讲师提示及全屏。非输入状态下可用左右方向键翻页。

资料库提供模拟 Q3 讨论稿、补充稿、原 Word 参考和检查提纲。实际任务在 FanDo 或已授权办公渠道执行。本页不录音、不读取业务文件、不启动 AI 或定时任务。

自检与成果笔记仅保存在当前浏览器的 localStorage，存储键为 `fando-workshop-progress-v1`。刷新后恢复，清除浏览器数据会删除。资料库可导出或清空本机记录。数据不跨设备同步，不上传服务器，勾选不等于讲师验收。

## 本地运行

技术栈：Vue 3.5.21、TypeScript 5.9.2、Vite 7.1.5。Node.js 22.22.2，npm 10.9.7；版本见 `.node-version`、`package.json`，依赖锁定于 `package-lock.json`。

```powershell
npm ci --registry=https://registry.npmmirror.com
npm run dev
```

本地入口：`http://127.0.0.1:5173/`。服务只监听本机，端口冲突时明确失败。

```powershell
npm run type-check
npm run lint
npm test
npm run format:check
npm run build
npm run preview
```

生产产物为 `dist/`，入口 `dist/index.html`。预览监听 `127.0.0.1:4173`。相对静态资源路径与 hash 路由支持部署在员工应用子目录。

无应用后端、数据库、队列、API Key、应用环境变量及容器依赖。后端健康检查与数据库迁移不适用。生产由公司静态站点服务器提供服务，OA 鉴权由部署平台执行，不能用前端隐藏按钮替代。

## 内容维护

- `src/data/courses.ts`：四课程、20 个实操步骤、交付标准及讲师提示。
- `src/data/resources.ts`：五份课堂素材、岗位案例。
- `public/materials/Q3-reference.docx`：用户提供的虚构 Q3 工作计划参考。
- `src/App.vue`：页面流程、资料库、记录导出。
- `src/components/CourseTimer.vue`：课堂计时，使用截止时间抵抗浏览器后台节流。
- `src/styles/tokens.css`：视觉规范语义变量。
- `docs/PRD-training-workshop.md`：第一版方案与验收范围。
- `docs/content-decisions.md`：会议修改与网页落点。

课程时间为讲师参考，非实际培训耗时。评分为评议标准，未集成评分服务。循环任务的 48 小时结果需要课后用真实运行记录评价。

## 发布

按用户指定《岛民云服务器空间申请指南-V6》的 `fandow-deploy` 静态分支，仅发布 `dist`。应用名采用 `suofou-ai-workshop`。发布须确认员工工号、交互式 SSH 登录、平台 OA 鉴权、公网页面指纹及项目记录同步；项目记录失败不得声称部署完成。

部署工具从指定飞书教程下载并保存在 `.private/deploy-skill/fandow-deploy/`，不属于网页内容。其 Python 脚本是供应方工具，运行解释器在执行时核验，不混入站点 Node 运行时。

```powershell
python .private/deploy-skill/fandow-deploy/scripts/direct_ssh_static_deploy.py deploy --path ./dist --app suofou-ai-workshop --sudo
```

在可交互终端中执行。工号自动获取失败时按工具提示输入；SSH/sudo 密码只在交互提示里输入。按教程配置真实飞书用户 ID，用于项目记录。不要将密码、令牌、原始聊天、逐字稿或 `.private` 上传到静态站点。

发布器采用原子版本切换及失败回滚。后续更新先构建，复用 lockfile 与本机已安装依赖，仅上传新 `dist`。源码修改不需要重新安装全部依赖。回滚需使用发布器返回的当前项目 release 信息，禁止猜测路径或操作其他员工项目。

本项目专属 OA 配置为 `/etc/nginx/lightdeploy-locations/per-app/fd-222581-suofou-ai-workshop.conf`。必须保留该配置，现有通用静态路由不能替代它的登录校验。项目记录 ID 为 1842；更新时按工号和项目名匹配已有记录，不重复创建。
