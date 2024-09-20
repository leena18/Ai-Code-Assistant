import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { commandHandler } from './features/commandRegister'; // Import for handling commands

export function activate(context: vscode.ExtensionContext) {
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.explainCode', () => {
            commandHandler('explainCode');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.fixCode', () => {
            commandHandler('fixCode');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.writeDocstrings', () => {
            commandHandler('writeDocstrings');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.generateTests', () => {
            commandHandler('generateTests');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.exploreCodebase', () => {
            commandHandler('exploreCodebase');
        })
    );
}

export function deactivate() {}
