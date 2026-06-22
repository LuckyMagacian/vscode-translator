'use strict';
import * as vscode from 'vscode';
import { ITranslationProvider } from './ITranslationProvider';

/**
 * 基础翻译类 - 提供公共日志输出功能
 */
export abstract class BaseTranslator implements ITranslationProvider {
    abstract readonly name: string;
    abstract readonly displayName: string;
    abstract translate(source: string, outputChannel?: vscode.OutputChannel): Promise<string>;

    /**
     * 输出日志到OutputChannel
     * @param outputChannel 输出管道
     * @param message 日志消息
     */
    protected log(outputChannel: vscode.OutputChannel | undefined, message: string): void {
        if (outputChannel) {
            outputChannel.appendLine(message);
        }
    }

    /**
     * 输出API响应详情
     * @param outputChannel 输出管道
     * @param title 标题
     * @param data 数据对象
     */
    protected logApiResponse(outputChannel: vscode.OutputChannel | undefined, title: string, data: any): void {
        if (outputChannel) {
            outputChannel.appendLine(`=== ${title} ===`);
            outputChannel.appendLine(JSON.stringify(data, null, 2));
            outputChannel.appendLine('');
        }
    }

    /**
     * 输出错误信息
     * @param outputChannel 输出管道
     * @param title 错误标题
     * @param error 错误对象
     */
    protected logError(outputChannel: vscode.OutputChannel | undefined, title: string, error: unknown): void {
        if (outputChannel) {
            outputChannel.appendLine(`ERROR: ${title}`);
            if (error instanceof Error) {
                outputChannel.appendLine(error.stack || error.message);
            } else {
                outputChannel.appendLine(String(error));
            }
            outputChannel.appendLine('');
        }
    }
}