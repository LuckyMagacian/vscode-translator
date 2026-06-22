"use strict";
import * as vscode from "vscode";

export class Utility {

    public static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("translator");
    }

    /**
     * 生成文本的哈希值（用于缓存键）
     * 使用简单的DJB2哈希算法，生成32位十六进制字符串
     * @param text 要哈希的文本
     * @returns 哈希字符串
     */
    public static hash(text: string): string {
        let hash = 5381;

        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) + hash) + char; // hash * 33 + char
            hash = hash & hash; // Convert to 32bit integer
        }

        // 转换为无符号32位整数
        const unsignedHash = hash >>> 0;

        // 转换为十六进制字符串（8位，补零）
        return unsignedHash.toString(16).padStart(8, '0');
    }
}