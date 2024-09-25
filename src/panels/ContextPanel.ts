import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.contextPanel';
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

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'addFileContext':
                    this.handleAddFileContext();
                    break;
                case 'addCodeBlockContext':
                    this.handleAddCodeBlockContext();
                    break;
                case 'addDirectoryContext':
                    this.handleAddDirectoryContext();
                    break;
                case 'addGitHubRepoContext':
                    this.handleAddGitHubRepoContext();
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.js')));

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('style.css', stylePath.toString());
        htmlContent = htmlContent.replace('context.js', scriptPath.toString());

        return htmlContent;
    }

    private handleAddFileContext() {
        vscode.window.showInformationMessage("File context added.");
        this.postMessageToWebview('File context has been added');
    }

    private handleAddCodeBlockContext() {
        vscode.window.showInformationMessage("Code block context added.");
        this.postMessageToWebview('Code block context has been added');
    }

    private handleAddDirectoryContext() {
        vscode.window.showInformationMessage("Directory context added.");
        this.postMessageToWebview('Directory context has been added');
    }

    private handleAddGitHubRepoContext() {
        vscode.window.showInformationMessage("GitHub repo context added.");
        this.postMessageToWebview('GitHub repo context has been added');
    }

    private postMessageToWebview(message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'showNotification', message });
        }
    }
}
