# 协作开发

本项目是 Vue 3 + TypeScript + Vite 静态培训网页。需要 Node.js 22.22.2，版本见 `.node-version`。

## 启动与检查

```bash
git clone https://github.com/TopZ2000/fando-training-workshop.git
cd fando-training-workshop
npm ci
npm run dev
```

提交前运行：

```bash
npm run type-check
npm run lint
npm test
npm run format:check
npm run build
```

课程内容主要在 `src/data/courses.ts` 和 `src/data/resources.ts`；页面交互在 `src/App.vue`；设计变量在 `src/styles/tokens.css`。修改课程后，请打开对应步骤确认内容、导航和交付要求。

## 提交与评审

从主分支新建 `codex/改动名称` 分支，每次提交聚焦一个改动，通过 Pull Request 合并。说明修改原因、影响的课程与验证结果。避免在同一时间直接修改线上文件。

## 部署

GitHub 保存开发源码，提交代码不会自动发布到公司服务器。构建产物是 `dist/`，使用公司指定的 Fandow 部署工具发布。部署工具从 README 中的公司教程获取，本仓库不携带服务器密码、私钥或本机部署会话。

线上应用为 `fd-222581/suofou-ai-workshop`。必须保留项目专属 OA 登录校验，更新后验证匿名跳转、登录后访问及发布文件指纹。服务器登记和验收记录见 `docs/validation.md`。

## 文件范围

请勿提交 `.private/`、`.env`、原始聊天、真实业务资料、凭据、`node_modules/` 或构建输出。课堂素材使用已获准的模拟数据；学习记录保存在各自浏览器内，不进入仓库。
