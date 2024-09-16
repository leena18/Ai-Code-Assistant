import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
0
export class WebViewProvider {

    // This function allows users to load context in different ways: from local files, a remote repository, custom code items, or directories
    static async loadContext(chatProvider: any) {
        // Display options to the user for selecting how to load the context
        const choice = await vscode.window.showQuickPick([
            'Select Files from Current Directory', 
            'Input Remote Repository Link', 
            'Select Custom Code Items', 
            'Select Directories'
        ], {
            placeHolder: 'How would you like to provide the context?'
        });

        // If user chooses to select files from the current directory
        if (choice === 'Select Files from Current Directory') {
            // Get all files from the current workspace
            const files = await vscode.workspace.findFiles('**/*'); // Retrieve all files in the workspace
        
            if (files && files.length > 0) {
                // Map the files to a quick pick format (show file names)
                const fileOptions = files.map(file => ({
                    label: path.basename(file.fsPath),
                    description: file.fsPath,
                    fileUri: file
                }));
        
                // Allow the user to select one or more files within VS Code's QuickPick
                const selectedFiles = await vscode.window.showQuickPick(fileOptions, {
                    canPickMany: true, // Allow multiple files to be selected
                    placeHolder: 'Select files from the current workspace'
                });
        
                if (selectedFiles && selectedFiles.length > 0) {
                    let combinedContext = '';
                    for (const file of selectedFiles) {
                        const filePath = file.fileUri.fsPath;
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        combinedContext += `\n\n--- Content from ${path.basename(filePath)} ---\n${fileContent}`;
                    }
                    chatProvider.addContext(combinedContext);
                    vscode.window.showInformationMessage('Context loaded from selected files.');
        
                    // Post the context to the webview if it is active
                    if (WebViewProvider.panel) {
                        WebViewProvider.panel.webview.postMessage({
                            command: 'loadContext',
                            context: combinedContext
                        });
                    }
                }
            } else {
                vscode.window.showErrorMessage('No files found in the current workspace.');
            }
        }
        
        // If user chooses to input a remote repository link
        else if (choice === 'Input Remote Repository Link') {
            // Show input box to get the repository URL
            const repoUrl = await vscode.window.showInputBox({
                placeHolder: 'Enter the remote repository URL (e.g., GitHub link)',
                prompt: 'Provide a valid GitHub/Bitbucket repository URL'
            });

            if (repoUrl) {
                try {
                    // Fetch the repository content using axios
                    const repoContent = await axios.get(repoUrl); 
                    chatProvider.addContext(repoContent.data); // Add the repo content to chatProvider
                    vscode.window.showInformationMessage('Context loaded from remote repository.');

                    // Send the repo content to the webview if active
                    if (WebViewProvider.panel) {
                        WebViewProvider.panel.webview.postMessage({
                            command: 'loadContext',
                            context: repoContent.data
                        });
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to load repository content.'); // Error handling
                }
            }
        } 
        // If user chooses to select custom code items (e.g., functions or symbols from an open file)
        else if (choice === 'Select Custom Code Items') {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const document = activeEditor.document;
                // Execute a VS Code command to get document symbols (functions, classes, etc.)
                const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                    'vscode.executeDocumentSymbolProvider',
                    document.uri
                );

                if (symbols) {
                    const symbolNames = symbols.map(symbol => symbol.name); // Extract symbol names
                    const selectedSymbol = await vscode.window.showQuickPick(symbolNames, {
                        placeHolder: 'Select a code item from the current file'
                    });

                    // If a symbol is selected, add its content to the chatProvider
                    if (selectedSymbol) {
                        const selectedSymbolContent = symbols.find(symbol => symbol.name === selectedSymbol);
                        const customContext = document.getText(selectedSymbolContent?.range); // Get the symbol content
                        chatProvider.addContext(customContext);
                        vscode.window.showInformationMessage('Custom code context loaded.');

                        // Send the custom code context to the webview if active
                        if (WebViewProvider.panel) {
                            WebViewProvider.panel.webview.postMessage({
                                command: 'loadContext',
                                context: customContext
                            });
                        }
                    }
                }
            }
        } 
        // If user chooses to select directories
        else if (choice === 'Select Directories') {
            // Open dialog for selecting directories
            const dirUris = await vscode.window.showOpenDialog({
                canSelectMany: true, // Allow multiple directories
                canSelectFolders: true, // Allow folder selection
                openLabel: 'Select Directories',
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri // Default to the first workspace directory
            });

            if (dirUris && dirUris.length > 0) {
                let combinedContext = '';
                for (const dirUri of dirUris) {
                    const dirPath = dirUri.fsPath;
                    const dirFiles = fs.readdirSync(dirPath); // Get all files from the directory
                    for (const fileName of dirFiles) {
                        const filePath = path.join(dirPath, fileName);
                        if (fs.statSync(filePath).isFile()) { // Check if it's a file
                            const fileContent = fs.readFileSync(filePath, 'utf8'); // Read file content
                            combinedContext += `\n\n--- Content from ${path.basename(filePath)} ---\n${fileContent}`;
                        }
                    }
                }
                chatProvider.addContext(combinedContext); // Add the content from directories to chatProvider
                vscode.window.showInformationMessage('Context loaded from selected directories.');

                // Send the directory content to the webview if active
                if (WebViewProvider.panel) {
                    WebViewProvider.panel.webview.postMessage({
                        command: 'loadContext',
                        context: combinedContext
                    });
                }
            }
        }
    }

    static panel: vscode.WebviewPanel | undefined; // Keep track of the webview panel

    // Create or show the webview panel
    static createOrShowWebView(context: vscode.ExtensionContext, chatProvider: any) {
        if (WebViewProvider.panel) {
            WebViewProvider.panel.reveal(); // If the panel exists, reveal it
        } else {
            // Create a new webview panel
            WebViewProvider.panel = vscode.window.createWebviewPanel(
                'aiChatbot', // View type
                'AI Chatbot', // Title of the panel
                vscode.ViewColumn.One, // Column to show the webview in
                {
                    enableScripts: true, // Allow scripts in the webview
                    retainContextWhenHidden: true // Keep the context even when hidden
                }
            );

            // Set the HTML content of the webview
            WebViewProvider.panel.webview.html = WebViewProvider.getWebViewContent(context);

            // Send current context to the webview when it's created
            WebViewProvider.panel.webview.postMessage({
                command: 'loadContext',
                context: chatProvider.getContext()
            });

            // Dispose of the panel when closed
            WebViewProvider.panel.onDidDispose(() => {
                WebViewProvider.panel = undefined;
            });
        }
    }

    // Generate the HTML content for the webview panel
    static getWebViewContent(context: vscode.ExtensionContext) {
        const scriptUri = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'script.js') // Load external JS script
        ).with({ scheme: 'vscode-resource' });
    
        const styleUri = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'style.css') // Load external CSS stylesheet
        ).with({ scheme: 'vscode-resource' });
    
        return `
            <html>
                <head>
                    <link href="${styleUri}" rel="stylesheet" />
                </head>
                <body>
                    <h1>AI Chatbot</h1>
                    <div id="chatOutput"></div> <!-- Chat output display area -->
                    <input type="text" id="userInput" /> <!-- User input field -->
                    <button id="sendButton">Send</button> <!-- Send button -->
                    <script src="${scriptUri}"></script> <!-- Include external script -->
                </body>
            </html>
        `;
    }
}
