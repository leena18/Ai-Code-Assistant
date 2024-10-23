import * as vscode from 'vscode';

import { getGlobalState } from '../extension';

interface FixCodeRequest {
    project_name: string;
    instruction: string;
    faulty_code: string;
    user_id:string;
    project_id:string;
}

interface FixCodeResponse {
    fixed_code: string;
}

async function fixCode(request: FixCodeRequest): Promise<FixCodeResponse> {
    const response:any = await fetch("http://127.0.0.1:8000/api/fix-code-instuction/", {
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
    const state = getGlobalState("lask")
    if (editor) {
        const selectedText = editor.document.getText(editor.selection);
        const curr_file_code = editor.document.getText()
        if (selectedText) {
            try {
                // Prepare the request data for fixing the code
                const requestData: FixCodeRequest = {
                    project_name: state["project_id"],
                    instruction: curr_file_code,
                    faulty_code: selectedText,
                    user_id: state["user_id"],
                    project_id: "heart-vb"
                };
                
                // Get the suggested fix
                const response = await fixCode(requestData);
                let suggestedFix = response.fixed_code;

                // Trim unnecessary characters (like ``` at the start and end)
                const lines = suggestedFix.split('\n');
                if (lines[0].startsWith('```')) lines.shift();
                if (lines[lines.length - 1].startsWith('```')) lines.pop();

                const trimmedSuggestedFix = lines.join('\n').trim();
                suggestedFix = trimmedSuggestedFix;

                // Directly apply the fix to the selected code in the editor
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, suggestedFix);
                });

                vscode.window.showInformationMessage('Code fix applied.');
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get a fix from Groq AI.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
}
