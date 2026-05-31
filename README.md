# CPhOS 命题系统 Web 控制台

为 [CPhOS 物理竞赛题全自动生成系统](../AI_Question) 提供的 Web 前端，包含**用户面板**与**管理员面板**，用于提交命题任务、实时跟踪 AI 命题工作流（命题→解题→四路审核→仲裁→排版）的节点级进度，并管理用户、访问 token 与 LLM 配置。

## 技术栈

- **React 18 + Vite + TypeScript**（单页应用 SPA）
- **Ant Design 5** UI 组件库（内置 zh-CN / en-US 语言包）
- **TanStack Query v5**（任务状态查询、缓存与 SSE 缓存合并）
- **React Router v6** 路由
- **axios** HTTP 客户端（统一注入 Bearer token、统一错误码本地化）
- **i18next**（中 / 英国际化）+ 明 / 暗主题
- **KaTeX**（公式预览）、**react-syntax-highlighter**（LaTeX 源码高亮）、**react-markdown**（仲裁报告）

## 功能

### 用户面板
- 提交命题任务：文本输入（topic / source_material / difficulty / total_score / mode）或上传源材料文件（`POST /api/tasks/upload`）。
- 任务列表与详情，支持服务端过滤 / 搜索 / 排序。
- **实时进度（SSE 优先）**：详情页订阅 `GET /api/tasks/{id}/events`（`text/event-stream`），阶段事件直接合并进查询缓存并显示「实时」标记；SSE 不可用、出错或被服务端按最长存活时间关闭时，自动回退到轮询（`queued/running` 每 3s，终态停止）。
- **工作流可视化**：依阶段顺序展示流水线（Steps）+ 阶段事件时间线，按阶段类型渲染结构化产出（规划笔记 / 题干 / 解答 / 四路审核意见 / 仲裁裁决与重试计数 / 排版统计 / 模板报告）。
- **任务操作**：取消运行中任务（`/cancel`）、重跑失败 / 中止任务（`/retry`）。
- 结果区：最终 LaTeX 源码（高亮 + 复制 + 下载）、PDF 内嵌预览、**按需编译 / 重新编译 PDF**（`/compile`，无需 LLM）、仲裁报告、KaTeX 公式速览、单文件下载与**打包 zip 下载**。

### 管理员面板
- **统计概览**（`/admin/stats`）：任务总数、按状态分组计数、用户数、有效 token 数。
- **用户管理**：创建 / 列表（服务端搜索）/ 编辑标签 / 查看用户详情（token、任务计数）/ 查看指定用户任务 / 删除。
- **Token 管理**：签发（**一次性明文**强制复制提示）、按用户过滤、服务端搜索、吊销。
- **全部任务**跨用户视图（过滤 / 搜索 / 排序）。
- **LLM 配置**（`/admin/llm`）：服务商、模型配置、Agent 角色绑定、应用设置四个标签页；服务商类型与应用设置项均由后端元数据（`provider-kinds` / `options`）动态驱动。

### 鉴权
登录采用「粘贴不透明 token」方式：提交后调用 `GET /api/me` 校验并获取身份（`user_id` / `role` / `label`），据此区分普通用户与管理员。token 存于 `localStorage`，请求统一注入 `Authorization: Bearer`，全局 401 自动登出。

### 错误处理与健康
- 后端 4xx（422 除外）返回稳定的 `{ code, detail }` 错误体；前端按 `code` 本地化提示（`errors.*`，覆盖 `task_not_terminal` / `final_latex_missing` / `compile_in_progress` 等业务码），未知码回退到后端 `detail`。
- 页脚展示后端 `name vX · license`（`/version`）与组件级健康指示灯（`/health`，Tooltip 显示 db / worker 等明细）。

## 本地开发

> 需要 Node.js ≥ 18。

```bash
npm install
cp .env.example .env     # 按需修改
npm run dev              # http://localhost:5173
```

开发服务器将 `/api`、`/health`、`/version` 代理到 `VITE_DEV_PROXY_TARGET`（默认 `http://localhost:8000`），无需后端开启 CORS。

### 环境变量（开发）

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_API_BASE_URL` | API 基址；留空则用同源相对路径 `/api`（配合 nginx 反代） | 空 |
| `VITE_DEV_PROXY_TARGET` | 开发 server 代理 `/api`、`/health`、`/version` 的目标 | `http://localhost:8000` |

### 环境变量（Docker 运行/部署）

| 变量 | 说明 | 默认 |
|------|------|------|
| `BACKEND_URL` | nginx 反代 `/api`、`/health`、`/version` 等路径的后端地址 | `http://backend:8000` |
| `VITE_API_BASE_URL` | 注入前端 JS 的 API 基址；留空则使用同源相对路径（经 nginx 反代） | 空 |
| `BASE_PATH` | 子目录部署路径，如 `/ai-question`；留空则部署在根路径 `/` | 空 |

