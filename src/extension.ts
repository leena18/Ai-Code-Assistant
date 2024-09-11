import * as vscode from 'vscode';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

const groq = new Groq({
    apiKey: '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'  // Replace with your API key
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
    const loadContextCommand = vscode.commands.registerCommand('aiChatbot.loadContext', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Open File',
            filters: { 'Text Files': ['txt', 'md', 'js', 'ts', 'json'] }
        });

        if (fileUri && fileUri[0]) {
            const filePath = fileUri[0].fsPath;
            const fileContent = fs.readFileSync(filePath, 'utf8');
            chatProvider.addContext(fileContent);  // Add file content to context
            vscode.window.showInformationMessage('Context loaded from file.');
        }
    });

    context.subscriptions.push(askCommand, loadContextCommand);
}

export function deactivate() {}
