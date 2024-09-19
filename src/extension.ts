import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { ContextPanel } from './panels/ContextPanel';
import { CommandRegister } from './features/commandRegister';
import { FollowUpRegister } from './features/followUppRegister';
import { VariableRegister } from './features/variableRegister';

export function activate(context: vscode.ExtensionContext) {
    const commandRegister = new CommandRegister();
    const followUpRegister = new FollowUpRegister();
    const variableRegister = new VariableRegister();

    // Register a command to open the chat panel
    let chatPanelDisposable = vscode.commands.registerCommand('ai-chat.openChat', () => { // Corrected command name
        ChatPanel.createOrShow(context.extensionUri.fsPath);
    });

    // Register a command to open the context panel (or any other panel)
    let contextPanelDisposable = vscode.commands.registerCommand('ai-chat.openContext', () => { // Corrected command name
        ContextPanel.createOrShow(context.extensionUri.fsPath);
    });

    context.subscriptions.push(chatPanelDisposable, contextPanelDisposable);
}

export function deactivate() {}
