import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { commandHandler } from './features/commandRegister'; // Import for handling commands
import {handleAddCommentsCommand} from './features/comment'
import {handleFixCode}  from './features/fix-code'
import CodeGenerator from './features/generate-code-nlp'; // Ensure the path is correct
import {activateCodeSuggestionListener} from "./features/predict-code"
import { removeCommentsFromSelection} from './features/removeComments'

export function activate(context: vscode.ExtensionContext) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );


    
    const codeGenerator = new CodeGenerator(context.extensionUri);
     

    activateCodeSuggestionListener();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.explainCode', () => {
            commandHandler('explainCode');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.fixCode', () => {
            commandHandler('fixCode');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.writeDocstrings', () => {
            commandHandler('writeDocstrings');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.generateTests', () => {
            commandHandler('generateTests');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChat.exploreCodebase', () => {
            commandHandler('exploreCodebase');
        })
    );


    
    //------commment -feature

     
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.addComments', handleAddCommentsCommand)
    );

    
    //-------fix-code


    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.fixCode', handleFixCode)
    );

    
    //-------nlp-code-generate


    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.nlpGenerateCode', async () => {
            codeGenerator.promptForCodeGeneration(); 
        })
    );

    let disposable = vscode.commands.registerCommand('extension.removeComments', () => {
        removeCommentsFromSelection();
    });

    context.subscriptions.push(disposable);

   

  

    
}
   


export function deactivate() {}
