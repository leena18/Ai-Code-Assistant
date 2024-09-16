import * as vscode from 'vscode';
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import { ChatProvider } from './ChatProvider';
import { WebViewProvider } from './webviewProvider';

// Load environment variables from .env file
dotenv.config();

console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);

// Initialize the Groq API
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

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
            chatProvider.addChatMessage(userInput, true);

            try {
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: chatProvider.getContext() + '\n' + userInput
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

                chatProvider.addChatMessage(responseText, false);
            } catch (error) {
                vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                console.error(error);
            }
        }
    });

    // Command to load context from a file or custom input
    const loadContextCommand = vscode.commands.registerCommand('aiChatbot.loadContext', () => {
        WebViewProvider.loadContext(chatProvider);
    });

    context.subscriptions.push(askCommand, loadContextCommand);
}

export function deactivate() {}
