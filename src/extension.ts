import * as vscode from 'vscode';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);

// Access the API key from the environment variable
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''  // Replace directly with the env variable
});

// Data model for chat items
class ChatItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly content: string
    ) {
        super(label, collapsibleState);
    }
}



// Data provider for the sidebar chat view
class ChatProvider implements vscode.TreeDataProvider<ChatItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChatItem | undefined | void> = new vscode.EventEmitter<ChatItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ChatItem | undefined | void> = this._onDidChangeTreeData.event;

    private chatItems: ChatItem[] = [];
    private context: string = '';

    // Refresh the view when new data is added
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;
    }

    getChildren(): ChatItem[] {
        return this.chatItems;
    }

    // Add a new chat message
    addChatMessage(content: string, fromUser: boolean): void {
        const newItem = new ChatItem(
            fromUser ? `You: ${content}` : `AI: ${content}`,
            vscode.TreeItemCollapsibleState.None,
            content
        );
        this.chatItems.push(newItem);
        this.refresh();
    }

    // Add context to the provider
    addContext(context: string): void {
        this.context = context;
    }

    // Get context
    getContext(): string {
        return this.context;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const chatProvider = new ChatProvider();

    // Register the chat view in the sidebar
    vscode.window.registerTreeDataProvider('aiChatbot.sidebar', chatProvider);

    // Command to send a question to the AI
    const askCommand = vscode.commands.registerCommand('aiChatbot.ask', async () => {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Ask the AI chatbot a question',
            placeHolder: 'Type your question here...'
        });

        if (userInput) {
            chatProvider.addChatMessage(userInput, true);  // Add user input to the sidebar

            try {
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: chatProvider.getContext() + '\n' + userInput  // Add context here
                        }
                    ],
                    model: 'llama3-8b-8192',
                    temperature: 1,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: true,
                    stop: null
                });

                let responseText = '';
                for await (const chunk of chatCompletion) {
                    responseText += chunk.choices[0]?.delta?.content || '';
                }

                chatProvider.addChatMessage(responseText, false);  // Add AI response to the sidebar
            } catch (error) {
                vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                console.error(error);
            }
        }
    });

    // Command to load context from a file
    // const loadContextCommand = vscode.commands.registerCommand('aiChatbot.loadContext', async () => {
    //     const fileUri = await vscode.window.showOpenDialog({
    //         canSelectMany: false,
    //         openLabel: 'Open File',
    //         filters: { 'Text Files': ['txt', 'md', 'js', 'ts', 'json'] }
    //     });

    //     if (fileUri && fileUri[0]) {
    //         const filePath = fileUri[0].fsPath;
    //         const fileContent = fs.readFileSync(filePath, 'utf8');
    //         chatProvider.addContext(fileContent);  // Add file content to context
    //         vscode.window.showInformationMessage('Context loaded from file.');
    //     }
    // });

    const loadContextCommand = vscode.commands.registerCommand('aiChatbot.loadContext', async () => {
        // Present options for selecting files or inputting custom context
        const choice = await vscode.window.showQuickPick(['Select Files', 'Input Custom Context'], {
            placeHolder: 'How would you like to provide the context?'
        });
    
        if (choice === 'Select Files') {
            // Show file selection dialog with multi-file selection enabled
            const fileUris = await vscode.window.showOpenDialog({
                canSelectMany: true,  // Allow selecting multiple files
                openLabel: 'Open Files',
                filters: { 'Text Files': ['txt', 'md', 'js', 'ts', 'json'] }
            });
    
            if (fileUris && fileUris.length > 0) {
                let combinedContext = '';
    
                // Loop through selected files and combine their content
                for (const fileUri of fileUris) {
                    const filePath = fileUri.fsPath;
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    combinedContext += `\n\n--- Content from ${path.basename(filePath)} ---\n${fileContent}`;
                }
    
                chatProvider.addContext(combinedContext);  // Add combined file content to context
                vscode.window.showInformationMessage('Context loaded from selected files.');
            }
    
        } else if (choice === 'Input Custom Context') {
            // Example structured context
            const customContext = `
                Requirements from project manager:
                - Detailed project requirements
    
                Instructions from team lead:
                - Technological choices and documentation
    
                Official tech stack docs and third-party docs:
                - Links to official docs or descriptions of the tech stack
    
                Complete context of code in the project:
                - Summary of the code or explanations of different parts of the codebase.
            `;
    
            chatProvider.addContext(customContext);  
            
            // Add custom context
            vscode.window.showInformationMessage('Custom context loaded !!!!!');
        }
    });
    
    
    context.subscriptions.push(askCommand, loadContextCommand);
}

export function deactivate() {}
