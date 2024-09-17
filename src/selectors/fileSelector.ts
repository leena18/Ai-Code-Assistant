import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileSelector {
    static async loadFilesFromWorkspace(chatProvider: any) {
        const files = await vscode.workspace.findFiles('**/*');
        if (files.length > 0) {
            const fileOptions = files.map(file => ({
                label: path.basename(file.fsPath),
                description: file.fsPath,
                fileUri: file
            }));

            const selectedFiles = await vscode.window.showQuickPick(fileOptions, {
                canPickMany: true,
                placeHolder: 'Select files from the current workspace'
            });

            if (selectedFiles && selectedFiles.length > 0) {
                let combinedContext = '';
                for (const file of selectedFiles) {
                    const filePath = file.fileUri.fsPath;
                    try {
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        combinedContext += `\n\n--- Content from ${path.basename(filePath)} ---\n${fileContent}`;
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error reading file: ${filePath}`);
                    }
                }
                chatProvider.addContext(combinedContext);
                vscode.window.showInformationMessage('Context loaded from selected files.');
            }
        } else {
            vscode.window.showErrorMessage('No files found in the current workspace.');
        }
    }

    static async loadFromDirectories(chatProvider: any) {
        const dirUris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            canSelectFolders: true,
            openLabel: 'Select Directories'
        });

        if (dirUris && dirUris.length > 0) {
            let combinedContext = '';
            for (const dirUri of dirUris) {
                const dirPath = dirUri.fsPath;
                try {
                    const dirFiles = fs.readdirSync(dirPath);
                    for (const fileName of dirFiles) {
                        const filePath = path.join(dirPath, fileName);
                        if (fs.statSync(filePath).isFile()) {
                            const fileContent = fs.readFileSync(filePath, 'utf8');
                            combinedContext += `\n\n--- Content from ${path.basename(filePath)} ---\n${fileContent}`;
                        }
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error reading directory: ${dirPath}`);
                }
            }
            chatProvider.addContext(combinedContext);
            vscode.window.showInformationMessage('Context loaded from selected directories.');
        }
    }
}
