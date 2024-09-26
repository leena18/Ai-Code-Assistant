import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Import the common Groq service

export async function handleFixCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
                // Use the shared service with the 'fixCode' command
                let suggestedFix = await groqChatAPI(selectedText, 'fixCode');

                // Trimming unnecessary characters (like ``` at the start and end)
                const lines = suggestedFix.split('\n');
                if (lines[0].startsWith('```')) lines.shift();
                if (lines[lines.length - 1].startsWith('```')) lines.pop();

                const trimmedSuggestedFix = lines.join('\n').trim();
                suggestedFix = trimmedSuggestedFix;

                // Show popup with suggested fix
                const action = await vscode.window.showInformationMessage(
                    `Suggested fix:\n${suggestedFix}`,
                    'Accept', 'Reject'
                );

                if (action === 'Accept') {
                    // Apply the fix in the editor
                    editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, suggestedFix);
                    });
                    vscode.window.showInformationMessage('Code fix applied.');
                } else {
                    vscode.window.showInformationMessage('Code fix rejected.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get a fix from Groq AI.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
}
