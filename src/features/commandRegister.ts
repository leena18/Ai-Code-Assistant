import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; 

export async function commandHandler(commandType: string, args: string = '') {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No code editor is active.');
        return;
    }

    const code = editor.document.getText(editor.selection);

    switch (commandType) {
        case 'explain':
            const explainResponse = await groqChatAPI(`Explain: ${args || code}`, 'explainCode');
            vscode.window.showInformationMessage(`Explanation: ${explainResponse}`);
            break;
        case 'generateCode':
            const generateResponse = await groqChatAPI(`Generate code: ${args}`, 'nlpCode');
            vscode.window.showInformationMessage(`Generated Code: ${generateResponse}`);
            break;
        case 'fix':
            const fixResponse = await groqChatAPI(`Fix code: ${args || code}`, 'fixCode');
            vscode.window.showInformationMessage(`Fixed Code: ${fixResponse}`);
            break;
        default:
            vscode.window.showErrorMessage(`Unknown command: ${commandType}`);
    }
}
