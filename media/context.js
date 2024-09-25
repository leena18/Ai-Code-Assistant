const vscode = acquireVsCodeApi();

document.getElementById('chat-tab').addEventListener('click', function() {
    vscode.postMessage({ command: 'switchToChat' }); // Send message to switch to chat view
});
// Event listener for the Add Context tab
document.getElementById('context-tab').addEventListener('click', function() {
    // Since this is the current page, you can simply scroll to the context section if needed
    document.getElementById('contextPage').scrollIntoView();
});

// Event listener for the Context View tab
document.getElementById('context-view-tab').addEventListener('click', function() {
    // Logic to switch to context view can go here, e.g., show/hide content
    document.getElementById('documentsPage').classList.remove('hidden'); // Unhide documents section
    document.getElementById('contextPage').classList.add('hidden');      // Hide the context section
});

// ---------------------------------- Chat JS
document.getElementById('sendButton').addEventListener('click', function() {
    const userMessage = document.getElementById('userInput').value;
    if (userMessage.trim() !== '') {
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = 'You: ' + userMessage;
        document.getElementById('chatOutput').appendChild(userMessageElement);
        document.getElementById('userInput').value = '';

        // Send message to VS Code extension
        vscode.postMessage({
            command: 'sendMessage',
            text: userMessage
        });
    }
});

// ------------- Handle Menu 
document.getElementById('menuButton').addEventListener('click', () => {
    const menuOptions = document.getElementById('menuOptions');
    menuOptions.classList.toggle('hidden');
});

document.getElementById('profileIcon').addEventListener('click', () => {
    // Optionally handle profile icon click
});

//--------------------------------- Handle the Documents 

// Function to handle uploading files
function handleFileUpload(inputElement, fileListElement) {
    const files = inputElement.files;

    // Loop through each file and add to the list
    Array.from(files).forEach(file => {
        const listItem = document.createElement('li');
        listItem.classList.add('file-item');
        listItem.textContent = file.name;

        // Add remove button (cross sign)
        const removeButton = document.createElement('span');
        removeButton.textContent = '✖';
        removeButton.classList.add('remove-file');
        removeButton.addEventListener('click', () => {
            fileListElement.removeChild(listItem);
        });

        listItem.appendChild(removeButton);
        fileListElement.appendChild(listItem);
    });
}

// Event listener for uploading technical documents
document.getElementById('uploadTechDocumentButton').addEventListener('click', () => {
    const techInput = document.getElementById('techDocumentUpload');
    const techFileList = document.getElementById('techDocumentsList');
    handleFileUpload(techInput, techFileList);
});

// Event listener for uploading requirement documents
document.getElementById('uploadReqDocumentButton').addEventListener('click', () => {
    const reqInput = document.getElementById('reqDocumentUpload');
    const reqFileList = document.getElementById('reqDocumentsList');
    handleFileUpload(reqInput, reqFileList);
});

// Handle context buttons
document.getElementById('addFileContext').addEventListener('click', () => {
    vscode.postMessage({ command: 'addCodeBlockContext' });
});

document.getElementById('addCodeBlockContext').addEventListener('click', () => {
    vscode.postMessage({ command: 'addCodeBlockContext' });
});

document.getElementById('addDirectoryContext').addEventListener('click', () => {
    vscode.postMessage({ command: 'addDirectoryContext' });
});

document.getElementById('addGitHubRepoContext').addEventListener('click', () => {
    vscode.postMessage({ command: 'addGitHubRepoContext' });
});

// Message handling
window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'showResponse') {
        const botResponseElement = document.createElement('div');
        botResponseElement.innerHTML = 'Lask: <pre class="CodeMirror"><code>' + message.text + '</code></pre>';
        document.getElementById('chatOutput').appendChild(botResponseElement);
        
        // Initialize CodeMirror
        const codeBlocks = document.querySelectorAll('.CodeMirror');
        codeBlocks.forEach(block => {
            CodeMirror.fromTextArea(block, {
                mode: 'javascript',
                theme: 'dracula',
                readOnly: true
            });
        });
    }
});
