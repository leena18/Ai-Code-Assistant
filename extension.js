const vscode = require('vscode');

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

        webviewView.webview.html = this.getWebviewContent();
    }

    getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Webview</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Hello from the Full Sidebar!</h1>
            <p>This is your custom HTML content displayed in the sidebar with a custom icon.</p>
			<h1>AI Chatbot</h1>
                    <div id="chatOutput"></div>  <!-- Display the conversation here -->
                    <input type="text" id="userInput" placeholder="Type your message..."/> <!-- Input field for the chat -->
                    <button id="sendButton">Send</button> <!-- Button to send the input -->
            <script>
				// adding input text in the window
				const userInput = document.getElementById('userInput');
					const sendButton = document.getElementById('sendButton');
						const chatOutput = document.getElementById('chatOutput');
							sendButton.addEventListener('click', function() {
								const userMessage = userInput.value;
									if (userMessage.trim() !== '') {
										const userMessageElement = document.createElement('div');
											userMessageElement.textContent = 'You: ' + userMessage;
												chatOutput.appendChild(userMessageElement);
													userInput.value = '';
														// Simulate the chatbot's response
														setTimeout(function() {
															const botResponse = 'Chatbot: This is a sample response from the chatbot.';
																const botResponseElement = document.createElement('div');
																	botResponseElement.textContent = botResponse;
																		chatOutput.appendChild(botResponseElement);
																		}, 1000);
															}
														});
			</script>
        </body>
        </html>`;
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
