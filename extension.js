const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class ExperimentViewProvider {
    constructor(_extensionUri) {
        this.extensionUri = _extensionUri;
    }

    /**
     * @param {vscode.WebviewView} webviewView
     * @param {vscode.WebviewViewResolveContext} context
     * @param {vscode.CancellationToken} _token
     */
    resolveWebviewView(webviewView, context, _token) {
        // Set the webview's HTML content
        webviewView.webview.options = {
            enableScripts: true,
        };

        // Set the webview's HTML content
        webviewView.webview.html = this.getWebviewContent(webviewView.webview);
    }

    getWebviewContent(webview) {
        // Resolve the paths to your HTML, CSS, and JavaScript files
        const htmlPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'webview.html');
        const cssPath = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css'));
        const jsPath = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'script.js'));

        // Read the HTML file
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Inject the URIs into the HTML
        html = html.replace('href="styles.css"', `href="${cssPath}"`);
        html = html.replace('src="script.js"', `src="${jsPath}"`);

        return html;
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "experiment" is now active!');

    const provider = new ExperimentViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('experiment.sidebarView', provider)
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
