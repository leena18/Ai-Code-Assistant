
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';
import FormData from 'form-data';
import axios from 'axios';
import * as stream from 'stream';
import {startMonitoring} from '../extension';
import { handleWebviewMessage } from '../services/messageHandler'; // Import message handler
import { loadContextData, addContextData } from '../services/contextService'; // Import context handler
import { loadHtml } from '../services/htmlLoader'; // Import HTML loader

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

        // Load the project setup HTML first
        webviewView.webview.html = this._getHtmlForProjectSetup(webviewView.webview);

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'selectFolder':
                    // Open folder picker and send folder path back to the webview
                    const folderUri = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel: 'Select Folder'
                    });
                    if (folderUri && folderUri.length > 0) {
                    
                        webviewView.webview.postMessage({ command: 'selectedFolder', folderPath: folderUri[0].fsPath });
                    }
                    break;
                case 'submitProject':
                    // Call API with the folder as zip and switch to chat.html
                    const { projectName, folderPath, userName } = message;
                    //await this._sendFolderAsZip(folderPath);
                    console.log(`Project setup submitted for ${projectName} at ${folderPath}`);
                    const zipFileName = await this.zipAndSendFolder(folderPath, 'http://127.0.0.1:8000/api/initialize-project/', projectName, userName, folderPath)
                    startMonitoring(folderPath,userName,projectName,zipFileName);
                    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
                    break;
            }


            await handleWebviewMessage(message, webviewView, this);

        });
    }


    // Method to load the project setup HTML
    private _getHtmlForProjectSetup(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'projectSetup.html');
    }

    // Load the HTML for the chat view
    private _getHtmlForWebview(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'chat.html');
    }

    // Method to add a message to the webview
    public addMessageToWebview(sender: string, message: string) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'addMessage', sender, text: message });
        }
    }

    
    // Load the HTML for the context view
    private _getHtmlForContextView(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'context.html');
    }

    

    // Load the HTML for the context-specific data view
    private _getHtmlForContextviewView(webview: vscode.Webview): string {
        return loadHtml(webview, this._extensionUri, 'contextView.html');
    }

    // Load context data into the webview
    private loadContextData(webview: vscode.Webview) {
        loadContextData(webview);
    }

    // Add context data based on the file list and ID
    public addContextData(fileListId: string, files: string[]) {
        addContextData(fileListId, files);
    }


    /**
 * Zips a folder and sends it as form data without saving to disk
 * @param folderPath - Path of the folder to zip
 * @param uploadUrl - The URL where the form data will be uploaded
 * @param projectId - The project ID to include in the form data
 * @param userId - The user ID to include in the form data
 * @param projectPath - The project path to include in the form data
 */
    async zipAndSendFolder(
        folderPath: string,
        uploadUrl: string,
        projectId: string,
        userId: string,
        projectPath: string
      ): Promise<string> { // Change the return type to Promise<string>
        return new Promise((resolve, reject) => {
          // Create a memory stream to hold the zip file
          const archive = archiver('zip', { zlib: { level: 9 } }); // Highest compression level
          const form = new FormData();
      
            console.log("inside zip funtionn")
          // Create a stream buffer to store the zip in memory
          const zipStream = new stream.PassThrough();
      
          archive.pipe(zipStream);
          console.log("inside zip funtionn2")
          // Append all files and directories from the folder to the archive
          archive.directory(folderPath, false);
          console.log("inside zip funtionn3")
          // Finalize the archive creation
          archive.finalize();
          console.log("inside zip funtionn4")
          const folderName = path.basename(folderPath);
          console.log("inside zip funtionn5")
          const zipFileName = `${folderName}`; // Add .zip extension
          console.log("inside zip funtionn6")

          
          // Add the zip file as a buffer to the form data
          form.append('zip_file', zipStream, { filename: zipFileName });
          
          console.log("inside zip funtionn7")
          // Append additional form fields required by the API
          form.append('project_id', projectId);
          form.append('user_id', userId);
          form.append('project_path', projectPath);
          console.log("inside zip funtionn8")
          // Send the form data using Axios
          axios.post(uploadUrl, form, {
            headers: {
              ...form.getHeaders(), // Attach headers required for form-data
            },
            maxContentLength: Infinity, // Allow large files
            maxBodyLength: Infinity,
          })
          .then(response => {
            console.log('Upload successful:', response.data);
            resolve(zipFileName); // Resolve with the zip file name
          })
          .catch(error => {
            console.error('Upload failed:', error);
            reject(error);
          });
        });
      }
}