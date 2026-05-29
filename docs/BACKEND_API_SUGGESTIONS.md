# 后端 API 改进建议（面向 Web 前端）

> 本文档由前端项目 `AI_Question_Dashboard` 在对接 `AI_Question` 后端
> (`docs/api/openapi.json`) 过程中维护，**仅登记当前实现中尚待补齐的端点 / 行为**。

图例：🔴 强烈建议 · 🟡 建议 · 🟢 可选增强

---

## 当前无待办项

截至最新 `openapi.json`，前端所需的后端能力均已具备，**暂无待补齐的 API 或契约问题**。

历次提出的建议均已被后端采纳并由前端接入，包括但不限于：统一错误契约
`ErrorResponse {code, detail}` 与 4xx 声明、SSE 端点的 `text/event-stream` 媒体类型、
用户 / 令牌列表的 `q`/`order` 服务端检索、`/health` 的组件级 `HealthStatus`、
`provider-kinds`/`options` 元数据端点、产物打包下载、任务重跑与按需编译等。

后续如发现新的缺口，将在此文档继续登记。

---

## 附：前端契约镜像位置

- TS 类型镜像：`src/api/types.ts`（与 `openapi.json` 对应）。
- 若新增 / 调整端点，请同步更新 `openapi.json`，前端将据此调整
  `types.ts` 与 `api/*.ts` 封装及相关界面。
