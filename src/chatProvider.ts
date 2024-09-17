import * as vscode from 'vscode';
import { WebViewProvider } from './webviewProvider';

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

export class ChatProvider implements vscode.TreeDataProvider<ChatItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChatItem | undefined | void> = new vscode.EventEmitter<ChatItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ChatItem | undefined | void> = this._onDidChangeTreeData.event;
    private chatItems: ChatItem[] = [];
    private context: string = '';

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;
    }

    getChildren(): ChatItem[] {
        return this.chatItems;
    }

    addChatMessage(content: string, fromUser: boolean): void {
        const newItem = new ChatItem(
            fromUser ? `You: ${content}` : `LASK: ${content}`,
            vscode.TreeItemCollapsibleState.None,
            content
        );
        this.chatItems.push(newItem);
        this.refresh();

        // Also send the message to the WebView
        WebViewProvider.postToWebview({ command: 'appendMessage', text: fromUser ? `You: ${content}` : `LASK: ${content}` });
    }

    addContext(context: string): void {
        this.context = context;
    }

    getContext(): string {
        return this.context;
    }
}
