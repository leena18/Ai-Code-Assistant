import * as vscode from 'vscode';  // Importing the vscode API to create extensions for VSCode

// ChatItem class represents an individual item (message) in the chat tree view
export class ChatItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,  // The label displayed in the tree view (message sender and content)
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,  // Defines if the item is expandable/collapsible
        public readonly content: string  // Stores the actual content of the chat message
    ) {
        super(label, collapsibleState);  // Calls the parent TreeItem constructor with label and state
    }
}

// ChatProvider class manages the tree view and data, implements TreeDataProvider for VSCode
export class ChatProvider implements vscode.TreeDataProvider<ChatItem> {
    // Event emitter to signal changes in the tree data (used for refreshing the UI)
    private _onDidChangeTreeData: vscode.EventEmitter<ChatItem | undefined | void> = new vscode.EventEmitter<ChatItem | undefined | void>();
    // Public event that exposes when the tree data changes (used by VSCode to update the view)
    readonly onDidChangeTreeData: vscode.Event<ChatItem | undefined | void> = this._onDidChangeTreeData.event;

    private chatItems: ChatItem[] = [];  // Array that holds all chat messages (as ChatItem instances)
    private context: string = '';  // Stores the context of the chat (useful for state tracking)

    // Function to refresh the tree view, signaling that the data has changed
    refresh(): void {
        this._onDidChangeTreeData.fire();  // Emits an event to notify VSCode that the data needs to be updated
    }

    // Returns the tree item that represents a chat message (ChatItem)
    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;  // Returns the individual chat item to display in the tree view
    }

    // Returns the array of all chat items (used by VSCode to populate the tree)
    getChildren(): ChatItem[] {
        return this.chatItems;  // Returns the list of chat messages
    }

    // Function to add a new chat message (content) to the chatItems array
    addChatMessage(content: string, fromUser: boolean): void {
        // Creates a new ChatItem with different labels depending on whether the message is from the user or the AI
        const newItem = new ChatItem(
            fromUser ? `You: ${content}` : `AI: ${content}`,  // Labels the message based on the sender (User or AI)
            vscode.TreeItemCollapsibleState.None,  // Sets the item as non-collapsible
            content  // Stores the actual message content
        );
        this.chatItems.push(newItem);  // Adds the new message to the chat list
        this.refresh();  // Refreshes the tree view to show the new message
    }

    // Sets the context for the chat (e.g., the current conversation topic or state)
    addContext(context: string): void {
        this.context = context;
    }

    // Retrieves the current chat context
    getContext(): string {
        return this.context;
    }
}
