import * as vscode from 'vscode';
import { generateComments } from '../services/apiSerivce'; // Adjust the path to your API service file



export async function handleAddCommentsCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
                // Use the groqChatAPI service to generate code with comments
                const commentedCode = await generateComments(selectedText);

                // Generalized trimming to remove any unnecessary lines (like ``` tags)
                const lines = commentedCode.split('\n');
                if (lines[0].startsWith('```')) lines.shift();
                if (lines[lines.length - 1].startsWith('```')) lines.pop();

                const trimmedCommentedCode = lines.join('\n').trim();

                // Replace the selected code directly with the commented code
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, trimmedCommentedCode);
                });

                vscode.window.showInformationMessage('Comments added to code.');
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get comments from Groq API.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
}

