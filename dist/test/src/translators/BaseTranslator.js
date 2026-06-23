'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTranslator = void 0;
/**
 * 基础翻译类 - 提供公共日志输出功能
 */
class BaseTranslator {
    /**
     * 输出日志到OutputChannel
     * @param outputChannel 输出管道
     * @param message 日志消息
     */
    log(outputChannel, message) {
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
    logApiResponse(outputChannel, title, data) {
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
    logError(outputChannel, title, error) {
        if (outputChannel) {
            outputChannel.appendLine(`ERROR: ${title}`);
            if (error instanceof Error) {
                outputChannel.appendLine(error.stack || error.message);
            }
            else {
                outputChannel.appendLine(String(error));
            }
            outputChannel.appendLine('');
        }
    }
}
exports.BaseTranslator = BaseTranslator;