## 构建

```bash
npm run build      # tsc -b 类型检查 + vite 打包，产物输出到 dist/
npm run preview    # 本地预览构建产物
npm run lint       # ESLint
npm run format     # Prettier 格式化 src
```

## Docker 部署

### 镜像结构

多阶段构建：Node 构建 SPA → nginx 托管静态资源并反代 `/api`、`/health`、`/version`、`/docs` 等路径到后端。同一镜像通过**运行时占位符替换**支持任意子目录部署，无需重新构建。

```
容器内:
  /usr/share/nginx/html/     ← Vite 构建产物 (dist/)
  /etc/nginx/conf.d/         ← nginx 配置 (含 ${BACKEND_URL} 模板)
  /docker-entrypoint.d/      ← 启动脚本 (运行时替换占位符 + envsubst)
```

### 一键启动（API + Dashboard）

> 在**前端仓库根目录**执行。一个 `.env` 文件覆盖前后端全部配置。

```bash
# 1. 复制并编辑环境文件（一份文件涵盖 api 和 dashboard 全部可配项）
cp compose.prod.env.example .env
# 编辑 .env，必填项：
#   - ADMIN_BOOTSTRAP_TOKEN   (python -c "import secrets; print(secrets.token_urlsafe(32))")
#   - OPENROUTER_API_KEY      (LLM 服务商密钥)
#   其余有默认值，按需修改

# 2. 一键启动
docker compose up -d

# 3. 访问 http://localhost  (或 http://localhost:<AIQ_WEB_PORT>)
```

### 仅构建 Dashboard 镜像

```bash
docker build -t ai-question-dashboard .

# 运行（需已有后端在运行）
docker run -p 8080:80 -e BACKEND_URL=http://host.docker.internal:8000 ai-question-dashboard
```

### 子目录部署

当需要将前端挂在前置 nginx（如 `https://example.com/ai-question/`）下时：

**方案 A（推荐）：前置 nginx 裁剪前缀**

```nginx
# 外部 nginx
location /ai-question/ {
    proxy_pass http://127.0.0.1:8080/;   # 末尾 / 裁剪前缀
}
```
此时 `BASE_PATH` 留空，容器内始终收到 `/` 开头的请求，无需额外配置。

**方案 B：容器自带子目录**

设置运行环境变量 `BASE_PATH=/ai-question`，容器启动脚本会将构建产物中所有路径引用替换为该前缀：

```bash
docker run -p 8080:80 -e BACKEND_URL=http://api:8000 -e BASE_PATH=/ai-question ai-question-dashboard
```

访问 `http://localhost:8080/ai-question/`。此时前置 nginx 不要裁剪前缀：

```nginx
location /ai-question/ {
    proxy_pass http://127.0.0.1:8080/ai-question/;
}
```

> 技术细节：构建时 Vite 在产物中写入占位符 `/__BASE_PATH__/`（`assets/__BASE_PATH__/index-xxx.js` 等）；运行时 `docker-entrypoint.sh` 将占位符替换为实际路径。React Router 同步使用 `import.meta.env.BASE_URL` 设置 `basename`。`VITE_API_BASE_URL` 采用相同机制（占位符 `__API_BASE__`）。

## 目录结构

```
src/
├─ api/          # axios client(含错误码本地化) + openapi 镜像类型(types.ts)
│                # + 端点封装: tasks / admin / system + SSE 客户端(sse.ts)
├─ auth/         # AuthContext(token + /api/me 身份) + ProtectedRoute
├─ theme/        # 明暗主题 Context
├─ i18n/         # i18next 配置 + zh/en 词条(含 errors.* / health.*)
├─ hooks/        # useTasks(查询 + useTaskEvents SSE 合并)
├─ utils/        # phase(阶段顺序/终态判定) / format / download
├─ components/
│  ├─ layout/    # AppLayout(含版本/健康页脚) + Header 控件(主题/语言/登出)
│  ├─ common/    # StatusTag / ModeTag / ClippedText
│  └─ task/      # WorkflowTimeline / PhaseOutputCard / ReviewPanel /
│                # ArbitrationCard / ResultViewer / ArtifactList /
│                # KatexScratchpad / TaskTable
└─ pages/
   ├─ user/      # Dashboard / NewTask / TaskList / TaskDetail
   └─ admin/     # AdminStats / AdminUsers / AdminTokens /
                 # AdminAllTasks / AdminUserTasks / AdminLLMSettings
```

## 后端对接说明

类型定义镜像自 `AI_Question/docs/api/openapi.json`，位于 `src/api/types.ts`，后端接口变更时需同步更新类型、`api/*.ts` 封装及相关界面。

针对前端体验提出的**后端 API 改进建议**见 [`docs/BACKEND_API_SUGGESTIONS.md`](docs/BACKEND_API_SUGGESTIONS.md)（当前所有建议均已被后端采纳）。
