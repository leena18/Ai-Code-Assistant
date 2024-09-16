const vscode = acquireVsCodeApi();
let chatContext = '';

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;

    if (message.command === 'loadContext') {
        chatContext = message.context;
        document.getElementById('chatOutput').innerText = 'Context Loaded: ' + message.context;
    }

    if (message.command === 'receiveAIResponse') {
        const chatOutput = document.getElementById('chatOutput');
        chatOutput.innerHTML += '<p><b>AI:</b> ' + message.text + '</p>';
    }
});

// Send input to the extension when the Send button is clicked
document.getElementById('sendButton').addEventListener('click', () => {
    const input = document.getElementById('userInput').value;
    vscode.postMessage({ command: 'askAI', text: input, context: chatContext });
    document.getElementById('userInput').value = '';
});
