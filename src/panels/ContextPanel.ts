import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextPanel {
    public static currentPanel: ContextPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionPath: string;

    private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
        this.panel = panel;
        this.extensionPath = extensionPath;
        this.update();
    }

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ContextPanel.currentPanel) {
            ContextPanel.currentPanel.panel.reveal(column);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'contextPanel',
                'LASK.ai Context',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))],
                }
            );

            ContextPanel.currentPanel = new ContextPanel(panel, extensionPath);
        }
    }

    private update() {
        this.panel.webview.html = this.getHtmlForWebview();
    }

    private getHtmlForWebview() {
        const htmlPath = path.join(this.extensionPath, 'src', 'views', 'contextPanel.html');
        return fs.readFileSync(htmlPath, 'utf-8');
    }
}

