import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Groq API handler
import * as path from 'path';
import * as fs from 'fs';

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
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };

        // Load HTML from external file
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendMessage') {
                const userMessage = message.text;

                try {
                    const response = await groqChatAPI(userMessage, 'general');
                    this.addMessageToWebview('AI', response);
                } catch (error) {
                    vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                    console.error(error);
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
        const scriptPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('style.css', stylePath.toString());
        htmlContent = htmlContent.replace('main.js', scriptPath.toString());

        return htmlContent;
    }

    private addMessageToWebview(sender: string, message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }
}