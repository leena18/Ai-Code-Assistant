
import * as vscode from 'vscode';
import * as path from 'path';
import FormData from 'form-data';
import * as stream from 'stream';
import {startMonitoring} from '../extension';
import { handleWebviewMessage } from '../services/messageHandler'; // Import message handler
import { loadContextData, addContextData } from '../services/contextService'; // Import context handler
import { loadHtml } from '../services/htmlLoader'; // Import HTML loader
import { getGlobalState, updateGlobalState } from '../extension';

export class ChatPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChat.chatPanel';
    private _view?: vscode.WebviewView;


    

    constructor(private readonly _extensionUri: vscode.Uri) {}
    
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media'))]
        };
         // Load the HTML for the chat view
         webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
        


    // Method to load the project setup HTML


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

}