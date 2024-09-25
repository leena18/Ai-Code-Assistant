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
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))]
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
            } else if (message.command === 'switchToContext') {
                webviewView.webview.html = this._getHtmlForContextView(webviewView.webview);
            } else if (message.command === 'switchToChat') {
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            }
            else if (message.command === 'switchToContextView') {
                webviewView.webview.html = this._getHtmlForContextviewView(webviewView.webview);
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.js')));

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('chat.css', stylePath.toString());
        htmlContent = htmlContent.replace('chat.js', scriptPath.toString());

        return htmlContent;
    }

    private _getHtmlForContextView(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.js')));

        console.log("Style Path:", stylePath.toString()); // Log the CSS path
    console.log("Script Path:", scriptPath.toString()); // Log the JS path

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('context.css', stylePath.toString());
        htmlContent = htmlContent.replace('context.js', scriptPath.toString());

        return htmlContent;
    }
    private _getHtmlForContextviewView(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.js')));

        console.log("Style Path:", stylePath.toString()); // Log the CSS path
    console.log("Script Path:", scriptPath.toString()); // Log the JS path

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('contextView.css', stylePath.toString());
        htmlContent = htmlContent.replace('contextView.js', scriptPath.toString());

        return htmlContent;
    }

    private addMessageToWebview(sender: string, message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }
}
