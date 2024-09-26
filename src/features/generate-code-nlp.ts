import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Import the common Groq service

class CodeGenerator {
    private extensionUri: vscode.Uri; // Store the extension URI
    private lastInsertedCodeRange: vscode.Range | null = null; // Store the range of the last inserted code

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    // Prompt the user for code generation input
    async promptForCodeGeneration(): Promise<void> {
        const prompt = await this.getUserInput('Enter your NLP prompt for code generation');
        
        if (prompt) {
            await this.generateCode(prompt);
        } else {
            this.showInformationMessage('No prompt provided.');
        }
    }

    // Generate code based on user prompt
    private async generateCode(prompt: string): Promise<void> {
        try {
            const codePrompt = this.createCodePrompt(prompt);
            const suggestedCode = await this.fetchSuggestedCode(codePrompt);

            console.log("Suggested Code:", suggestedCode);
            const trimmedCode = this.cleanCodeResponse(suggestedCode);

            if (trimmedCode) {
                await this.insertCodeIntoEditor(trimmedCode);
            } else {
                this.showErrorMessage('No valid code generated.');
            }
        } catch (error) {
            console.error('Error from Groq API:', error);
            this.showErrorMessage('Failed to generate code from Lask.AI.');
        }
    }

    // Create the formatted prompt for the code generation API
    private createCodePrompt(prompt: string): string {
        return `
            You are an AI assistant. Your task is to generate code based on the following prompt:
            ${prompt}
            Return only the code without any additional explanation.
        `;
    }

    // Fetch suggested code from the Groq API
    private async fetchSuggestedCode(codePrompt: string): Promise<string> {
        return await groqChatAPI(codePrompt, 'nlpCode');
    }

    // Clean the code response by removing unnecessary characters
    private cleanCodeResponse(suggestedCode: string): string {
        const lines = suggestedCode.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        return lines.join('\n').trim();
    }

    // Insert the cleaned code into the active text editor
   // Insert the cleaned code into the active text editor with a typing effect
private async insertCodeIntoEditor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        let position = editor.selection.active;

        // Insert each character with a delay
        for (const line of code.split('\n')) {
            for (const char of line) {
                const editSuccessful = await editor.edit(editBuilder => {
                    editBuilder.insert(position, char);
                });

                if (!editSuccessful) {
                    this.showErrorMessage('Failed to insert code into the editor.');
                    return; // Exit if insertion fails
                }

                // Move the cursor to the right after inserting a character
                position = position.translate(0, 1);
                
                // Wait a bit before inserting the next character
                await this.delay(50); // Adjust the delay as needed
            }

            // Insert a newline character after each line (except the last one)
            if (line !== code.split('\n').slice(-1)[0]) {
                const editSuccessful = await editor.edit(editBuilder => {
                    editBuilder.insert(position, '\n');
                });

                if (!editSuccessful) {
                    this.showErrorMessage('Failed to insert code into the editor.');
                    return; // Exit if insertion fails
                }

                // Move the cursor down to the next line
                position = position.translate(1, -position.character);
            }
        }

        console.log("Code inserted successfully.");
        this.lastInsertedCodeRange = new vscode.Range(
            editor.selection.active,
            editor.selection.active.translate(0, code.length)
        );
        await this.promptUserForFeedback(code);
    } else {
        this.showErrorMessage('No active editor is open.');
    }
}

// Utility method to introduce a delay
private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


    // Prompt the user for feedback on the generated code
    private async promptUserForFeedback(generatedCode: string): Promise<void> {
        const response = await vscode.window.showInformationMessage(
            'Code has been generated. Do you want to accept, reject, or rephrase it?',
            { modal: true },
            'Accept', 'Reject', 'Rephrase'
        );

        switch (response) {
            case 'Accept':
                this.showInformationMessage('Code accepted.');
                break;
            case 'Reject':
                this.removeLastInsertedCode();
                this.showInformationMessage('Code rejected and removed.');
                break;
            case 'Rephrase':
                const newPrompt = await this.getUserInput('Enter your new prompt for rephrasing the code');
                if (newPrompt) {
                    await this.generateCode(newPrompt);
                }
                break;
        }
    }

    // Utility method to display information messages
    private showInformationMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    // Utility method to display error messages
    private showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    // Utility method to get user input
    private async getUserInput(placeHolder: string): Promise<string | undefined> {
        return await vscode.window.showInputBox({ placeHolder });
    }

    // Placeholder for method to remove last inserted code (to be implemented)
    private removeLastInsertedCode(): void {
        if (this.lastInsertedCodeRange) {
            // Logic to remove the last inserted code
        }
    }
}

export default CodeGenerator;
