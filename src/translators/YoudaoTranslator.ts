'use strict';
import axios from 'axios';
import * as vscode from 'vscode';
import { BaseTranslator } from './BaseTranslator';

/**
 * 有道翻译实现
 */
export class YoudaoTranslator extends BaseTranslator {
    readonly name = 'youdao';
    readonly displayName = '有道翻译';

    constructor(enableLog: boolean = true) {
        super(enableLog);
    }

    async translate(source: string, outputChannel?: vscode.OutputChannel): Promise<string> {
        try {
            const response = await axios.get(
                `https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(source)}`
            );
            const result = response.data;

            // 输出API响应
            this.logApiResponse(outputChannel, 'Youdao Translation API Response', result);

            // 数据校验
            if (!result || !result.translateResult || !Array.isArray(result.translateResult)) {
                const errorMsg = '有道翻译API返回数据格式异常';
                vscode.window.showErrorMessage(errorMsg);
                this.logError(outputChannel, 'Invalid API Response Structure', result);
                return "";
            }

            // 提取翻译结果
            return result.translateResult
                .map((translateResult: any) => {
                    if (!translateResult) return '';
                    return translateResult.map((sentence: any) => {
                        return sentence && sentence.tgt ? sentence.tgt : '';
                    }).join('');
                })
                .join('\n');
        } catch (error: unknown) {
            let errorMsg = '有道翻译请求失败';
            if (error instanceof Error) {
                errorMsg = `有道翻译请求失败: ${error.message}`;
            }
            vscode.window.showErrorMessage(errorMsg);
            this.logError(outputChannel, 'Youdao Translation Error', error);
            return "";
        }
    }
}
