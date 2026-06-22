'use strict';
import * as vscode from 'vscode';
import * as Constants from './constants';
import { Utility } from "./utility";
import { AppInsightsClient } from "./appInsightsClient";
import { TranslatorFactory, ITranslationProvider } from './translators';

export class Translator {
    private static outputChannel: vscode.OutputChannel;
    private captureWordStatusBarItem: vscode.StatusBarItem;

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
            const providerName = config.get<string>(Constants.TranslatorProviderKey, 'youdao');

            Translator.outputChannel.appendLine(`=== Using Translation Provider: ${providerName} ===`);
            Translator.outputChannel.appendLine('');

            const translator: ITranslationProvider = TranslatorFactory.create(providerName, config);
            return await translator.translate(source, Translator.outputChannel);
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
}