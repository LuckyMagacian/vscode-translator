'use strict';
import * as vscode from 'vscode';
import * as Constants from './constants';
import { Utility } from "./utility";
import { AppInsightsClient } from "./appInsightsClient";
import { TranslatorFactory, ITranslationProvider } from './translators';

export class Translator {
    private static outputChannel: vscode.OutputChannel;
    private captureWordStatusBarItem: vscode.StatusBarItem;

    // 翻译缓存
    private static translationCache: Map<string, {
        translation: string;
        timestamp: number;
        provider: string;
    }> = new Map();

    constructor() {
        if (!Translator.outputChannel) {
            Translator.outputChannel = vscode.window.createOutputChannel('Translator');
        }
        this.captureWordStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -999999);
        this.captureWordStatusBarItem.text = Utility.getConfiguration().get(Constants.CaptureWordKey) ? Constants.CaptureWordText : Constants.NotCaptureWordText;
        this.captureWordStatusBarItem.command = 'translator.toggleCaptureWord';
        this.captureWordStatusBarItem.show();
    }

    public async translate() {
        AppInsightsClient.sendEvent('translate');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;

        // 获取要翻译的文本:优先选中文本,否则获取当前单词
        let text = '';
        if (!selection.isEmpty) {
            text = editor.document.getText(selection);
        } else {
            // 获取光标位置的单词
            const wordRange = editor.document.getWordRangeAtPosition(selection.active);
            if (wordRange) {
                text = editor.document.getText(wordRange);
            }
        }

        if (!text || text.trim() === '') {
            vscode.window.showWarningMessage('请先选中要翻译的文本,或将光标放在单词上');
            return;
        }

        await vscode.window.withProgress({
            title: `Translating`,
            location: vscode.ProgressLocation.Notification,
        }, async () => {
            const target = await this.translateText(text);
            if (!target) {
                return;
            }

            // 输出到日志
            Translator.outputChannel.show();
            Translator.outputChannel.appendLine(target);
            Translator.outputChannel.appendLine('\n');
        });
    }

    public async replaceWithTranslation() {
        AppInsightsClient.sendEvent('replaceWithTranslation');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        if (selection.isEmpty) {
            return;
        }
        const text = editor.document.getText(editor.selection);

        await vscode.window.withProgress({
            title: `Replacing with Translation`,
            location: vscode.ProgressLocation.Notification,
        }, async () => {
            const target = await this.translateText(text);
            if (!target) {
                return;
            }
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, target);
            });
        });
    }

    /**
     * 翻译文本 - 根据配置选择翻译服务
     */
    private async translateText(source: string): Promise<string> {
        try {
            const config = Utility.getConfiguration();
            const providerName = config.get<string>(Constants.TranslatorProviderKey, 'siliconflow');

            // 读取缓存配置
            const cacheEnabled = config.get<boolean>(Constants.CacheEnabledKey, true);
            const cacheMaxSize = config.get<number>(Constants.CacheMaxSizeKey, 200);
            const cacheTTLMinutes = config.get<number>(Constants.CacheTTLKey, 30);
            const cacheTTL = cacheTTLMinutes * 60 * 1000; // 转换为毫秒

            // 检查缓存
            const sourceHash = Utility.hash(source);
            const cacheKey = `${providerName}:${sourceHash}`;

            if (cacheEnabled) {
                const cached = Translator.translationCache.get(cacheKey);

                if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
                    Translator.outputChannel.appendLine(`=== Using Translation Provider: ${providerName} (Cached) ===`);
                    Translator.outputChannel.appendLine('');
                    Translator.outputChannel.appendLine(cached.translation);
                    Translator.outputChannel.appendLine('');
                    return cached.translation;
                }
            }

            Translator.outputChannel.appendLine(`=== Using Translation Provider: ${providerName} ===`);
            Translator.outputChannel.appendLine('');

            const translator: ITranslationProvider = TranslatorFactory.create(providerName, config);
            const translation = await translator.translate(source, Translator.outputChannel);

            // 缓存结果
            if (translation && cacheEnabled) {
                Translator.translationCache.set(cacheKey, {
                    translation,
                    timestamp: Date.now(),
                    provider: providerName
                });

                // 清理过期缓存
                this.cleanExpiredCache(cacheTTL);

                // 如果缓存超过最大值，清理最旧的
                if (Translator.translationCache.size > cacheMaxSize) {
                    this.cleanOldestCache(cacheMaxSize);
                }
            }

            return translation;
        } catch (error: unknown) {
            let errorMsg = '翻译初始化失败';
            if (error instanceof Error) {
                errorMsg = `翻译初始化失败: ${error.message}`;
            }
            vscode.window.showErrorMessage(errorMsg);
            Translator.outputChannel.appendLine(`ERROR: Translation Initialization Failed`);
            if (error instanceof Error) {
                Translator.outputChannel.appendLine(error.stack || error.message);
            } else {
                Translator.outputChannel.appendLine(String(error));
            }
            Translator.outputChannel.appendLine('');
            return "";
        }
    }

    /**
     * 清理过期缓存
     */
    private cleanExpiredCache(cacheTTL: number): void {
        const now = Date.now();
        for (const [key, value] of Translator.translationCache.entries()) {
            if ((now - value.timestamp) >= cacheTTL) {
                Translator.translationCache.delete(key);
            }
        }
    }

    /**
     * 清理最旧的缓存（LRU策略）
     */
    private cleanOldestCache(maxSize: number): void {
        const entries = Array.from(Translator.translationCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toDelete = entries.slice(0, entries.length - maxSize);
        for (const [key] of toDelete) {
            Translator.translationCache.delete(key);
        }
    }

    public toggleCaptureWord() {
        AppInsightsClient.sendEvent('toggleCaptureWord');
        if (this.captureWordStatusBarItem.text === Constants.CaptureWordText) {
            this.captureWordStatusBarItem.text = Constants.NotCaptureWordText;
        } else {
            this.captureWordStatusBarItem.text = Constants.CaptureWordText;
        }
        const config = Utility.getConfiguration();
        config.update(Constants.CaptureWordKey, !config.get(Constants.CaptureWordKey), true);
    }

    /**
     * 从缓存中获取翻译结果（供 HoverProvider 使用）
     * @param source 源文本
     * @returns 翻译结果，如果缓存不存在或已过期则返回 undefined
     */
    public static getCachedTranslation(source: string): string | undefined {
        const config = Utility.getConfiguration();
        const providerName = config.get<string>(Constants.TranslatorProviderKey, 'siliconflow');
        const cacheEnabled = config.get<boolean>(Constants.CacheEnabledKey, true);

        if (!cacheEnabled) {
            return undefined;
        }

        const sourceHash = Utility.hash(source);
        const cacheKey = `${providerName}:${sourceHash}`;
        const cached = Translator.translationCache.get(cacheKey);

        if (cached) {
            const cacheTTLMinutes = config.get<number>(Constants.CacheTTLKey, 30);
            const cacheTTL = cacheTTLMinutes * 60 * 1000;

            // 检查缓存是否过期
            if (Date.now() - cached.timestamp < cacheTTL) {
                return cached.translation;
            }
        }

        return undefined;
    }
}