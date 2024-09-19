import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; 

export async function commandHandler(commandType: string) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No code editor is active.');
        return;
    }

    const code = editor.document.getText(editor.selection);
    let userMessage = '';

    switch (commandType) {
        case 'explainCode':
            userMessage = `Explain the following code: ${code}`;
            break;
        case 'fixCode':
            userMessage = `Fix the following code: ${code}`;
            break;
        case 'writeDocstrings':
            userMessage = `Write docstrings for the following code: ${code}`;
            break;
        case 'generateTests':
            userMessage = `Generate tests for the following code: ${code}`;
            break;
        case 'exploreCodebase':
            userMessage = `Explore the following codebase: ${code}`;
            break;
        default:
            vscode.window.showErrorMessage('Unknown command.');
            return;
    }

    try {
        const response = await groqChatAPI(userMessage, commandType);
        vscode.window.showInformationMessage(`AI Response: ${response}`);
    } catch (error) {
        vscode.window.showErrorMessage('Error processing the command.');
        console.error(error);
    }
}
