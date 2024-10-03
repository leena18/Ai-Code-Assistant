import * as vscode from 'vscode';
import  baseURL  from '../baseURL';


interface FixCodeRequest {
    project_name: string;
    instruction: string;
    faulty_code: string;
}

interface FixCodeResponse {
    fixed_code: string;
}

async function fixCode(request: FixCodeRequest): Promise<FixCodeResponse> {
    const response:any = await fetch(baseURL+'/fix-code-instuction/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${errorDetail.detail}`);
    }

    return response.json();
}



export async function handleFixCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
                // Use the shared service with the 'fixCode' command
                const requestData: FixCodeRequest = {
                    project_name: "string",
                    instruction: "",
                    faulty_code: selectedText
                };
                const response = await fixCode(requestData)
                let suggestedFix = response.fixed_code;

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
