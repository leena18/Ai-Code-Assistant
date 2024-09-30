import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function loadContextData(webview: vscode.Webview) {
    const filePath = path.join(__dirname, 'contextFiles.json');

    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileData);
        webview.postMessage({ command: 'loadContextData', data: jsonData });
    } else {
        vscode.window.showErrorMessage('Context data file not found.');
    }
}

export function addContextData(fileListId: string, files: string[]) {
    const filePath = path.join(__dirname, 'contextFiles.json');

    let jsonData: any = {};
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        jsonData = JSON.parse(fileData);
    }

    jsonData[fileListId] = files;
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4));
    
    vscode.window.showInformationMessage(`Context added for ${fileListId}`);
}
