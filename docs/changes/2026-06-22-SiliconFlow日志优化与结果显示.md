---
name: siliconflow-logging-and-display
date: 2026-06-22
status: draft
---

# 变更计划：SiliconFlow 翻译日志优化与结果显示

## 背景

当前 SiliconFlow 翻译器在日志输出和结果显示方面存在不足，需要增强日志信息并确保翻译结果正确显示。

## 变更目标

1. **日志增强**：在日志中增加翻译结果
2. **请求日志**：以 JSON 格式输出完整的 API request
3. **结果显示**：在 VSCode 中正确显示翻译结果（浮动在选中原文上方）

## 变更范围

### 涉及文件

- `src/translators/SiliconFlowTranslator.ts` - 主要修改文件
- `src/extension.ts` - 可能需要调整 Hover Provider
- `src/translator.ts` - 可能需要调整翻译调用逻辑

## 详细变更内容

### 1. 日志增强（SiliconFlowTranslator.ts）

**当前状态**：日志仅包含请求信息，缺少响应结果

**变更内容**：
- 在 `translate()` 方法中，增加响应结果的日志输出
- 日志格式：`[SiliconFlow] Response: ${JSON.stringify(response.data, null, 2)}`
- 位置：API 调用成功后

### 2. API Request 日志（SiliconFlowTranslator.ts）

**当前状态**：请求日志信息不完整

**变更内容**：
- 以 JSON 格式输出完整的 API request
- 包含：url, headers, body
- 日志格式：
```typescript
this.logger.log(`[SiliconFlow] Request:
  URL: ${url}
  Headers: ${JSON.stringify(headers, null, 2)}
  Body: ${JSON.stringify(body, null, 2)}`);
```

### 3. 翻译结果显示（extension.ts + translatorHoverProvider.ts）

**当前状态**：HoverProvider 每次悬停都会触发翻译 API 调用，导致大量无用调用

**变更内容**：
- 修改 HoverProvider 只显示缓存的翻译结果
- 不主动调用翻译 API
- 只有用户手动翻译后，悬停才能看到结果
- 注册 HoverProvider

## 实施步骤

1. 修改 `SiliconFlowTranslator.ts`：
   - ✅ 增加完整的 Request 日志（JSON 格式）
   - ✅ 增加响应结果的日志输出

2. 修改 `translator.ts`：
   - ✅ 添加 `getCachedTranslation()` 静态方法供 HoverProvider 使用

3. 修改 `translatorHoverProvider.ts`：
   - ✅ 只从缓存读取翻译结果
   - ✅ 不主动调用翻译 API
   - ✅ 使用 Markdown 格式显示

4. 修改 `extension.ts`：
   - ✅ 导入并注册 HoverProvider

5. 测试验证：
   - 选中文字触发翻译
   - 检查日志输出是否完整
   - 检查翻译结果是否正确浮动显示

## 风险评估

- 低风险：仅涉及日志输出和显示逻辑调整
- 不影响核心翻译功能

## 预期成果

1. 日志中包含完整的 API request（JSON 格式）
2. 日志中包含翻译结果
3. 翻译结果正确浮动显示在选中文字上方
