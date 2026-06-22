---
name: translation-bubble-decoration
date: 2026-06-22
status: draft
---

# 变更计划：使用 Decoration 实现翻译气泡窗口

## 背景

当前方案 1（InformationMessage）效果不好，翻译结果显示在屏幕右上角，不够直观。需要改为方案 4，使用 Decoration 在选中文字上方渲染一个气泡窗口显示翻译结果。

## 变更目标

1. **气泡显示**：在选中文字上方显示翻译结果气泡
2. **视觉效果**：美观、清晰的气泡样式
3. **自动消失**：翻译结果显示一段时间后自动消失
4. **不干扰编辑**：气泡不影响文本编辑

## 技术方案

### VSCode Decoration API

使用 `vscode.TextEditorDecorationType` 和 `vscode.DecorationOptions` 实现：

```typescript
// 创建装饰类型
const decorationType = vscode.window.createTextEditorDecorationType({
    before: {
        contentText: translation,
        backgroundColor: '#2196F3',
        color: '#FFFFFF',
        border: '1px solid #1976D2',
        borderRadius: '4px',
        margin: '0 0 0 10px',
        fontWeight: 'bold',
    }
});

// 应用装饰
editor.setDecorations(decorationType, [range]);
```

### 气泡样式设计

**位置**：选中文字上方
**样式**：
- 背景色：浅蓝色 (#E3F2FD) 或主题适配
- 文字色：深色 (#1976D2)
- 圆角：4px
- 边框：1px solid #90CAF9
- 内边距：4px 8px
- 最大宽度：限制避免过长

### 自动消失机制

使用定时器，5 秒后自动清除装饰：

```typescript
setTimeout(() => {
    editor.setDecorations(decorationType, []);
    decorationType.dispose();
}, 5000);
```

## 实施步骤

### 1. 在 Translator 类中添加装饰管理

**文件**：`src/translator.ts`

**改动点**：
- 添加静态 `decorationType` 存储
- 添加 `showTranslationBubble()` 方法
- 在 `translate()` 方法中调用气泡显示
- 移除 InformationMessage 显示

### 2. 实现气泡显示方法

```typescript
private showTranslationBubble(
    editor: vscode.TextEditor,
    selection: vscode.Selection,
    translation: string
): void {
    // 清除之前的装饰
    if (Translator.currentDecoration) {
        editor.setDecorations(Translator.currentDecoration, []);
        Translator.currentDecoration.dispose();
    }

    // 创建新的装饰
    const decorationType = vscode.window.createTextEditorDecorationType({
        before: {
            contentText: ` 🌐 ${translation} `,
            backgroundColor: 'rgba(33, 150, 243, 0.15)',
            color: '#1976D2',
            border: '1px solid #90CAF9',
            borderRadius: '3px',
            margin: '0 0 8px 0',
            fontWeight: 'normal',
        }
    });

    // 应用装饰
    editor.setDecorations(decorationType, [selection]);

    // 5秒后自动消失
    setTimeout(() => {
        editor.setDecorations(decorationType, []);
        decorationType.dispose();
    }, 5000);

    Translator.currentDecoration = decorationType;
}
```

### 3. 调整样式适配主题

需要适配 VSCode 的颜色主题（Light/Dark）：

```typescript
// 检测当前主题
const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;

// 根据主题调整颜色
const backgroundColor = isDarkTheme ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)';
const textColor = isDarkTheme ? '#90CAF9' : '#1976D2';
const borderColor = isDarkTheme ? '#42A5F5' : '#90CAF9';
```

### 4. 处理边界情况

- **多次翻译**：清除之前的装饰，避免叠加
- **编辑器切换**：确保装饰只应用在当前编辑器
- **文本变更**：文本变更时清除装饰
- **选区变化**：选区变化时保持装饰（或清除）

## 代码改动清单

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `src/translator.ts` | 新增 | 静态 decorationType 属性 |
| `src/translator.ts` | 新增 | showTranslationBubble() 方法 |
| `src/translator.ts` | 修改 | translate() 方法调用气泡显示 |
| `src/translator.ts` | 移除 | InformationMessage 显示代码 |

## 验证方案

### 测试用例 1：基本显示

1. 选中中文文字
2. 执行翻译命令
3. 观察文字上方是否显示蓝色气泡
4. 检查气泡内容是否为翻译结果
5. 5秒后气泡是否自动消失

### 测试用例 2：多次翻译

1. 选中文字 A，翻译
2. 立即选中文字 B，翻译
3. 观察是否只有文字 B 上方显示气泡（文字 A 的气泡已清除）

### 测试用例 3：主题适配

1. 切换到 Dark 主题，翻译
2. 检查气泡颜色是否适配深色主题
3. 切换到 Light 主题，翻译
4. 检查气泡颜色是否适配浅色主题

### 测试用例 4：长文本

1. 翻译一段长文本
2. 检查气泡是否合理显示（不超出屏幕）
3. 文字是否完整显示或合理截断

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 装饰叠加 | 多次翻译导致多个气泡 | 清除之前的装饰 |
| 性能问题 | 频繁创建/销毁装饰 | 使用静态变量管理 |
| 主题不适配 | 气泡颜色与主题冲突 | 检测主题并调整颜色 |
| 文本变更 | 文本变更后装饰位置错误 | 监听文本变更事件清除装饰 |

## 预期成果

1. 翻译完成后，选中文字上方立即显示蓝色气泡
2. 气泡内容为翻译结果，美观清晰
3. 气泡 5 秒后自动消失
4. 适配 Light/Dark 主题
5. 不影响文本编辑功能

## 执行确认

请确认以上变更计划是否合理，确认后将按计划执行实施。