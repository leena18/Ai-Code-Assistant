import * as vscode from 'vscode';
import * as fs from 'fs';

export class HistoryPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.historyPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'webviews', 'history.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'styles', 'style.css'));
        htmlContent = htmlContent.replace('style.css', stylePath.toString());

        return htmlContent;
    }
}

