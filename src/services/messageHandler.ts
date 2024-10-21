import * as vscode from 'vscode';
import { generalChat, generateCode, generateComments } from '../services/apiSerivce'; // Import API services

export async function handleWebviewMessage(message: any, webviewView: vscode.WebviewView, panel: any) {
    if (message.command === 'sendMessage') {
        const userMessage = message.text;
        try {
            const response = await generalChat(userMessage, 'string');
            panel.addMessageToWebview('AI', response);
        } catch (error) {
            vscode.window.showErrorMessage('Error communicating with AI chatbot.');
            console.error(error);
        }
    } 
    else if (message.command === 'generateCode') {
        const userMessage = message.text;
        try {
            const response = await generateCode(userMessage, 'string');
            const formattedCode = extractCodeFromResponse(response);
            panel.addMessageToWebview('AI', formattedCode);
        } catch (error) {
            vscode.window.showErrorMessage('Error communicating with AI chatbot.');
            console.error(error);
        }
    } 
     else if (message.command === 'switchToContext') {
        webviewView.webview.html = panel._getHtmlForContextView(webviewView.webview);
    } else if (message.command === 'switchToChat') {
        webviewView.webview.html = panel._getHtmlForWebview(webviewView.webview);
    } else if (message.command === 'addContext') {
        const { fileListId, files } = message;
        panel.addContextData(fileListId, files);
    } 
}
function extractCodeFromResponse(response: string): string {
    const codeMatch = response.match(/[\s\S]*?/);
    return codeMatch ? codeMatch[0] : response.trim();
}