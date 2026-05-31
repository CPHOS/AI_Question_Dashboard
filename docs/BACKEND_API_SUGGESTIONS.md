# 后端 API 改进建议（面向 Web 前端）

> 本文档由前端项目 `AI_Question_Dashboard` 在对接 `AI_Question` 后端
> (`docs/api/openapi.json`) 过程中维护，**仅登记当前实现中尚待补齐的端点 / 行为**。

图例：🔴 强烈建议 · 🟡 建议 · 🟢 可选增强

---

## 待办项

### 🟢 在 `AppSettingSpec` 中暴露枚举型设置项的可选值

**现状**：`GET /llm/options` 返回的 `app_settings`（`AppSettingSpec`）只提供
`key` / `type` / `min` / `exclusiveMin`。其中 `latex_compiler_backend` 实际是枚举
（`AppSettingsUpdate` 已约束为 `enum: ["local", "remote"]`），但 spec 仅将其类型标为
`str`，未携带可选值。

**影响**：管理端「应用设置」表单无法从元数据得知这是个枚举，只能在前端**硬编码**
候选值（见 `AdminLLMSettings.tsx` 的 `SETTING_ENUMS`）。今后后端若新增枚举设置或调整
取值，前端需同步改动，存在契约漂移风险。

**建议**：在 `AppSettingSpec` 增加可选字段 `enum?: string[]`（或 `choices`），由后端从
`AppSettingsUpdate` 的字段约束派生。前端已支持读取 `spec.enum` 并优先据此渲染
`Select`，后端补齐后即可移除前端硬编码回退。

```jsonc
// AppSettingSpec（建议增补 enum）
{ "key": "latex_compiler_backend", "type": "str", "enum": ["local", "remote"] }
```

---

## 附：前端契约镜像位置

- TS 类型镜像：`src/api/types.ts`（与 `openapi.json` 对应）。
- 若新增 / 调整端点，请同步更新 `openapi.json`，前端将据此调整
  `types.ts` 与 `api/*.ts` 封装及相关界面。
