import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { ContextPanel } from './panels/ContextPanel';

export function activate(context: vscode.ExtensionContext) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );

    // Register the context panel (optional)
    let contextPanelDisposable = vscode.commands.registerCommand('ai-chat.openContext', () => {
        ContextPanel.createOrShow(context.extensionUri.fsPath);
    });

    context.subscriptions.push(contextPanelDisposable);
}

export function deactivate() {}
