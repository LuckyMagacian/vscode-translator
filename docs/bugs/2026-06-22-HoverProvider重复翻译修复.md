---
name: hover-provider-duplicate-fix
date: 2026-06-22
type: bug-fix
---

# HoverProvider重复翻译修复计划

## 问题概述

**问题描述**：HoverProvider每次鼠标悬停都会触发翻译API调用，没有缓存机制，导致同一文本被重复翻译多次。

**影响**：
- 浪费API资源（同一文本可能被翻译4-5次）
- 降低响应速度
- 用户误以为翻译失败

## 修复目标

1. 添加翻译缓存机制，避免重复API调用
2. HoverProvider优先从缓存读取，减少不必要的翻译请求
3. 保持现有功能不变，只优化性能

## 修复方案

### 核心设计：静态翻译缓存

在 `Translator` 类中添加静态缓存：

```typescript
private static translationCache: Map<string, {
    translation: string;
    timestamp: number;
    provider: string;
}> = new Map();
```

### 缓存策略

| 参数 | 值 | 说明 |
|------|-----|------|
| 缓存键 | `provider:text` | 包含提供商和文本 |
| 缓存过期 | 30分钟 | 避免长期缓存导致翻译更新问题 |
| 最大缓存数 | 100条 | 避免内存占用过大 |

### 实施步骤

#### 1. 修改 `Translator` 类

**文件**：`src/translator.ts`

**改动点**：
- 添加静态缓存Map
- `translateText` 方法优先检查缓存
- 缓存命中时直接返回，不调用API
- 缓存未命中时调用API并缓存结果
- 添加缓存清理逻辑（过期清理 + LRU清理）

#### 2. 优化 `TranslatorHoverProvider`

**文件**：`src/translatorHoverProvider.ts`

**改动点**：
- 不改动（自动从缓存受益）
- 缓存命中时立即返回，无网络延迟

#### 3. 添加配置项（可选）

**文件**：`package.json` + `src/constants.ts`

**配置项**：
- `translator.cacheEnabled`：是否启用缓存（默认true）
- `translator.cacheTTL`：缓存过期时间（默认30分钟）

## 代码改动清单

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `src/translator.ts` | 新增 | 静态缓存Map |
| `src/translator.ts` | 修改 | translateText方法添加缓存逻辑 |
| `src/translator.ts` | 新增 | 缓存清理方法 |

## 验证方案

### 测试用例1：缓存命中

1. 选中"输出API响应详情"执行翻译（触发API调用）
2. 鼠标悬停在同一位置（应从缓存读取，无API调用）
3. 检查日志：只有一次API请求

### 测试用例2：缓存过期

1. 翻译文本A
2. 等待30分钟后再次悬停
3. 应触发新的API调用

### 测试用例3：不同提供商

1. 使用有道翻译文本A
2. 切换到硅基流动翻译
3. 再次翻译文本A（应触发新API调用，缓存键不同）

## 回退策略

如果缓存导致问题，可以通过配置项禁用：
```json
{
    "translator.cacheEnabled": false
}
```

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 缓存污染 | 翻译错误被缓存 | 设置过期时间，提供清除缓存命令 |
| 内存占用 | 大量缓存占用内存 | 限制最大缓存数，LRU清理 |
| 翻译更新 | 源文本变化但缓存未更新 | 基于文本内容生成缓存键 |

## 执行确认

请确认以上修复计划是否合理，确认后将按计划执行修复。

**确认项**：
- [ ] 缓存策略是否合理
- [ ] 是否需要添加配置项
- [ ] 是否需要添加"清除缓存"命令