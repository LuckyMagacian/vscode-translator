'use strict';
import axios from "axios";
import * as vscode from 'vscode';
import * as Constants from './constants';
import { Utility } from "./utility";
import { AppInsightsClient } from "./appInsightsClient";

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
        const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(editor.selection);

        await vscode.window.withProgress({
            title: `Translating`,
            location: vscode.ProgressLocation.Notification,
        }, async () => {
            const target = await Translator.translate(text, true);
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
            const target = await Translator.translate(text, true);
            if (!target) {
                return;
            }
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, target);
            });
        });
    }

    public static async translate(source: string, showErrorMessage: boolean = false): Promise<string> {
        try {
            const response = await axios.get(`https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(source)}`);
            const result = response.data;

            // 输出API响应到OutputChannel
            if (Translator.outputChannel) {
                Translator.outputChannel.appendLine('=== Translation API Response ===');
                Translator.outputChannel.appendLine(JSON.stringify(result, null, 2));
                Translator.outputChannel.appendLine('');
            }

            if (!result || !result.translateResult || !Array.isArray(result.translateResult)) {
                const errorMsg = '翻译API返回数据格式异常';
                if (showErrorMessage) {
                    vscode.window.showErrorMessage(errorMsg);
                }
                // 输出错误到OutputChannel
                if (Translator.outputChannel) {
                    Translator.outputChannel.appendLine('ERROR: Invalid API Response Structure');
                    Translator.outputChannel.appendLine(JSON.stringify(result, null, 2));
                    Translator.outputChannel.appendLine('');
                }
                return "";
            }

            return result.translateResult
                .map((translateResult: any) => {
                    if (!translateResult) return '';
                    return translateResult.map((sentence: any) => {
                        return sentence && sentence.tgt ? sentence.tgt : '';
                    }).join('');
                })
                .join('\n');
        } catch (error: unknown) {
            let errorMsg = '翻译请求失败';
            if (error instanceof Error) {
                errorMsg = `翻译请求失败: ${error.message}`;
            }
            if (showErrorMessage) {
                vscode.window.showErrorMessage(errorMsg);
            }
            // 输出错误到OutputChannel
            if (Translator.outputChannel) {
                Translator.outputChannel.appendLine('ERROR: Translation Request Failed');
                Translator.outputChannel.appendLine(error instanceof Error ? error.stack || error.message : String(error));
                Translator.outputChannel.appendLine('');
            }
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