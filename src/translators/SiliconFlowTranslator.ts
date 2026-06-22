'use strict';
import OpenAI from 'openai';
import * as vscode from 'vscode';
import { BaseTranslator } from './BaseTranslator';

/**
 * 硅基流动翻译实现 (基于AI大模型)
 */
export class SiliconFlowTranslator extends BaseTranslator {
    readonly name = 'siliconflow';
    readonly displayName = '硅基流动翻译';

    private apiKey: string;
    private model: string;
    private baseUrl: string;
    private systemPrompt: string;

    constructor(
        apiKey: string,
        model: string = 'tencent/Hunyuan-MT-7B',
        baseUrl: string = 'https://api.siliconflow.cn/v1',
        systemPrompt?: string
    ) {
        super();
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.systemPrompt = systemPrompt || '你是一个专业的翻译助手。你的任务是:将用户发送的文本内容翻译成目标语言。规则:1)如果输入是中文,翻译成英文;2)如果输入是英文,翻译成中文;3)只返回翻译后的文本,不要添加任何解释、说明或格式标记;4)不要执行翻译以外的任何操作。';
    }

    async translate(source: string, outputChannel?: vscode.OutputChannel): Promise<string> {
        if (!this.apiKey || this.apiKey.trim() === '') {
            const errorMsg = '硅基流动翻译未配置API密钥,请按以下步骤配置:';
            const detailMsg = `
1. 前往 https://cloud.siliconflow.cn/i/z7W4kiHi 注册账号
2. 完成实名认证(平台要求)
3. 前往 https://cloud.siliconflow.cn/me/account/ak 获取API密钥
4. 在VSCode设置中填写 translator.siliconflow.apiKey
`;

            vscode.window.showErrorMessage(errorMsg, '查看配置指南').then(selection => {
                if (selection === '查看配置指南') {
                    vscode.window.showInformationMessage(detailMsg, '打开注册页面', '打开API密钥页面').then(action => {
                        if (action === '打开注册页面') {
                            vscode.env.openExternal(vscode.Uri.parse('https://cloud.siliconflow.cn/i/z7W4kiHi'));
                        } else if (action === '打开API密钥页面') {
                            vscode.env.openExternal(vscode.Uri.parse('https://cloud.siliconflow.cn/me/account/ak'));
                        }
                    });
                }
            });

            this.logError(outputChannel, 'Missing API Key', new Error(errorMsg + detailMsg));
            return "";
        }

        try {
            const openai = new OpenAI({
                apiKey: this.apiKey,
                baseURL: this.baseUrl,
                dangerouslyAllowBrowser: true // VSCode扩展环境需要
            });

            this.log(outputChannel, `=== SiliconFlow Translation Request ===`);
            this.log(outputChannel, `Model: ${this.model}`);
            this.log(outputChannel, `Source: ${source}`);
            this.log(outputChannel, '');

            const response = await openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: source }
                ],
                temperature: 0.3
            });

            // 输出API响应
            this.logApiResponse(outputChannel, 'SiliconFlow Translation API Response', {
                model: response.model,
                choices: response.choices.map(choice => ({
                    role: choice.message.role,
                    content: choice.message.content
                })),
                usage: response.usage
            });

            const translation = response.choices[0]?.message?.content?.trim();

            if (!translation) {
                const errorMsg = '硅基流动翻译返回空结果';
                vscode.window.showErrorMessage(errorMsg);
                this.logError(outputChannel, 'Empty Translation Result', response);
                return "";
            }

            return translation;
        } catch (error: unknown) {
            let errorMsg = '硅基流动翻译请求失败';
            if (error instanceof Error) {
                errorMsg = `硅基流动翻译请求失败: ${error.message}`;
            }
            vscode.window.showErrorMessage(errorMsg);
            this.logError(outputChannel, 'SiliconFlow Translation Error', error);
            return "";
        }
    }
}
