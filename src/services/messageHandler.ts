import * as vscode from 'vscode';
import { generalChatWebSocket, generateCodeWebSocket, generateComments } from '../services/apiSerivce'; // Import API services

// Handle Webview Messages
export async function handleWebviewMessage(message: any, webviewView: vscode.WebviewView, panel: any) {
    if (message.command === 'sendMessage') {
        let sessionId = message.sessionId; // Get session ID from the message
        let projectName = message.projectName; // Get project name from the message
        const userMessage = message.text; // Get the user's question message

        try {
            // Initialize WebSocket communication using the provided sessionId and projectName
            await generalChatWebSocket(
                sessionId="6",
                projectName="BlogApp",
                userMessage,
                (response: string) => {
                    // Handle the AI's response from the WebSocket and send it back to the webview
                    panel.addMessageToWebview('AI', response);
                },
                (error: string) => {
                    // Handle WebSocket errors
                    vscode.window.showErrorMessage('Error communicating with AI chatbot through WebSocket.');
                    console.error(error);
                }
            );
        } catch (error) {
            // Handle any additional errors (such as initialization errors)
            vscode.window.showErrorMessage('Error communicating with AI chatbot.');
            console.error(error);
        }
    } 
    else if (message.command === 'generateCodeWebSocket') {
        const userMessage = message.text; // Get the user's code generation request
        try {
            // Use the new WebSocket function for code generation
            await generateCodeWebSocket(
                message.projectName="BlogApp", // Pass the project name if needed
                userMessage, // Pass the user message
                (response: string) => {
                    // Handle the AI's response and format the code
                    const formattedCode = extractCodeFromResponse(response);
                    panel.addMessageToWebview('AI', formattedCode);
                },
                (error: string) => {
                    // Handle errors from the WebSocket
                    vscode.window.showErrorMessage('Error generating code from AI through WebSocket.');
                    console.error(error);
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage('Error communicating with AI for code generation.');
            console.error(error);
        }
    }
    
    else if (message.command === 'generateComments') {
        const code = message.code;
        try {
            const response = await generateComments(code);
            panel.addMessageToWebview('AI', response);
        } catch (error) {
            vscode.window.showErrorMessage('Error generating comments from AI.');
            console.error(error);
        }
    } 
    else if (message.command === 'switchToContext') {
        webviewView.webview.html = panel._getHtmlForContextView(webviewView.webview);
    } 
    else if (message.command === 'switchToChat') {
        webviewView.webview.html = panel._getHtmlForWebview(webviewView.webview);
    } 
    else if (message.command === 'addContext') {
        const { fileListId, files } = message;
        panel.addContextData(fileListId, files);
    }
}

// Helper function to extract code from the AI's response (used for `generateCode` command)
function extractCodeFromResponse(response: string): string {
    // Remove any backticks and language-specific code fences (```python or ```js, etc.)
    const code = response.replace(/```[a-z]*|```/g, '');
    return code.trim(); // Trim any extra whitespace around the code
}
