const vscode = acquireVsCodeApi();

// Function to handle sending messages to the chat panel
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();  // Trim spaces
    if (message) {
        addMessage('Me', message);  // Display the user message in the chat panel
        vscode.postMessage({ command: 'sendMessage', text: message });  // Send the message to VS Code extension API
        input.value = '';  // Clear the input field
    }
}

// Function to display messages in the chat window
function addMessage(sender, text) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${text}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;  // Scroll to the bottom to display the latest message
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'addMessage':
            addMessage(message.sender, message.text);
            break;
    }
});

// Add an event listener for the send button
document.getElementById('sendButton').addEventListener('click', sendMessage);

// Allow sending messages via the "Enter" key
document.getElementById('messageInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
