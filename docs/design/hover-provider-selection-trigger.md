---
name: hover-provider-selection-trigger
date: 2026-06-22
type: design
---

# 基于 HoverProvider 的选中后悬停翻译方案设计

## 设计目标

实现"选中后悬停"触发翻译气泡：
1. 用户先选中一段文本
2. 鼠标悬停在选中区域上时，触发翻译并显示气泡
3. 未选中文本时，悬停不触发翻译

## 技术方案

### 核心 API

使用 `vscode.languages.registerHoverProvider` API

### 触发条件判断

在 `provideHover` 方法中：

```typescript
public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<vscode.Hover | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return undefined;
    }

    // 关键：检查是否有选中文本
    const selection = editor.selection;
    if (selection.isEmpty) {
        return undefined;  // 无选中，不触发
    }

    // 检查悬停位置是否在选中区域内
    if (!selection.contains(position)) {
        return undefined;  // 悬停位置不在选中区域，不触发
    }

    // 获取选中的文本
    const selectedText = document.getText(selection);

    // 执行翻译并返回 Hover
    const translation = await this.translateText(selectedText);

    // 创建 Markdown 内容
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**Translation:**\n\n${translation}`);

    return new vscode.Hover(markdown, selection);
}
```

## 实现细节

### 1. 修改 TranslatorHoverProvider

**文件**：`src/translatorHoverProvider.ts`

**改动**：
- 检查 `selection.isEmpty`
- 检查 `selection.contains(position)`
- 直接调用翻译（不依赖缓存）

### 2. 移除 Decoration 方案

**文件**：`src/translator.ts`

**改动**：
- 移除 `showTranslationBubble` 方法
- 移除 `currentDecoration` 属性

### 3. 优化翻译性能

考虑选中长文本的性能问题：
- 添加文本长度限制（建议最多 500 字符）
- 显示翻译进度提示

## 工作流程

```
用户选中文本 → 鼠标悬停在选中区域 → HoverProvider 检查条件
                                           ↓
                                   条件满足（选中 + 位置在选中区域）
                                           ↓
                                   调用翻译 API
                                           ↓
                                   返回 Hover 显示翻译结果
```

## 优势

1. **符合用户习惯**：先选中 → 再悬停查看
2. **精确控制触发**：只在选中区域悬停才触发
3. **原生 UI**：使用 VSCode 原生 Hover UI
4. **性能优化**：避免全文悬停触发大量无用调用

## 实施步骤

1. 修改 `TranslatorHoverProvider`
2. 移除 Decoration 相关代码
3. 测试验证

## 验证方法

1. 选中文本 → 悬停在选中区域 → 应显示翻译气泡
2. 选中文本 → 悬停在未选中区域 → 不应触发
3. 未选中文本 → 随意悬停 → 不应触发
4. 选中长文本 → 应有长度限制提示