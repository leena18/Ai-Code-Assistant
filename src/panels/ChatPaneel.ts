import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionPath: string;

    private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
        this.panel = panel;
        this.extensionPath = extensionPath;

        // Set the webview's HTML content
        this.update();
    }

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // Create the new panel or show the existing one
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel.panel.reveal(column);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'chatPanel',
                'LASK.ai Chat',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))],
                }
            );

            ChatPanel.currentPanel = new ChatPanel(panel, extensionPath);
        }
    }

    private update() {
        this.panel.webview.html = this.getHtmlForWebview();
    }

    private getHtmlForWebview() {
        const htmlPath = path.join(this.extensionPath, 'src', 'views', 'chatPanel.html');
        const cssUri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'src', 'views', 'panel.css')));
        
        let html = fs.readFileSync(htmlPath, 'utf-8');
        html = html.replace('{{CSS_URI}}', cssUri.toString());

        return html;
    }
}
