import * as vscode from 'vscode';

// Function to remove comments from the selected code
export function removeCommentsFromSelection() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        // Remove comments from the selected code
        const uncommentedText = removeComments(text);

        // Replace the selected text with the uncommented text
        editor.edit(editBuilder => {
            editBuilder.replace(selection, uncommentedText);
        });
    }
}

// Function to remove comments from a given code string
function removeComments(code: string): string {
    // Regular expression to match single-line and multi-line comments
    const singleLineCommentRegex = /\/\/.*(?=\n)/g;
    const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;

    // Remove single-line comments
    code = code.replace(singleLineCommentRegex, '');

    // Remove multi-line comments
    code = code.replace(multiLineCommentRegex, '');

    // Optionally, you can also remove excess whitespace
    code = code.replace(/\s{2,}/g, ' ').trim();

    return code;
}
