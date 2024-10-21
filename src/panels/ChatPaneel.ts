import * as vscode from 'vscode';
import * as path from 'path';

import { loadHtml } from '../services/htmlLoader'; // Import HTML loader


export class ChatPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.chatPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))]
        };

        // Load the HTML for the chat view
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen to messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'getOpenedFiles') {
                // Fetch the list of currently opened files in the editor
                const openFiles = vscode.workspace.textDocuments.map(doc => doc.uri.fsPath);
                
                // Send the list of files back to the webview
                webviewView.webview.postMessage({
                    command: 'fileList',
                    files: openFiles
                });
            }
        });
    }

    // Load the HTML file
    private _getHtmlForWebview(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'chat.html');
    }
}