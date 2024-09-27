import * as vscode from 'vscode';
import { groqChatAPI } from '../services/groqService'; // Groq API handler
import * as path from 'path';
import * as fs from 'fs';
// Importing the marked library


export class ChatPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.chatPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))]
        };

        // Load HTML from external file
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendMessage') {
                const userMessage = message.text;

                try {
                    const response = await generalChat(userMessage, 'string'); // Call the generalChat function
                    this.addMessageToWebview('AI', response);
                } catch (error) {
                    vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                    console.error(error);
                }
            } else if(message.command === 'generateCode'){
                const userMessage = message.text;

                try {
                    const response = await generateCode(userMessage, 'string'); // Call the generalChat function
                    this.addMessageToWebview('AI', response);
                } catch (error) {
                    vscode.window.showErrorMessage('Error communicating with AI chatbot.');
                    console.error(error);
                }
            } else if (message.command === 'switchToContext') {
                webviewView.webview.html = this._getHtmlForContextView(webviewView.webview);
            } else if (message.command === 'switchToChat') {
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            }
            else if (message.command === 'switchToContextView') {
                this.loadContextData(webviewView.webview);
                webviewView.webview.html = this._getHtmlForContextviewView(webviewView.webview);
            } else if (message.command === 'addContext') {
                const { fileListId, files } = message;
                console.log("File List ID:", files ); // Log the fileListId
                
                // Path to store the JSON file
                const filePath = path.join(__dirname, 'contextFiles.json');
        
                // Read the existing file or create a new object if the file does not exist
                let jsonData:any= {};
                if (fs.existsSync(filePath)) {
                    const fileData = fs.readFileSync(filePath, 'utf-8'); // Specify 'utf-8' encoding to read as a string
                    jsonData = JSON.parse(fileData);
                }
        
                // Add or update the data for the fileListId
                jsonData[fileListId] = files;
                console.log("JSON Data:", jsonData); // Log the updated JSON data
                // Write the updated data back to the file
                fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4));
        
                vscode.window.showInformationMessage(`Context added for ${fileListId}`);
            }
        });
    }
    private loadContextData(webview: vscode.Webview) {
        const filePath = path.join(__dirname, 'contextFiles.json');
    
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            const jsonData = JSON.parse(fileData);
            
            // Send the JSON data to the webview
            webview.postMessage({ command: 'loadContextData', data: jsonData });
        } else {
            vscode.window.showErrorMessage('Context data file not found.');
        }
    }
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'chat.js')));

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('chat.css', stylePath.toString());
        htmlContent = htmlContent.replace('chat.js', scriptPath.toString());

        return htmlContent;
    }

    private _getHtmlForContextView(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'context.js')));

        console.log("Style Path:", stylePath.toString()); // Log the CSS path
    console.log("Script Path:", scriptPath.toString()); // Log the JS path

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('context.css', stylePath.toString());
        htmlContent = htmlContent.replace('context.js', scriptPath.toString());

        return htmlContent;
    }
    private _getHtmlForContextviewView(webview: vscode.Webview): string {
        const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.html'));
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        const stylePath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.css')));
        const scriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'contextView.js')));

        console.log("Style Path:", stylePath.toString()); // Log the CSS path
    console.log("Script Path:", scriptPath.toString()); // Log the JS path

        // Replace placeholders in HTML with actual URIs
        htmlContent = htmlContent.replace('contextView.css', stylePath.toString());
        htmlContent = htmlContent.replace('contextView.js', scriptPath.toString());

        return htmlContent;
    }

    private addMessageToWebview(sender: string, message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }
}

interface QuestionRequest {
    question: string;
    project_name: string;
}

// Function to call the /general-chat/ API and return the response as a string
async function generalChat(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/general-chat/";

    // Create the request body based on the API's expected input
    const requestBody: QuestionRequest = {
        question: question,
        project_name: projectName
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody) // Convert the request body to JSON
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorData:any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }
        
        
        // Parse the response data
        const data:any = await response.json();
        
        return data.response; // Extract the 'response' field from the API response
    } catch (error:any) {
        console.error("Error occurred while calling generalChat API:", error);
        return `Error: ${error.message}`;
    }
}
async function generateCode(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/ask-question/";

    // Create the request body based on the API's expected input
    const requestBody: QuestionRequest = {
        question: question,
        project_name: projectName
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody) // Convert the request body to JSON
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorData:any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }

        // Parse the response data
        const data:any = await response.json();
        return data.answer; // Extract the 'response' field from the API response
    } catch (error:any) {
        console.error("Error occurred while calling generalChat API:", error);
        return `Error: ${error.message}`;
    }
}

