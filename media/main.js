const vscode = acquireVsCodeApi();

// Function to handle sending messages to the chat panel
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();  // Trim spaces
    if (message) {
        addMessage('Me', message, false);  // Display the user message in the chat panel
        vscode.postMessage({ command: 'sendMessage', text: message });  // Send the message to VS Code extension API
        input.value = '';  // Clear the input field
    }
}

// Function to display messages in the chat window
function addMessage(sender, text, isAI = false) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isAI ? 'ai-message' : 'user-message');

    // Check if the text is too long (over 4 lines) and add "Read More" functionality
    const isLongMessage = text.split(/\r\n|\r|\n/).length > 4 || text.length > 200; // Adjust as needed
    if (isLongMessage) {
        const shortText = text.substring(0, 200); // Display first 200 characters
        const fullText = document.createElement('span');
        fullText.textContent = text;
        fullText.style.display = 'none';

        const shortTextElement = document.createElement('span');
        shortTextElement.textContent = `${shortText}... `;

        const readMoreLink = document.createElement('button');
        readMoreLink.textContent = 'Read More';
        readMoreLink.classList.add('read-more-button');
        readMoreLink.onclick = () => {
            shortTextElement.style.display = 'none';
            readMoreLink.style.display = 'none';
            fullText.style.display = 'inline';
        };

        messageElement.appendChild(shortTextElement);
        messageElement.appendChild(readMoreLink);
        messageElement.appendChild(fullText);
    } else {
        messageElement.textContent = `${sender}: ${text}`;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;  // Scroll to the bottom to display the latest message
}

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'addMessage':
            // Mark AI responses with isAI = true
            addMessage(message.sender, message.text, message.sender === 'AI');
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
