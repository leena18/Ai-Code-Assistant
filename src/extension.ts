import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { commandHandler } from './features/commandRegister';
import { handleAddCommentsCommand } from './features/comment';
import { handleFixCode } from './features/fix-code';
import CodeGenerator from './features/nlp/code-generator';
import { activateCodeSuggestionListener } from './features/predict-code';
import { removeCommentsFromSelection } from './features/removeComments';

let global: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );

    global = context;

    global.globalState.update('lask', { "project_id": "", "user_id": "" });


    const codeGenerator = new CodeGenerator(context.extensionUri);
    activateCodeSuggestionListener();

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

    // Comment feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.addComments', handleAddCommentsCommand)
    );

    // Fix code feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.fixCode', handleFixCode)
    );

    // NLP code generation feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.nlpGenerateCode', async () => {
            codeGenerator.promptForCodeGeneration();
        })
    );

    let disposable = vscode.commands.registerCommand('extension.removeComments', () => {
        removeCommentsFromSelection();
    });


    context.subscriptions.push(disposable);

    vscode.window.registerWebviewViewProvider(ChatPanel.viewType, {
        resolveWebviewView(webviewView: vscode.WebviewView) {
            webviewView.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'getOpenFiles') {
                    const openFiles = vscode.workspace.textDocuments.map(doc => doc.fileName);
                    webviewView.webview.postMessage({ command: 'showOpenFiles', files: openFiles });
                }
            });
        }
    });
}

// Function to get the global state outside activate
export function getGlobalState(key: string): any {
    // Access globalState from the global context
    return global.globalState.get(key);
}
export function updateGlobalState(key: string, value: any) {
    // Access globalState from the global context
    global.globalState.update(key, value);
}


export function deactivate() {

}

