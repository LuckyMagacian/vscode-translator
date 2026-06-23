'use strict';
import { Hover, HoverProvider, Position, TextDocument, MarkdownString } from 'vscode';
import * as vscode from 'vscode';
import * as Constants from './constants';
import { Translator } from './translator';
import { Utility } from './utility';

export class TranslatorHoverProvider implements HoverProvider {

    public async provideHover(document: TextDocument, position: Position): Promise<Hover | undefined> {
        // 检查是否启用 CaptureWord
        if (!Utility.getConfiguration().get(Constants.CaptureWordKey)) {
            return undefined;
        }

        // 获取当前编辑器
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

        // 文本长度限制（建议最多 500 字符）
        if (selectedText.length > 5000) {
            const markdown = new MarkdownString();
            markdown.appendMarkdown(`**Warning:** Selected text is too long (${selectedText.length} characters). Maximum is 5000 characters.`);
            return new Hover(markdown, selection);
        }

        // 执行翻译（不使用缓存，直接翻译）
        const translation = await this.translateText(selectedText);

        if (!translation) {
            return undefined;
        }

        // 创建 Markdown 内容显示翻译结果
        const markdown = new MarkdownString();
        // 将换行符转换为 Markdown 的换行（两个空格 + \n）
        const formattedTranslation = translation.replace(/\n/g, '  \n');
        markdown.appendMarkdown(`**Translation:**\n\n${formattedTranslation}`);

        return new Hover(markdown, selection);
    }

    /**
     * 翻译文本
     * @param text 要翻译的文本
     * @returns 翻译结果
     */
    private async translateText(text: string): Promise<string | undefined> {
        try {
            const translator = new Translator();
            // 调用 Translator 的私有方法 translateText
            return await (translator as any).translateText(text);
        } catch (error) {
            console.error('Translation failed:', error);
            return undefined;
        }
    }
}