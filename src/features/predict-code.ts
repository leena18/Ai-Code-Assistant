import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Import the common Groq service

// Decoration type for showing gray-colored text as suggestion
const suggestionDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        color: '#888888', // Gray color for the suggestion
        margin: '0 0 0 10px' // Add a margin for clarity
    }
});

// Store the last suggestion to insert later
let lastSuggestion: string | null = null;

// Automatically show code suggestions
export function activateCodeSuggestionListener() {
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.activeTextEditor;

        if (editor && event.document === editor.document) {
            const currentLineText = editor.document.lineAt(editor.selection.active.line).text.trim();

            // Fetch the predicted code based on the current line using Groq API
            lastSuggestion = await getPredictedCodeSuggestion(currentLineText);

            if (lastSuggestion) {
                // Apply the gray suggestion decoration
                const position = editor.selection.active;
                const range = new vscode.Range(position, position);
                editor.setDecorations(suggestionDecorationType, [{
                    range,
                    renderOptions: { after: { contentText: lastSuggestion } }
                }]);
            } else {
                // Clear decorations if no suggestion is found
                editor.setDecorations(suggestionDecorationType, []);
            }
        }
    });

    // Handle key events
    vscode.commands.registerCommand('insertCodeSuggestion', () => {
        const editor = vscode.window.activeTextEditor;

        if (editor && lastSuggestion) {
            const position = editor.selection.active;
            editor.edit(editBuilder => {
                editBuilder.insert(position, lastSuggestion);
            });
            // Clear the suggestion after inserting
            editor.setDecorations(suggestionDecorationType, []);
            lastSuggestion = null; // Reset last suggestion
        }
    });
}

// Function to get the predicted code suggestion using Groq API
export async function getPredictedCodeSuggestion(currentLine: string): Promise<string | null> {
    try {
        // Prompt template for predicting the next line of code
        const predictionPromptTemplate = `
        You are an AI code assistant. Predict the next logical line of code based on the current code. Do not include any textual description; provide only suitable code:
        
        ${currentLine}
    
        Next line of code:
    `;
    

        const chatCompletion = await groqChatAPI(predictionPromptTemplate, 'nlpCode');

        let predictedCode = chatCompletion; // Adjust based on your service response structure

        // Generalized trimming for the first line and last line (removing ```language at start and ``` at end)
        const lines = predictedCode.split('\n');

        // Check if the first line starts with ```
        if (lines[0].startsWith('```')) {
            lines.shift(); // Remove the first line
        }

        // Check if the last line is ```
        if (lines[lines.length - 1].startsWith('```')) {
            lines.pop(); // Remove the last line
        }

        // Join the remaining lines back into a single string
        const trimmedPredictedCode = lines.join('\n').trim();

        return trimmedPredictedCode || null;
    } catch (error) {
        console.error('Failed to get the next line suggestion from Groq API:', error);
        return null;
    }
}
