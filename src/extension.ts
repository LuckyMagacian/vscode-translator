'use strict';
import * as vscode from 'vscode';
import { Translator } from './translator';
import { TranslatorHoverProvider } from './translatorHoverProvider';

export function activate(context: vscode.ExtensionContext) {

    const translator = new Translator();

    context.subscriptions.push(vscode.commands.registerCommand('translator.translate', () => translator.translate()));

    context.subscriptions.push(vscode.commands.registerCommand('translator.replaceWithTranslation', () => translator.replaceWithTranslation()));

    context.subscriptions.push(vscode.commands.registerCommand('translator.toggleCaptureWord', () => translator.toggleCaptureWord()));

    // 注册 HoverProvider，实现悬浮翻译显示
    context.subscriptions.push(vscode.languages.registerHoverProvider('*', new TranslatorHoverProvider()));
}

export function deactivate() {
}