import * as vscode from 'vscode';

export class ChatPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.chatPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        // Set the webview's options
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Set the HTML content for the chat interface
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Add your chat interface HTML code here
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat</title>
            <style>
                /* Styles here */
                body {
                    font-family: Arial, sans-serif;
                }
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .messages {
                    flex-grow: 1;
                    overflow-y: scroll;
                    padding: 10px;
                    border: 1px solid #ddd;
                }
                .input-container {
                    display: flex;
                    padding: 10px;
                    border-top: 1px solid #ddd;
                }
                input[type="text"] {
                    flex-grow: 1;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    margin-right: 10px;
                }
                button {
                    padding: 10px 20px;
                    background-color: #007ACC;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="messages" id="messages"></div>
                <div class="input-container">
                    <input type="text" id="messageInput" placeholder="Type a message...">
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                function sendMessage() {
                    const input = document.getElementById('messageInput');
                    const message = input.value;
                    if (message) {
                        addMessage('Me', message);
                        vscode.postMessage({ command: 'sendMessage', text: message });
                        input.value = '';
                    }
                }

                function addMessage(sender, text) {
                    const messagesDiv = document.getElementById('messages');
                    const messageElement = document.createElement('div');
                    messageElement.textContent = sender + ': ' + text;
                    messagesDiv.appendChild(messageElement);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            </script>
        </body>
        </html>
        `;
    }
}
