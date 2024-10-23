import * as vscode from 'vscode';
import * as os from 'os';
import axios from 'axios';
import FormData from 'form-data';
import { ChatPanel } from './panels/ChatPaneel';
import { commandHandler } from './features/commandRegister';
import { handleAddCommentsCommand } from './features/comment';
import { handleFixCode } from './features/fix-code';
import CodeGenerator from './features/nlp/code-generator';
import { activateCodeSuggestionListener } from './features/predict-code';
import { removeCommentsFromSelection } from './features/removeComments';
import path from 'path';

let global: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPanel(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanel.viewType, chatProvider)
    );

    global = context;

    global.globalState.update('lask', { "project_id": "", "user_id": "" });

    const fileName = generateFileName();

    console.log(getGlobalState("lask"));
    

    const codeGenerator = new CodeGenerator(context.extensionUri);
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.inlineChat', () => {
            codeGenerator.inlineChat();
        })
    );
    activateCodeSuggestionListener();


               //for embedding on startup
            vscode.workspace.onDidOpenTextDocument(async (document) => {
                const filePath = document.uri.fsPath;
                const content = document.getText();
        
                // Add the file to the embedding queue for immediate processing
                enqueueForEmbedding(filePath, content);
        
                // Process the queue immediately if a new file is opened
                processQueue();
            });
        
            vscode.window.onDidChangeActiveTextEditor(async (event:any) => {
                const document = event.document;
                const filePath = document.uri.fsPath;
                const content = document.getText();
                console.log(`File changed: ${filePath}`);
                
                // Sync embeddings on content change (optional)
                await syncFileEmbedding(filePath, content, getGlobalState("lask")["user_id"], getGlobalState("lask")["project_id"]);
            });
        
            // startBackgroundEmbedding();


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


    context.subscriptions.push(disposable);

    vscode.window.registerWebviewViewProvider(ChatPanel.viewType, {
        resolveWebviewView(webviewView: vscode.WebviewView) {
            webviewView.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'getOpenFiles') {
                    const openFiles = vscode.workspace.textDocuments.map(doc => doc.fileName);
                    webviewView.webview.postMessage({ command: 'showOpenFiles', files: openFiles });
                }
            });
        }
    });
}

// Function to get the global state outside activate
export function getGlobalState(key: string): any {
    // Access globalState from the global context
    return global.globalState.get(key);
}
export function updateGlobalState(key: string, value: any) {
    // Access globalState from the global context
    global.globalState.update(key, value);
}

function generateFileName(): string {
    // Get the system's name
    const systemName = os.hostname();

    // Get the project name from the currently opened workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace is opened.');
        return '';
    }

    // Get the folder path and name of the first workspace folder (assuming one project)
    const projectPath = workspaceFolders[0].uri.fsPath;
    const projectName = path.basename(projectPath);

    console.log("projectPath",projectPath);
    
    // Combine system name and project name to form a file name
    const fileName = `${systemName}_${projectName}_file`;
    
    const currState = { "project_id": projectName, "user_id": systemName }
    updateGlobalState("lask",currState)
    return fileName;
}

// async function embedFile(filePath: string, content: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; }) {
//     try {
//         console.log(`Embedding file: ${filePath}`);

//         // Create a form for multipart data
//         const formData = new FormData();
//         formData.append('file_path', filePath);
//         formData.append('file', Buffer.from(content, 'utf-8'), {
//             filename: filePath.split('/').pop(),
//             contentType: 'text/plain',
//         });

//         const response = await axios.post('http://localhost:8000/api/generate-repo-embedding', formData, {
//             headers: {
//                 ...formData.getHeaders(),  // Add headers from the form data
//             },
//         });

//         if (response.data.status === "exists") {
//             console.log(`Embeddings already exist for file: ${filePath}`);
//         } else if (response.data.status === "success") {
//             console.log(`Embedding successful: ${response.data.message}`);
//         }
//     } catch (error) {
//         console.error(`Failed to embed file: ${error}`);
//     }
// }

