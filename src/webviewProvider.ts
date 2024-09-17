import * as vscode from 'vscode';
import { FileSelector } from './selectors/fileSelector';
import { GitHubLoader } from './selectors/githubLoader';
import { CodeBlockSelector } from './selectors/codeBlockSelector';
import * as fs from 'fs';
import * as path from 'path';
export class WebViewProvider {

    static async loadContext(chatProvider: any) {
        const choice = await vscode.window.showQuickPick([
            'Select Files from Current Directory',
            'Input Remote Repository Link',
            'Select Custom Code Items',
            'Select Directories'
        ], {
            placeHolder: 'How would you like to provide the context?'
        });

        if (choice === 'Select Files from Current Directory') {
            await FileSelector.loadFilesFromWorkspace(chatProvider);
        } else if (choice === 'Input Remote Repository Link') {
            await GitHubLoader.loadRemoteRepository(chatProvider);
        } else if (choice === 'Select Custom Code Items') {
            await CodeBlockSelector.loadCustomCodeItems(chatProvider);
        } else if (choice === 'Select Directories') {
            await FileSelector.loadFromDirectories(chatProvider);
        }
    }


    // Utility function to post messages to the WebView if it's active
    static postToWebview(message: any) {
        if (WebViewProvider.panel) {
            WebViewProvider.panel.webview.postMessage(message);
        }
    }

    static panel: vscode.WebviewPanel | undefined;

    static createOrShowWebView(context: vscode.ExtensionContext, chatProvider: any) {
        if (WebViewProvider.panel) {
            WebViewProvider.panel.reveal();
        } else {
            WebViewProvider.panel = vscode.window.createWebviewPanel(
                'aiChatbot',
                'AI Chatbot',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            WebViewProvider.panel.webview.html = WebViewProvider.getWebViewContent(context);
            WebViewProvider.postToWebview({ command: 'loadContext', context: chatProvider.getContext() });

            WebViewProvider.panel.onDidDispose(() => {
                WebViewProvider.panel = undefined;
            });
        }
    }

    static getWebViewContent(context: vscode.ExtensionContext) {
        const scriptUri = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'script.js')
        ).with({ scheme: 'vscode-resource' });
    
        const styleUri = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'style.css')
        ).with({ scheme: 'vscode-resource' });
    
        return `
            <html>
                <head>
                    <link href="${styleUri}" rel="stylesheet" />
                </head>
                <body>
                    <h1>AI Chatbot</h1>
                    <div id="chatOutput"></div>  <!-- Display the conversation here -->
                    <input type="text" id="userInput" placeholder="Type your message..."/> <!-- Input field for the chat -->
                    <button id="sendButton">Send</button> <!-- Button to send the input -->
                    
                    <script>
                        const vscode = acquireVsCodeApi(); // API for VS Code interaction
                        
                        // Function to send user input when the button is clicked
                        document.getElementById('sendButton').addEventListener('click', () => {
                            const userInput = document.getElementById('userInput').value;
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: userInput
                            });
                            document.getElementById('userInput').value = ''; // Clear the input field
                        });
    
                        // Listen for messages from the extension
                        window.addEventListener('message', event => {
                            const message = event.data; // The message from extension
                            const chatOutput = document.getElementById('chatOutput');
                            chatOutput.innerHTML += '<p>' + message.text + '</p>'; // Append new message
                        });
                    </script>
                </body>
            </html>
        `;
    }
    
}
