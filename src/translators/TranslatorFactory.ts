'use strict';
import * as vscode from 'vscode';
import { ITranslationProvider } from './ITranslationProvider';
import { SiliconFlowTranslator } from './SiliconFlowTranslator';

/**
 * 翻译器工厂 - 根据配置创建翻译器实例
 */
export class TranslatorFactory {
    /**
     * 创建翻译器实例
     * @param provider 提供商名称（已废弃，保留参数兼容性）
     * @param config VSCode配置
     * @returns 翻译器实例
     */
    static create(provider: string, config: vscode.WorkspaceConfiguration): ITranslationProvider {
        // 读取日志配置
        const enableLog = config.get<boolean>('enableLog', true);

        // 统一使用 SiliconFlow 翻译器
        const apiKey = config.get<string>('siliconflow.apiKey', '');
        const model = config.get<string>('siliconflow.model', 'tencent/Hunyuan-MT-7B');
        const baseUrl = config.get<string>('siliconflow.baseUrl', 'https://api.siliconflow.cn/v1');
        const systemPrompt = config.get<string>('siliconflow.systemPrompt', '');
        const firstLanguage = config.get<string>('firstLanguage', '中文');
        const secondLanguage = config.get<string>('secondLanguage', '英文');

        return new SiliconFlowTranslator(
            apiKey,
            model,
            baseUrl,
            systemPrompt,
            firstLanguage,
            secondLanguage,
            enableLog
        );
    }

    /**
     * 获取所有可用的翻译提供商
     */
    static getAvailableProviders(): Array<{name: string, displayName: string}> {
        return [
            { name: 'siliconflow', displayName: 'AI翻译 (OpenAI-Compatible)' }
        ];
    }
}