async function embedFile(
    filePath: string,
    content: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; },
) {
    try {
        console.log(`Embedding file: ${filePath}`);
        const state = getGlobalState("lask")
        const userId = state["user_id"]
        const projectId = state["project_id"]
        
        // Create a form for multipart data
        const formData = new FormData();
        formData.append('userId', userId); // Append userId
        formData.append('projectId', projectId); // Append projectId
        formData.append('file_path', filePath);
        formData.append('file', Buffer.from(content, 'utf-8'), {
            filename: filePath.split('/').pop(),
            contentType: 'text/plain',
        });

        const response = await axios.post('http://localhost:8000/api/generate-repo-embedding', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Specify content type for form data
            },
        });

        if (response.data.status === "exists") {
            console.log(`Embeddings already exist for file: ${filePath}`);
        } else if (response.data.status === "processing") {
            console.log(`Embedding in progress: ${response.data.message}`);
        }
    } catch (error) {
        console.error(`Failed to embed file: ${error}`);
    }
}

let embeddingQueue: { filePath: any; content: any; }[] = [];  // Queue to prioritize files for embedding
let isProcessingQueue = false;  // Flag to track if the queue is being processed


// Function to sync embeddings for files when their content changes
async function syncFileEmbedding(
    filePath: string,
    content: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; },
    userId: string,
    projectId: string
) {
    try {
        console.log(`Syncing embedding for file: ${filePath}`);

        // Create a form for multipart data
        const formData = new FormData();
        formData.append('userId', userId); // Append userId
        formData.append('projectId', projectId); // Append projectId
        formData.append('file_path', filePath);
        formData.append('file', Buffer.from(content, 'utf-8'), {
            filename: filePath.split('/').pop(),
            contentType: 'text/plain',
        });


        const response = await axios.post('http://localhost:8000/api/sync-repo-embedding', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Specify content type for form data
            },
        });

        console.log(`Sync successful: ${response.data}`);
    } catch (error) {
        console.error(`Failed to sync file: ${error}`);
    }
}
// Add file path and content to embedding queue
function enqueueForEmbedding(filePath: string, content: string) {
    if (!embeddingQueue.some(item => item.filePath === filePath)) {
        embeddingQueue.push({ filePath, content });
    }
}
async function startBackgroundEmbedding() {
    try {
        console.log("started embedding");

        // Find all files in the workspace (repository)
        const files = await vscode.workspace.findFiles('**/*.{js,py,java,php}', '**/node_modules/**');

        // Start embedding files one by one in the background
        for (const file of files) {
            const filePath = file.fsPath;

            try {
                // Check if file is already in the embedding queue
                if (!embeddingQueue.some(item => item.filePath === filePath)) {
                    const document = await vscode.workspace.openTextDocument(filePath);
                    const content = document.getText();

                    // Add file to the queue for background embedding
                    enqueueForEmbedding(filePath, content);
                }
            } catch (fileError) {
                // Log the error and continue with the next file
                console.error(`Error processing file ${filePath}: ${fileError}`);
                continue; // Continue with the next file
            }
        }

        // Process the queue after adding files
        processQueue();
    } catch (error) {
        console.error(`Failed to start background embedding: ${error}`);
    }
}

// Function to process files in the embedding queue
async function processQueue() {
    if (isProcessingQueue || embeddingQueue.length === 0) {
        return;  // Skip if already processing or queue is empty
    }

    isProcessingQueue = true;
 
    try {
        while (embeddingQueue.length > 0) {
            const { filePath, content } :any = embeddingQueue.shift(); // Get the file from the queue
            console.log(`Processing file from queue: ${filePath}`);

            // Embed the file
            await embedFile(filePath, content);
        }
    } catch (error) {
        console.error(`Error processing queue: ${error}`);
    } finally {
        isProcessingQueue = false;  // Reset flag when done
    }
}




export function deactivate() {

}

