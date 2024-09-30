import * as vscode from 'vscode';
import * as path from 'path';
import { handleWebviewMessage } from '../services/messageHandler'; // Import message handler
import { loadContextData, addContextData } from '../services/contextService'; // Import context handler
import { loadHtml } from '../services/htmlLoader'; // Import HTML loader

export class ChatPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.chatPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))]
        };

        // Load the default chat HTML
        webviewView.webview.html = loadHtml(webviewView.webview, this._extensionUri, 'chat.html');

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await handleWebviewMessage(message, webviewView, this);
        });
    }

    // Method to add a message to the webview
    public addMessageToWebview(sender: string, message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }

    // Load the HTML for the context view
    private _getHtmlForContextView(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'context.html');
    }

    // Load the HTML for the chat view
    private _getHtmlForWebview(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'chat.html');
    }

    // Load the HTML for the context-specific data view
    private _getHtmlForContextviewView(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'contextView.html');
    }

    // Load context data into the webview
    private loadContextData(webview: vscode.Webview) {
        loadContextData(webview);
    }

    // Add context data based on the file list and ID
    public addContextData(fileListId: string, files: string[]) {
        addContextData(fileListId, files);
    }
}

