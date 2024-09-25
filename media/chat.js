const vscode = acquireVsCodeApi();

// Show the .messages class only when the user clicks on send button
document.getElementById('sendButton').addEventListener('click', function() {
    document.querySelector('.messages').style.display = 'block';
});

// Hide the .to-hide class and increase chat container height on send button click
document.getElementById('sendButton').addEventListener('click', function() {
    document.querySelector('.to-hide').style.display = 'none';
    document.querySelector('.chat-container').style.height = '100vh';
});

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

// Function to safely create a text node or HTML elements for the message
function createMessageHTML(message) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message;  // Safely parse HTML
    return tempDiv.childNodes;
}

// Function to display messages in the chat window
function addMessage(sender, text, isAI = false) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isAI ? 'ai-message' : 'user-message');

    const fullTextNode = createMessageHTML(text);  // Properly handle HTML content

    // Check if the text is too long (over 4 lines or 200 characters) and add "Read More" functionality
    const isLongMessage = text.split(/\r\n|\r|\n/).length > 4 || text.length > 200; // Adjust as needed
    if (isLongMessage) {
        const shortText = text.substring(0, 200); // Display first 200 characters
        const shortTextNode = createMessageHTML(`${shortText}...`);  // Properly handle HTML content

        const shortTextElement = document.createElement('span');
        shortTextElement.append(...shortTextNode);

        const fullTextElement = document.createElement('span');
        fullTextElement.append(...fullTextNode);
        fullTextElement.style.display = 'none';

        const readMoreLink = document.createElement('button');
        readMoreLink.textContent = 'Read More';
        readMoreLink.classList.add('read-more-button');

        const readLessLink = document.createElement('button');
        readLessLink.textContent = 'Read Less';
        readLessLink.classList.add('read-more-button');
        readLessLink.style.display = 'none';  // Initially hide the "Read Less" button

        readMoreLink.onclick = () => {
            shortTextElement.style.display = 'none';
            readMoreLink.style.display = 'none';
            fullTextElement.style.display = 'inline';
            readLessLink.style.display = 'inline';
        };

        readLessLink.onclick = () => {
            shortTextElement.style.display = 'inline';
            readMoreLink.style.display = 'inline';
            fullTextElement.style.display = 'none';
            readLessLink.style.display = 'none';
        };

        messageElement.appendChild(shortTextElement);
        messageElement.appendChild(readMoreLink);
        messageElement.appendChild(readLessLink);
        messageElement.appendChild(fullTextElement);
    } else {
        messageElement.append(...fullTextNode);  // Display the full message
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

// Add event listeners for the send button and allow sending messages via the "Enter" key
document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Tab switching logic
document.getElementById('context-tab').addEventListener('click', function() {
    vscode.postMessage({ command: 'switchToContext' }); // Send message to switch to context view
});


document.getElementById('chat-tab').addEventListener('click', function() {
    vscode.postMessage({ command: 'switchToChat' }); // Send message to switch to chat view
});

// i want to switch to the context view
document.getElementById('context-view-tab').addEventListener('click', function() {
    vscode.postMessage({ command: 'switchToContextView' });
});
