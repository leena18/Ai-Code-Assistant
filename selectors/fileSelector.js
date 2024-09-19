const vscode = require('vscode');
const ContextManager = require('./contextManager');

async function loadFilesFromWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        let context = '';
        for (const folder of workspaceFolders) {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*'));
            for (const file of files) {
                const document = await vscode.workspace.openTextDocument(file);
                context += `\nFile: ${file.path}\nContent:\n${document.getText()}`;
            }
        }
        ContextManager.addContext(context);
        vscode.window.showInformationMessage('File context added.');
    } else {
        vscode.window.showInformationMessage('No workspace folders found.');
    }
}

module.exports = { loadFilesFromWorkspace };
