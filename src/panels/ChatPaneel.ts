import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // A separate file for handling Groq API requests

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

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendMessage') {
                const userMessage = message.text;
                // this.addMessageToWebview('Me', userMessage);

                try {
                    console.log('User Message:', userMessage);
                    const response = await groqChatAPI(userMessage); // Send the message to Groq API
                    console.log('AI Response:', response);
                    
                    this.addMessageToWebview('AI', response);
                } catch (error) {
                    vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                    console.error(error);
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat</title>
        <style>
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
                <button id="sendButton">Send</button>
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

            window.addEventListener('message', event => {
                const message = event.data; // The JSON data sent from the extension
                switch (message.command) {
                    case 'addMessage':
                        addMessage(message.sender, message.text);
                        break;
                }
            });

            // Add event listener in JavaScript to avoid multiple bindings
            document.getElementById('sendButton').addEventListener('click', sendMessage);
        </script>
    </body>
    </html>
    `;
    }

    private addMessageToWebview(sender: string, message: string) {
        
        
        if (this._view) {
            console.log('Adding message to webview:', sender, message);
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }
}
