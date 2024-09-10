import * as vscode from 'vscode';
import Groq from 'groq-sdk';


const groq = new Groq({
    apiKey: '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'  // Replace with your API key
});

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext) {

    console.log('AI Chatbot extension is now active!');

    const disposable = vscode.commands.registerCommand('aiChatbot.ask', async () => {
        // Input from the user
        const userInput = await vscode.window.showInputBox({
            prompt: 'Ask the AI chatbot a question',
            placeHolder: 'Type your question here...'
        });

        if (userInput) {
            vscode.window.showInformationMessage(`You asked: ${userInput}`);

            try {
                // Call the Groq API
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: userInput
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

                vscode.window.showInformationMessage(`AI Chatbot says: ${responseText}`);
            } catch (error) {
                vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                console.error(error);
            }
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
