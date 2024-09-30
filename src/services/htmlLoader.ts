import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function loadHtml(webview: vscode.Webview, extensionUri: vscode.Uri, fileName: string): string {
    const htmlPath = vscode.Uri.file(path.join(extensionUri.fsPath, 'media', fileName));
    let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

    const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, 'media', fileName.replace('.html', '.css'))));
    const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, 'media', fileName.replace('.html', '.js'))));

    htmlContent = htmlContent.replace(`${fileName.replace('.html', '.css')}`, stylePath.toString());
    htmlContent = htmlContent.replace(`${fileName.replace('.html', '.js')}`, scriptPath.toString());

    return htmlContent;
}
