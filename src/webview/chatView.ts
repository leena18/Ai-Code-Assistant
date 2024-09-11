import * as vscode from 'vscode';

export class ChatWebview {
    private _panel: vscode.WebviewPanel | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public createOrShow() {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
        } else {
            this._panel = vscode.window.createWebviewPanel(
                'chatSidebar',
                'Chat with AI',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
                }
            );

            this._panel.webview.html = this.getWebviewContent();
            this._panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'sendMessage':
                            this.handleSendMessage(message.text);
                            return;
                    }
                },
                undefined,
                this.context.subscriptions
            );
        }
    }

    private getWebviewContent() {
        const styleUri = this._panel?.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css')
        );

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chat with AI</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .chat-container { display: flex; flex-direction: column; height: 100vh; }
                    .chat-box { flex: 1; overflow-y: auto; padding: 10px; }
                    .input-box { display: flex; }
                    .input-box input { flex: 1; padding: 10px; border: 1px solid #ccc; }
                    .input-box button { padding: 10px; border: none; background: #007acc; color: white; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div id="chat" class="chat-box"></div>
                    <div class="input-box">
                        <input type="text" id="messageInput" placeholder="Type your message here...">
                        <button id="sendMessage">Send</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    document.getElementById('sendMessage').addEventListener('click', () => {
                        const input = document.getElementById('messageInput');
                        vscode.postMessage({ command: 'sendMessage', text: input.value });
                        input.value = '';
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'appendMessage') {
                            const chat = document.getElementById('chat');
                            const div = document.createElement('div');
                            div.textContent = message.text;
                            chat.appendChild(div);
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    private handleSendMessage(text: string) {
        // You should also update the sidebar chat view with the new message
        // For demonstration purposes, just log the message
        console.log('Message sent:', text);

        // Here you would handle sending the message to the AI and updating the view
        // For now, we will simulate receiving a response from AI
        this._panel?.webview.postMessage({
            command: 'appendMessage',
            text: `You: ${text}`
        });

        // Simulate AI response
        setTimeout(() => {
            this._panel?.webview.postMessage({
                command: 'appendMessage',
                text: `AI: Response to "${text}"`
            });
        }, 1000);
    }
}
