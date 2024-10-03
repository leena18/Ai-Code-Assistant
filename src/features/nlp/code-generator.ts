import * as vscode from 'vscode';
import { groqChatAPI } from '../../services/groqService'; // Import the common Groq service
import { SuggestionBox } from '../nlp/suggestion'; // Import the SuggestionBox class
import baseURL from '../../baseURL';
import { generateCode, QuestionRequest } from '../../services/apiSerivce';


interface QuestionResponse {
    answer: string;
}



class CodeGenerator {
    private extensionUri: vscode.Uri;
    private lastInsertedCodeRange: vscode.Range | null = null;
    private suggestions: string[] = [];
    private currentSuggestionIndex: number = 0;
    private suggestionBox: SuggestionBox | undefined; // Add SuggestionBox instance
    private activeEditor: vscode.TextEditor | undefined; // Active editor can be undefined


    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
  // Initialize active editor from window
  this.activeEditor = vscode.window.activeTextEditor;

  // Check if active editor is defined
  if (this.activeEditor) {
      this.suggestionBox = new SuggestionBox(this.extensionUri, this.suggestions, this.activeEditor); // Initialize the SuggestionBox
  } else {
      vscode.window.showErrorMessage('No active editor is open. Suggestions cannot be initialized.');
      return; // Exit if no active editor
  }
        vscode.commands.registerCommand('codeGenerator.acceptCode', () => this.acceptCode());
        vscode.commands.registerCommand('codeGenerator.nextSuggestion', () => this.nextSuggestion());
        vscode.commands.registerCommand('codeGenerator.previousSuggestion', () => this.previousSuggestion());
        vscode.commands.registerCommand('codeGenerator.openSuggestionBox', () => this.openSuggestionBox());
    }

    async promptForCodeGeneration(): Promise<void> {
        const prompt = await this.getUserInput('Enter your NLP prompt for code generation');
        if (prompt) {
            await this.generateCode(prompt);
        } else {
            this.showInformationMessage('No prompt provided.');
        }
    }
   

    private async generateCode(prompt: string): Promise<void> {
        try {
            const codePrompt = this.createCodePrompt(prompt);

            const suggestedCode =  await generateCode(codePrompt, 'string');

            console.log('Suggested Code from API:', suggestedCode); // Debug log to check API response
          this.suggestions = this.parseSuggestions(suggestedCode);
            console.log('Parsed Suggestions:', this.suggestions); // Debug log for parsed suggestions
            this.currentSuggestionIndex = 0;

            if (this.suggestions.length > 0) {
                await this.displaySuggestion();
            } else {
                this.showErrorMessage('No valid code generated.');
            }
        } catch (error) {
            console.error('Error from Groq API:', error);
            this.showErrorMessage('Failed to generate code from Lask.AI.');
        }
    }

    private createCodePrompt(prompt: string): string {
        return `
            You are an AI assistant. Your task is to generate code based on the following prompt:
            ${prompt}
            Return only the code without any additional explanation.
        `;
    }

    private async fetchSuggestedCode(codePrompt: string): Promise<string> {
        return await groqChatAPI(codePrompt, 'nlpCode');
    }

    private parseSuggestions(suggestedCode: string): string[] {
        return suggestedCode.split('\n\n').map(s => s.trim()).filter(Boolean); // Trim and filter out empty strings
    }
    

    private cleanCodeResponse(suggestedCodes: string[]): string[] {
        return suggestedCodes.map(suggestedCode => {
            const lines = suggestedCode.split('\n');
            if (lines.length > 0) lines.shift();  // Remove the first line if it exists
            if (lines.length > 0) lines.pop();    // Remove the last line if it exists
            return lines.join('\n').trim();       // Join lines and trim
        });
    }
    

    private async displaySuggestion(): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
           // let suggestion = this.suggestions[this.currentSuggestionIndex];
             
            console.log("suggestions indesx",this.suggestions)
            // Clean the code response
            this.suggestions = this.cleanCodeResponse(this.suggestions);
            console.log("suggestions after cleam",this.suggestions)

            // Create the formatted instructions dynamically
            const extraText = `
    <<<<<<<<<<< Alt+Space: Accept | Alt+] : Next suggestion | Alt+[ : Previous suggestion >>>>>>>
    
    ${this.suggestions}
    
    <<<<<<<<<<< Alt+Shift+s: Open suggestion box >>>>>>>
    `;

            // Insert the extra text with formatted instructions
            await this.insertCodeIntoEditor(extraText);
        } else {
            this.showErrorMessage('No active editor is open.');
        }
    }

    // Method to insert code into the editor line by line
    private async insertCodeIntoEditor(code: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            let position = editor.selection.active;

            // Split the code into lines for line-by-line insertion
            const lines = code.split('\n');

            for (const line of lines) {
                const editSuccessful = await editor.edit(editBuilder => {
                    editBuilder.insert(position, line + '\n');  // Insert the line with a newline
                });

                if (!editSuccessful) {
                    this.showErrorMessage('Failed to insert code into the editor.');
                    return; // Exit if insertion fails
                }

                // Move the cursor down to the next line
                position = position.translate(1, 0);  // Move to the next line
                await this.delay(50); // Adjust the delay for typing effect (if desired)
            }
        } else {
            this.showErrorMessage('No active editor is open.');
        }
    }

    // Delay method for typing effect
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async nextSuggestion(): Promise<void> {
        if (this.suggestions.length > 0) {
            this.currentSuggestionIndex = (this.currentSuggestionIndex + 1) % this.suggestions.length;
            await this.displaySuggestion();
        }
    }

    private async previousSuggestion(): Promise<void> {
        if (this.suggestions.length > 0) {
            this.currentSuggestionIndex = (this.currentSuggestionIndex - 1 + this.suggestions.length) % this.suggestions.length;
            await this.displaySuggestion();
        }
    }

    private openSuggestionBox(): void {
        if (this.suggestions.length > 0) {
            this.suggestionBox.openSuggestionBox(this.suggestions, this.currentSuggestionIndex);
        } else {
            this.showErrorMessage('No suggestions available to display.');
        }
    }

    private async getUserInput(placeHolder: string): Promise<string | undefined> {
        return await vscode.window.showInputBox({
            placeHolder,
            prompt: 'Enter your prompt here',
            value: '',
            ignoreFocusOut: true,
        });
    }

    private showInformationMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    private showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }
}



export default CodeGenerator;