import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Adjust the path to your Groq service file

export async function handleAddCommentsCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
              

                // Use the groqChatAPI service to generate code with comments
                const commentedCode = await groqChatAPI(selectedText, 'addComments');

                // Generalized trimming to remove any unnecessary lines (like ``` tags)
                const lines = commentedCode.split('\n');
                if (lines[0].startsWith('```')) lines.shift();
                if (lines[lines.length - 1].startsWith('```')) lines.pop();

                const trimmedCommentedCode = lines.join('\n').trim();

                // Show the commented code in a popup for the user to Accept or Reject
                const action = await vscode.window.showInformationMessage(
                    `Code with suggested comments:\n${trimmedCommentedCode}`,
                    'Accept', 'Reject'
                );

                if (action === 'Accept') {
                    editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, trimmedCommentedCode);
                    });
                    vscode.window.showInformationMessage('Comments added to code.');
                } else {
                    vscode.window.showInformationMessage('Comment suggestion rejected.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get comments from Groq API.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
}
