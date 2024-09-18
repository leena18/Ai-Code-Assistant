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
                // Prompt template for code generation
                const promptTemplate = `
                    You are an AI assistant. Generate code based on the following user question.
                    Question: ${userInput}
                    code: 


                    Your code is given above


                    Return only the code without any explanations or comments.
                `;

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: chatProvider.getContext() + '\n' + promptTemplate
                        }
                    ],
                    model: 'gemma-7b-it',
                    temperature: 1,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: true,
                    stop: ["Your code is given above"]
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

    // Command to fix selected code using Lask.AI (Groq API)
    const fixCodeCommand = vscode.commands.registerCommand('aiChatbot.fixCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedText = editor.document.getText(editor.selection);

            if (selectedText) {
                try {
                    // Prompt template for fixing code
                    const fixPromptTemplate = `
                        You are an AI assistant. fix the error in the code and rewrite the whole code with comments:
                        ${selectedText}

                        code:

                        Your code is given above
                        Return only the code without any explanations.
                    `;

                    const chatCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: 'user',
                                content: fixPromptTemplate
                            }
                        ],
                        model: 'gemma-7b-it',
                        temperature: 1,
                        max_tokens: 1024,
                        top_p: 1,
                        stop: ["Your code is given above"]
                    });

                    const suggestedFix = chatCompletion.choices[0]?.message?.content || 'No fix suggested.';

                    // Show popup with suggested fix
                    const action = await vscode.window.showInformationMessage(
                        `Suggested fix:\n${suggestedFix}`,
                        'Accept', 'Reject'
                    );

                    if (action === 'Accept') {
                        // Apply the fix in the editor
                        editor.edit(editBuilder => {
                            editBuilder.replace(editor.selection, suggestedFix); // Replace code with fix
                        });
                        vscode.window.showInformationMessage('Code fix applied.');
                    } else {
                        vscode.window.showInformationMessage('Code fix rejected.');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to get a fix from Lask.AI.');
                    console.error(error);
                }
            } else {
                vscode.window.showErrorMessage('No code selected.');
            }
        }
    });

    context.subscriptions.push(askCommand, loadContextCommand, fixCodeCommand);
}

export function deactivate() {}
