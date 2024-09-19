const vscode = acquireVsCodeApi();

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value;
    if (message) {
        addMessage('Me', message);
        vscode.postMessage({ command: 'sendMessage', text: message });
        input.value = '';
    }
}

function addMessage(sender, text) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = sender + ': ' + text;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'addMessage':
            addMessage(message.sender, message.text);
            break;
    }
});

document.getElementById('sendButton').addEventListener('click', sendMessage);
