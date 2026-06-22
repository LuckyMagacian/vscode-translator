'use strict';
import * as vscode from 'vscode';
import { ITranslationProvider } from './ITranslationProvider';
import { YoudaoTranslator } from './YoudaoTranslator';
import { SiliconFlowTranslator } from './SiliconFlowTranslator';

/**
 * 翻译器工厂 - 根据配置创建翻译器实例
 */
export class TranslatorFactory {
    /**
     * 创建翻译器实例
     * @param provider 提供商名称
     * @param config VSCode配置
     * @returns 翻译器实例
     */
    static create(provider: string, config: vscode.WorkspaceConfiguration): ITranslationProvider {
        switch (provider) {
            case 'youdao':
                return new YoudaoTranslator();

            case 'siliconflow':
                const apiKey = config.get<string>('siliconflow.apiKey', '');
                const model = config.get<string>('siliconflow.model', 'tencent/Hunyuan-MT-7B');
                const baseUrl = config.get<string>('siliconflow.baseUrl', 'https://api.siliconflow.cn/v1');
                const systemPrompt = config.get<string>('siliconflow.systemPrompt', '');
                return new SiliconFlowTranslator(apiKey, model, baseUrl, systemPrompt);

            default:
                // 默认使用有道翻译
                return new YoudaoTranslator();
        }
    }

    /**
     * 获取所有可用的翻译提供商
     */
    static getAvailableProviders(): Array<{name: string, displayName: string}> {
        return [
            { name: 'youdao', displayName: '有道翻译' },
            { name: 'siliconflow', displayName: '硅基流动翻译' }
        ];
    }
}
