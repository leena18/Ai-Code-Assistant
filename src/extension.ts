import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';

export function activate(context: vscode.ExtensionContext) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );
}

export function deactivate() {}
