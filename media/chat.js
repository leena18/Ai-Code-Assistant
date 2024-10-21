const vscode = acquireVsCodeApi(); // Acquire the VS Code API

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    const sendButton = document.querySelector('.send-button');
    const inputField = document.querySelector('#ask-input');
    const inputContainer = document.querySelector('.input-container');
    
    // Create a chat container above the input box to display chat messages
    const chatContainer = document.createElement('div');
    chatContainer.classList.add('chat-container');
    chatContainer.style.display = 'none'; // Initially hide the chat container
    inputContainer.parentNode.insertBefore(chatContainer, inputContainer);
    
    // Send button click event listener
    sendButton.addEventListener('click', async () => {
        const userMessage = inputField.value.trim();
        
        // Don't proceed if input is empty
        if (!userMessage) return;

        // Hide the initial content if it's not hidden already
        if (content.style.display !== 'none') {
            content.style.display = 'none';  // Hide the content section
            chatContainer.style.display = 'block'; // Show the chat container
        }

        // Add user's message to the chat container
        addMessageToChat('user', userMessage);

        // Clear the input field
        inputField.value = '';

        try {
            // Call the API to get the AI response
            const responseMessage = await sendMessageToAPI(userMessage);

            // Add the AI response to the chat container
            addMessageToChat('ai', formatResponse(responseMessage));
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChat('error', 'Something went wrong. Please try again.');
        }
    });

    // Function to add a message to the chat container
    function addMessageToChat(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);

        const messageContent = document.createElement('p');
        messageContent.innerHTML = message;

        messageElement.appendChild(messageContent);
        chatContainer.appendChild(messageElement);
    }

    // Function to send a message to the API
    async function sendMessageToAPI(message) {
        console.log('Sending message:', message);
        
        const apiUrl = 'http://localhost:8000/api/general-chat/'; // Replace with your actual API URL
        const payload = {
            question: message,
            project_name: 'YourProjectName',
            user_id: 'currentUserId',
            project_id: 'currentProjectId',
            curr_file_context: 'OptionalCurrentFileContext'
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch the response from the API');
        }

        const result = await response.json();
        return result.response;
    }

    // Format response with Markdown rendering and code syntax highlighting
    function formatResponse(responseMessage) {
        // Convert the response message from Markdown to HTML using marked
        let htmlContent = marked.parse(responseMessage);

        // Find all code blocks in the HTML content and highlight them
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Highlight all code blocks
        doc.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            
            // Create buttons for each code block
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            
            const insertButton = document.createElement('button');
            insertButton.className = 'insert-button';
            insertButton.innerText = 'Insert';
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerText = 'Copy';
            
            buttonContainer.appendChild(insertButton);
            buttonContainer.appendChild(copyButton);
            
            // Append the button container to the <pre> element
            block.closest('pre').appendChild(buttonContainer);
        });

        // Get the modified HTML content back
        htmlContent = doc.body.innerHTML;

        return `
            <div class="code-container">
                ${htmlContent}  <!-- Rendered HTML from Markdown -->
            </div>
        `;
    }

    // Event delegation to handle clicks on dynamically added buttons
    chatContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('insert-button')) {
            const code = event.target.closest('.code-container').querySelector('code').textContent;
            vscode.postMessage({
                command: 'insertCode',
                text: code
            });
        }

        if (event.target.classList.contains('copy-button')) {
            const code = event.target.closest('.code-container').querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            }).catch((err) => {
                console.error('Failed to copy code: ', err);
            });
        }
    });
});

// Optional: Add keypress event for Enter key to trigger send button click
document.getElementById('ask-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.querySelector('.send-button').click();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const remoteContextTab = document.getElementById('tab-user-profile');
    const overlay = document.getElementById('remote-context-overlay');
    const closeOverlay = document.getElementById('close-overlay');
    const form = document.getElementById('remote-context-form');

    remoteContextTab.addEventListener('change', () => {
        if (remoteContextTab.checked) {
            overlay.style.display = 'block';
        }
    });

    closeOverlay.addEventListener('click', () => {
        overlay.style.display = 'none';
        remoteContextTab.checked = false;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const repoUrl = document.getElementById('repo-url').value;
        const accessToken = document.getElementById('access-token').value;
        
        // Here you can add the logic to handle the form submission
        console.log('Repository URL:', repoUrl);
        console.log('Access Token:', accessToken);

        // Close the overlay after submission
        overlay.style.display = 'none';
        remoteContextTab.checked = false;
    });
});
