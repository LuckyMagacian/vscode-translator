'use strict';
import * as vscode from 'vscode';

/**
 * 翻译服务接口
 */
export interface ITranslationProvider {
    /**
     * 提供商名称(唯一标识)
     */
    readonly name: string;

    /**
     * 提供商显示名称
     */
    readonly displayName: string;

    /**
     * 翻译文本
     * @param source 源文本
     * @param outputChannel 输出管道(可选)
     * @returns 翻译结果
     */
    translate(source: string, outputChannel?: vscode.OutputChannel): Promise<string>;
}
