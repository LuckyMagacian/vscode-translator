---
name: hover-provider-duplicate-translation
description: 分析HoverProvider导致翻译重复调用的问题
type: analysis
---

# 翻译重复调用分析报告

## 问题现象

用户选中文本"输出API响应详情"执行翻译时，日志显示同一文本被发送了4-5次翻译请求，用户认为"翻译未能完成"。

实际观察：
```
=== Using Translation Provider: siliconflow === (第1次)
=== SiliconFlow Translation Request ===
Source: 输出API响应详情
=== SiliconFlow Translation API Response ===
{
  "content": "Output API response details"  ← 翻译成功
}

=== Using Translation Provider: siliconflow === (第2次)
=== SiliconFlow Translation Request ===
Source: 输出API响应详情
...重复多次...
```

## 根因分析

### 核心问题：HoverProvider 自动触发翻译

**代码路径分析**：

1. **扩展激活** ([extension.ts:10](src/extension.ts#L10))
   ```typescript
   context.subscriptions.push(vscode.languages.registerHoverProvider('*', new TranslatorHoverProvider()));
   ```
   - 注册了全局 HoverProvider，监听所有文档类型

2. **悬停触发** ([translatorHoverProvider.ts:9-16](src/translatorHoverProvider.ts#L9-L16))
   ```typescript
   public async provideHover(document: TextDocument, position: Position): Promise<Hover> {
       if (Utility.getConfiguration().get(Constants.CaptureWordKey)) {
           const source = document.getText(document.getWordRangeAtPosition(position));
           if (source) {
               const translator = new Translator();
               const target = await translator['translateText'](source);  ← 每次悬停都调用
               return new Hover(target || "");
           }
       }
   }
   ```
   - 每次鼠标悬停事件都会触发翻译
   - 没有缓存机制，同一位置重复悬停会重复翻译

3. **用户手动触发** ([translator.ts:22-59](src/translator.ts#L22-L59))
   ```typescript
   public async translate() {
       const text = editor.document.getText(selection);
       await this.translateText(text);
   }
   ```
   - 用户执行命令时也会调用 translateText

### 问题链条

```
用户选中"输出API响应详情" → 执行翻译命令(第1次请求)
↓
鼠标悬停在选中位置 → HoverProvider触发(第2-4次请求)
↓
每次悬停都创建新的Translator实例 → 无缓存，重复API调用
↓
翻译结果返回到Hover提示框 → 用户看不到OutputChannel中的结果
↓
用户误以为"翻译未完成"
```

### 影响评估

| 维度 | 影响 |
|------|------|
| **API成本** | 同一文本多次调用，浪费API资源 |
| **性能** | 频繁网络请求，降低响应速度 |
| **用户体验** | 误以为翻译失败，实际成功但结果在Hover中 |
| **代码耦合** | HoverProvider直接调用翻译逻辑，职责不清 |

## 解决方案建议

### 方案1：添加翻译缓存（推荐）

**改动点**：
- 在 Translator 中添加静态缓存 Map
- 缓存最近翻译结果（key: sourceText, value: translation）
- 设置缓存过期时间（避免翻译更新问题）

**优点**：
- 减少重复API调用
- HoverProvider和手动翻译共享缓存
- 对现有逻辑改动小

### 方案2：禁用HoverProvider自动翻译

**改动点**：
- HoverProvider改为只显示已有翻译结果
- 不主动调用翻译API

**优点**：
- 避免HoverProvider导致的重复调用
- 减少不必要的API成本

**缺点**：
- Hover提示功能变弱（需要先手动翻译）

### 方案3：分离Hover和手动翻译逻辑

**改动点**：
- HoverProvider使用独立的轻量级翻译逻辑
- 手动翻译保持现有流程
- 添加翻译状态标记，避免同一文本同时被多处调用

**优点**：
- 职责分离，逻辑清晰
- 可针对不同场景优化

**缺点**：
- 需要更多代码改动

## 推荐实施路径

**优先级：方案1（添加缓存）**

**实施步骤**：
1. 在 Translator 类添加静态缓存
2. translateText 方法优先检查缓存
3. HoverProvider 从缓存读取，避免重复调用
4. 添加配置项控制缓存大小和过期时间

## 验证方法

1. 选中同一文本多次悬停，观察日志是否只有一次API请求
2. 手动翻译后，Hover提示应立即显示缓存结果
3. 修改源文本后，应触发新的翻译请求

## 相关代码位置

- [src/extension.ts:10](src/extension.ts#L10) - HoverProvider注册
- [src/translatorHoverProvider.ts:9-16](src/translatorHoverProvider.ts#L9-L16) - 自动触发逻辑
- [src/translator.ts:90-115](src/translator.ts#L90-L115) - translateText方法
- [src/translators/SiliconFlowTranslator.ts:31-107](src/translators/SiliconFlowTranslator.ts#L31-L107) - 翻译执行