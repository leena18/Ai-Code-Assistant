import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPaneel';
import { commandHandler } from './features/commandRegister';
import { handleAddCommentsCommand } from './features/comment';
import { handleFixCode } from './features/fix-code';
import CodeGenerator from './features/nlp/code-generator';
import { activateCodeSuggestionListener } from './features/predict-code';
import { removeCommentsFromSelection } from './features/removeComments';
import  chokidar  from 'chokidar';
import  WebSocket  from 'ws';
import fs from 'fs';
import path from 'path';


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

    // Comment feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.addComments', handleAddCommentsCommand)
    );

    // Fix code feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.fixCode', handleFixCode)
    );

    // NLP code generation feature
    context.subscriptions.push(
        vscode.commands.registerCommand('aiChatbot.nlpGenerateCode', async () => {
            codeGenerator.promptForCodeGeneration();
        })
    );

    let disposable = vscode.commands.registerCommand('extension.removeComments', () => {
        removeCommentsFromSelection();
    });

    const disposable2 = vscode.commands.registerCommand('extension.startMonitoring', async () => {
        console.log('Starting monitoring');
        const path = await vscode.window.showInputBox({
            placeHolder: 'Enter the path of the directory to monitor'
        });

        if (path) {
            startMonitoring(path);
        }
        
    });

    vscode.commands.executeCommand('extension.startMonitoring');
    context.subscriptions.push(disposable2);


    context.subscriptions.push(disposable);
}


let ws:any = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let watcher:any;
export function startMonitoring(repoPath:string,userId="user1", projectId="project1", projectName="audit-drupal-main") {
    // Initialize chokidar to watch the directory
    watcher = chokidar.watch(repoPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    // Function to initialize WebSocket and handle reconnection
    function initializeWebSocket() {
        ws = new WebSocket(`ws://127.0.0.1:8000/api/ws/sync-repo?userId=${userId}&projectId=${projectId}&projectName=${projectName}`);

        ws.onopen = () => {
            reconnectAttempts = 0;  // Reset reconnection attempts on successful connection
            vscode.window.showInformationMessage('WebSocket connection established');
        };

        ws.onclose = () => {
            vscode.window.showErrorMessage('WebSocket connection closed');
            attemptReconnect();
        };

        ws.onerror = (error: { message: any; }) => {
            vscode.window.showErrorMessage(`WebSocket error: ${error.message}`);
        };
    }

    // Attempt to reconnect WebSocket if connection is lost
    function attemptReconnect() {
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            vscode.window.showWarningMessage(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(initializeWebSocket, 2000);  // Wait 2 seconds before trying to reconnect
        } else {
            vscode.window.showErrorMessage('Maximum reconnect attempts reached. Please check your network or server.');
        }
    }

    // Function to send file updates via WebSocket
    async function sendFileUpdate(event: string, filePath: any) {
        const fileContent = await getFileContent(filePath);


        const fileUpdate = {
            event: event,  // add, change, unlink
            filePath: path.relative(repoPath, filePath),
            fileContent: fileContent,
            timestamp: new Date().toISOString()  // Use ISO format for timestamp
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(fileUpdate));
        } else {
            vscode.window.showWarningMessage('WebSocket not connected. Attempting to reconnect...');
            attemptReconnect();
            // Store the update and try to resend it after reconnection
            setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(fileUpdate));
                } else {
                    vscode.window.showErrorMessage('Failed to send update after reconnection');
                }
            }, 3000);  // Attempt to send after 3 seconds
        }
    }

    async function getFileContent(filePath: any) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    initializeWebSocket();  // Initialize WebSocket connection

    watcher
        .on('add', (filePath: any) => {
            vscode.window.showInformationMessage(`File added: ${filePath}`);
            sendFileUpdate('add', filePath);
        })
        .on('change', (filePath: any) => {
            vscode.window.showInformationMessage(`File changed: ${filePath}`);
            sendFileUpdate('change', filePath);
        })
        .on('unlink', (filePath: any) => {
            vscode.window.showInformationMessage(`File removed: ${filePath}`);
            sendFileUpdate('unlink', filePath);
        })
        .on('error', (error: any) => {
            console.error(`Watcher error: ${error}`);
            vscode.window.showErrorMessage(`Watcher error: ${error}`);
        });

    vscode.window.showInformationMessage(`Started watching: ${repoPath}`);
}


export function deactivate() {
    if (watcher) {
        watcher.close();
    }
}

