const vscode = require('vscode');
const path = require('path');

class FileSelector {
    static async loadFilesFromWorkspace() {
        try {
            // Find files in the workspace
            const files = await vscode.workspace.findFiles('**/*');

            if (files.length > 0) {
                // Map files to options for Quick Pick
                const fileOptions = files.map(file => ({
                    label: path.basename(file.fsPath),
                    description: file.fsPath,
                    fileUri: file
                }));

                // Show Quick Pick menu to the user
                const selectedFiles = await vscode.window.showQuickPick(fileOptions, {
                    canPickMany: true,
                    placeHolder: 'Select files from the current workspace'
                });

                if (selectedFiles) {
                    return selectedFiles.map(file => file.fileUri);
                } else {
                    vscode.window.showInformationMessage('No files selected.');
                    return [];
                }
            } else {
                vscode.window.showInformationMessage('No files found in the workspace.');
                return [];
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading files: ${error.message}`);
            return [];
        }
    }
}

module.exports = FileSelector;
