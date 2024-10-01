import * as vscode from 'vscode';
import { groqChatAPI } from '../../services/groqService'; // Import the Groq service

export class SuggestionBox {
    private extensionUri: vscode.Uri;
    private currentSuggestionIndex: number = 0;
    private activeEditor: vscode.TextEditor; // Declare activeEditor here
    private suggestions: string[]; // Declare suggestions array

    constructor(extensionUri: vscode.Uri, suggestions: string[], editor: vscode.TextEditor) {
        this.suggestions = suggestions;
        this.extensionUri = extensionUri;
        this.activeEditor = editor;  // Store the active editor
        this.currentSuggestionIndex = 0;  // Initialize the index
    }

    async openSuggestionBox(suggestions: string[], currentSuggestionIndex: number): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'suggestionBox',  // Identifies the type of the webview panel
            'Suggestion Box',  // Title of the panel displayed to the user
            vscode.ViewColumn.Beside,  // Display panel beside the active editor
            {
                enableScripts: true,  // Enable JavaScript in the webview
            }
        );

        // Set the current suggestion index
        this.currentSuggestionIndex = currentSuggestionIndex;

        // Generate HTML for the webview
        panel.webview.html = this.getWebviewContent(suggestions);

        // Fetch additional suggestions using Groq service
        const fileContext = this.activeEditor.document.getText(); // Fetch current file content for context
        const generatedSuggestions = await this.generateSimilarSuggestions(suggestions, fileContext);

        // Merge original and generated suggestions
       // const allSuggestions = [...suggestions, ...generatedSuggestions];
        


        // Update the WebView content with both original and generated suggestions
        panel.webview.html = this.getWebviewContent(generatedSuggestions);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'selectSuggestion':
                        this.currentSuggestionIndex = message.index; // Track suggestion index here
                        await this.displaySuggestion(panel, generatedSuggestions);
                        break;
                    case 'insertSuggestion':
                        await this.insertCodeAtCursor(generatedSuggestions[message.index]);
                        break;
                    case 'copySuggestion':
                        await this.copyToClipboard(generatedSuggestions[message.index]);
                        break;
                }
            },
            undefined,
            undefined
        );
    }

    private async generateSimilarSuggestions(suggestions: string[], fileContext: string): Promise<string[]> {
        try {
    // Step 1: Generate Code 1 (Initial Code Snippet)
    const code1Prompt = `
    Suggestions: ${suggestions.join(', ')}
    File Context: ${fileContext}

    Please provide an initial implementation for the given context and suggestions.
    Only return the raw code without any explanation or formatting.
`;
let code1 = await groqChatAPI(code1Prompt, 'nlpCode');

console.log("Code 1:", code1);

// Step 2: Use Code 1 as context for generating Code 2 (Improved/Optimized Version)
const code2Prompt = `
    Based on the following code snippet:
    ${code1}

    Please provide an improved and optimized version of the code. Only return the raw code without any explanation or formatting.
`;
let code2 = await groqChatAPI(code2Prompt, 'nlpCode');

console.log("Code 2:", code2);

// Step 3: Use Code 2 as context for generating Code 3 (Best Practice Solution)
const code3Prompt = `
    Based on the following improved code snippet:
    ${code2}

    Please provide an even more optimized and best practice implementation. Only return the raw code without any explanation or formatting.
`;
let code3 = await groqChatAPI(code3Prompt, 'nlpCode');

console.log("Code 3:", code3);

// Return all three code versions
return [code1, code2, code3];
    
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate suggestions using Groq service');
            console.error('Error calling Groq API:', error);
            return [];
        }
    }
    
    
    // //--document context 
    // -- repo 
    // --hybrid search
    // -- alternate 
    // -- scalinbity, secure code

    private cleanCodeResponse(suggestedCode: string): string {
        const lines = suggestedCode.split('\n');
    
        // Remove the first and last lines
        const cleanedLines = lines.slice(1, -1);
    
        // Join the remaining lines and trim
        return cleanedLines.join('\n').trim();
    }
    

    private getWebviewContent(suggestionsarray: string[]): string {
        // Clean up the suggestions array
        suggestionsarray = suggestionsarray.map(suggestion => this.cleanCodeResponse(suggestion));
    
        console.log("suggestions from web", suggestionsarray);
        
        // Build suggestions HTML, initially hidden to show after the lazy loading delay
        const suggestionsHTML = suggestionsarray.map((suggestion, index) => `
            <div class="suggestion" data-index="${index}" style="display:none;">
                <p><strong>Suggestion ${index + 1}:</strong></p>
                <pre>${suggestion}</pre>
                <button class="insert-btn" data-index="${index}">Insert</button>
                <button class="copy-btn" data-index="${index}">Copy</button>
            </div>
        `).join('');
    
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                }
                .suggestions-container {
                    overflow-y: auto;
                    max-height: 400px;
                }
                .suggestion {
                    margin-bottom: 10px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    position: relative;
                }
                .insert-btn, .copy-btn {
                    position: absolute;
                    top: 10px;
                    right: 60px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    padding: 5px;
                    cursor: pointer;
                    border-radius: 3px;
                }
                .copy-btn {
                    right: 10px;
                    background-color: #008CBA;
                }
                .loader {
                    width: 0;
                    height: 4.8px;
                    display: inline-block;
                    position: relative;
                    background: #FFF;
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                    box-sizing: border-box;
                    animation: animFw 8s linear infinite;
                    margin: 20px auto; /* Center the loader */
                }
                .loader::after,
                .loader::before {
                    content: '';
                    width: 10px;
                    height: 1px;
                    background: #FFF;
                    position: absolute;
                    top: 9px;
                    right: -2px;
                    opacity: 0;
                    transform: rotate(-45deg) translateX(0px);
                    box-sizing: border-box;
                    animation: coli1 0.3s linear infinite;
                }
                .loader::before {
                    top: -4px;
                    transform: rotate(45deg);
                    animation: coli2 0.3s linear infinite;
                }
                @keyframes animFw {
                    0% {
                        width: 0;
                    }
                    100% {
                        width: 100%;
                    }
                }
                @keyframes coli1 {
                    0% {
                        transform: rotate(-45deg) translateX(0px);
                        opacity: 0.7;
                    }
                    100% {
                        transform: rotate(-45deg) translateX(-45px);
                        opacity: 0;
                    }
                }
                @keyframes coli2 {
                    0% {
                        transform: rotate(45deg) translateX(0px);
                        opacity: 1;
                    }
                    100% {
                        transform: rotate(45deg) translateX(-45px);
                        opacity: 0.7;
                    }
                }
            </style>
        </head>
        <body>
            <span class="loader"></span> <!-- New loading spinner -->
            
            <div class="suggestions-container">
                ${suggestionsHTML}
            </div>
            
            <div class="slider-container">
                <button id="prev">Previous</button>
                <button id="next">Next</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
    
                // Lazy loading - wait for 3 seconds before showing suggestions
                setTimeout(() => {
                    // Hide the loader
                    document.querySelector('.loader').style.display = 'none';
                    
                    // Show the suggestions
                    document.querySelectorAll('.suggestion').forEach(suggestion => {
                        suggestion.style.display = 'block';
                    });
                }, 1500); // 3-second delay
    
                // Event listeners for insert and copy buttons
                document.querySelectorAll('.insert-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const index = button.getAttribute('data-index');
                        vscode.postMessage({ command: 'insertSuggestion', index });
                    });
                });
    
                document.querySelectorAll('.copy-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const index = button.getAttribute('data-index');
                        vscode.postMessage({ command: 'copySuggestion', index });
                    });
                });
            </script>
        </body>
        </html>
        `;
    }
    
    
   

    private async insertCodeAtCursor(suggestion: string): Promise<void> {
        // Use the activeEditor passed during construction
        if (this.activeEditor) {
            const position = this.activeEditor.selection.active;
            await this.activeEditor.edit(editBuilder => {

                let code= this.cleanCodeResponse(suggestion);
                editBuilder.insert(position, code);
            });
            vscode.window.showInformationMessage('Suggestion inserted successfully!');
        } else {
            vscode.window.showErrorMessage('No active editor found. Please open a file to insert code.');
        }
    }

    private async copyToClipboard(suggestion: string): Promise<void> {
        await vscode.env.clipboard.writeText(suggestion);
        vscode.window.showInformationMessage('Suggestion copied to clipboard!');
    }

    // Optionally, this method can display the current suggestion
    private async displaySuggestion(panel: vscode.WebviewPanel, suggestions: string[]): Promise<void> {
        if (suggestions[this.currentSuggestionIndex]) {
            const suggestion = suggestions[this.currentSuggestionIndex];
            vscode.window.showInformationMessage(Current Suggestion: ${suggestion});
        } else {
            vscode.window.showErrorMessage('No suggestions available.');
        }
    }
}