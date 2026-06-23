'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiliconFlowTranslator = void 0;
const openai_1 = __importDefault(require("openai"));
const vscode = __importStar(require("vscode"));
const BaseTranslator_1 = require("./BaseTranslator");
/**
 * 硅基流动翻译实现 (基于AI大模型)
 */
class SiliconFlowTranslator extends BaseTranslator_1.BaseTranslator {
    constructor(apiKey, model = 'tencent/Hunyuan-MT-7B', baseUrl = 'https://api.siliconflow.cn/v1', systemPrompt, firstLanguage = '中文', secondLanguage = '英文') {
        super();
        this.name = 'siliconflow';
        this.displayName = '硅基流动翻译';
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.firstLanguage = firstLanguage;
        this.secondLanguage = secondLanguage;
        // 确定提示词来源并替换占位符
        const promptTemplate = systemPrompt || SiliconFlowTranslator.DEFAULT_PROMPT_TEMPLATE;
        this.systemPrompt = this.replacePromptPlaceholders(promptTemplate);
    }
    /**
     * 替换提示词中的占位符
     * @param prompt 包含占位符的提示词模板
     * @returns 替换后的提示词
     */
    replacePromptPlaceholders(prompt) {
        return prompt
            .replace(/{firstLanguage}/g, this.firstLanguage)
            .replace(/{secondLanguage}/g, this.secondLanguage);
    }
    async translate(source, outputChannel) {
        var _a, _b, _c;
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
                        }
                        else if (action === '打开API密钥页面') {
                            vscode.env.openExternal(vscode.Uri.parse('https://cloud.siliconflow.cn/me/account/ak'));
                        }
                    });
                }
            });
            this.logError(outputChannel, 'Missing API Key', new Error(errorMsg + detailMsg));
            return "";
        }
        try {
            const openai = new openai_1.default({
                apiKey: this.apiKey,
                baseURL: this.baseUrl,
                dangerouslyAllowBrowser: true // VSCode扩展环境需要
            });
            // 准备请求数据
            const messages = [
                { role: 'system', content: this.systemPrompt },
                { role: 'user', content: source }
            ];
            const requestBody = {
                model: this.model,
                messages: messages,
                temperature: 0.3
            };
            // 输出完整的 API Request (JSON 格式)
            this.log(outputChannel, `=== SiliconFlow API Request ===`);
            this.log(outputChannel, JSON.stringify({
                url: `${this.baseUrl}/chat/completions`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            }, null, 2));
            this.log(outputChannel, '');
            const response = await openai.chat.completions.create(requestBody);
            // 输出API响应
            this.logApiResponse(outputChannel, 'SiliconFlow Translation API Response', {
                model: response.model,
                choices: response.choices.map(choice => ({
                    role: choice.message.role,
                    content: choice.message.content
                })),
                usage: response.usage
            });
            const translation = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
            // 输出翻译结果
            this.log(outputChannel, `=== SiliconFlow Translation Result ===`);
            this.log(outputChannel, `Source: ${source}`);
            this.log(outputChannel, `Translation: ${translation}`);
            this.log(outputChannel, '');
            if (!translation) {
                const errorMsg = '硅基流动翻译返回空结果';
                vscode.window.showErrorMessage(errorMsg);
                this.logError(outputChannel, 'Empty Translation Result', response);
                return "";
            }
            return translation;
        }
        catch (error) {
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
exports.SiliconFlowTranslator = SiliconFlowTranslator;
// 默认提示词模板(使用占位符)
SiliconFlowTranslator.DEFAULT_PROMPT_TEMPLATE = '你是一个专业的翻译助手。你的任务是:将用户发送的文本内容翻译成目标语言。规则:1)如果输入是{firstLanguage},翻译成{secondLanguage};2)如果输入不是{firstLanguage},翻译成{firstLanguage};3)只返回翻译后的文本,不要添加任何解释、说明或格式标记;4)不要执行翻译以外的任何操作。';
