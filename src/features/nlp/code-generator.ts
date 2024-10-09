import * as vscode from 'vscode';
import { groqChatAPI } from '../../services/groqService'; // Import the common Groq service
import { SuggestionBox } from '../nlp/suggestion'; // Import the SuggestionBox class
import baseURL from '../../baseURL';
import { generateCode } from '../../services/apiSerivce';


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
            
            const suggestedCode =  await generateCode(prompt, 'string');

            console.log('Suggested Code from API:', suggestedCode); // Debug log to check API response
            this.suggestions[0] = suggestedCode;
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
            console.log("suggestions index", this.suggestions);
            
            // Clean the code response if necessary
            // this.suggestions = this.cleanCodeResponse(this.suggestions);
            console.log("suggestions after clean", this.suggestions);
    
            // Create the formatted instructions dynamically
            const extraText = `
<<<<<<<<<<< Ctrl+Shift+A: Accept || Alt+] : Next suggestion | Alt+[ : Previous suggestion >>>>>>
    
${this.suggestions[0]}

<<<<<<<<<<<<<<<<<<<<<<<<<<<<< Alt+Shift+s: Open suggestion box >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    `;
    
            // const editSuccess = await editor.edit(editBuilder => {
            //     const position = editor.selection.active; // Get the current cursor position
            //     editBuilder.insert(position, extraText); // Insert the text at the cursor position
            // });
    
            // if (editSuccess) {
            //     const startPos = editor.selection.active; // Position after the insertion
    
            //     // Get the range of the inserted text (start to end)
            //     const start = startPos.with(startPos.line - (extraText.split('\n').length - 1), 0); // Start at the beginning of the inserted text
            //     const end = startPos; // End at the current cursor position
    
            //     // Create a new selection covering the inserted text
            //     editor.selection = new vscode.Selection(start, end);
            // } else {
            //     this.showErrorMessage('Failed to insert the suggestion into the editor.');
            // }
            
            async function insertWithTypingEffect(editor: vscode.TextEditor, extraText: string | any[], delay = 100) {
                const position = editor.selection.active; // Get the current cursor position
            
                for (let i = 0; i < extraText.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, delay)); // Delay between each letter
            
                    await editor.edit(editBuilder => {
                        const charPosition = editor.selection.active; // Current cursor position after each insertion
                        editBuilder.insert(charPosition, extraText[i]); // Insert the next letter
                    });
                }
            
                // After typing is finished, select the inserted text
                const startPos = position; // Position before the typing started
                const endPos = editor.selection.active; // Position after typing is done
            
                // Create a selection from start to end of the inserted text
                const start = startPos.with(startPos.line, startPos.character);
                const end = endPos.with(endPos.line, endPos.character);
            
                editor.selection = new vscode.Selection(start, end); // Set selection to cover the typed text
            }
            
            // Usage
            const editSuccess = await insertWithTypingEffect(editor, extraText, 0);
            
           
            
        } else {
            this.showErrorMessage('No active editor is open.');
        }
    }
    // private async displaySuggestion(): Promise<void> {
    //     const editor = vscode.window.activeTextEditor;
    
    //     if (editor) {
    //         console.log("suggestions index", this.suggestions);
    //         console.log("suggestions after clean", this.suggestions);
    
    //         // Create the formatted instructions dynamically
    //         const extraText = `\n<<<<<<<<<<<<< Ctrl+Shift+A: Accept || Alt+] : Next suggestion | Alt+[ : Previous suggestion >>>>>>>>\n\n${this.suggestions}\n\n<<<<<<<<<<<<<< Alt+Shift+s: Open suggestion box >>>>>>>>>>>>>>>>>>>>>>>>\n`;
    
    //         const delay = 2; // Delay between each character (in milliseconds)
    //         let position = editor.selection.active; // Get the current cursor position
    
    //         // Insert the text character by character
    //         const insertCharacterByCharacter = async () => {
    //             for (let i = 0; i < extraText.length; i++) {
    //                 const char = extraText[i];
    
    //                 // Insert the character at the current cursor position
    //                 await editor.edit(editBuilder => {
    //                     editBuilder.insert(position, char);
    //                 });
    
    //                 // If the character is a newline, move the cursor to the next line
    //                 if (char === '\n') {
    //                     position = new vscode.Position(position.line + 1, 0); // Move to the next line, column 0
    //                 } else {
    //                     // Move the cursor forward by 1 character for normal characters
    //                     position = position.translate(0, 1); // Move the position right by 1 character
    //                 }
    
    //                 // Wait for the specified delay before inserting the next character
    //                 await this.delay(delay);
    //             }
    //         };
    
    //         // Call the function to insert characters one by one
    //         await insertCharacterByCharacter();
    //     } else {
    //         this.showErrorMessage('No active editor is open.');
    //     }
    // }
    
    // // Helper function to create a delay
    // private delay(ms: number): Promise<void> {
    //     return new Promise(resolve => setTimeout(resolve, ms));
    // }
    
    

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

    private  acceptCode(): string|undefined {
        // Split the code into lines
        const editor:any = vscode.window.activeTextEditor;

        
            const selection = editor.selection; // Get the current selection
            const selectedCode = editor.document.getText(selection); // Get the selected text
            
        
        const lines = selectedCode.trim().split('\n');
    
        // Check if there are enough lines to remove the first and last
        if (lines.length <= 2) {
            return ''; // Return empty string if there are 2 or fewer lines
        }
    
        // Return the lines excluding the first and last
        const acceptedCode = lines.slice(1, -1).join('\n');

        editor.edit((editBuilder: string) => {
            // Replace the selected text with an empty string
            editBuilder.replace(selection, acceptedCode);
        })
        
        
    }


    private showInformationMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    private showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }
}



export default CodeGenerator;