const vscode = acquireVsCodeApi(); // Acquire the VS Code API

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    const sendButton = document.querySelector('.send-button');
    const inputField = document.querySelector('#ask-input');
    const inputContainer = document.querySelector('.input-container');
    const fileNames = ['file1.txt', 'file2.js', 'file3.html', 'file4.css', 'file5.java']; // Sample file names
    const atButton = document.getElementById('atButton');
    const dropdown = document.getElementById('fileDropdown');

    // Function to render the file list with checkboxes
    function renderDropdown(files) {
        const dropdown = document.getElementById('fileDropdown');
        dropdown.innerHTML = '';
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = file;
            checkbox.name = file;
            
            const label = document.createElement('label');
            label.htmlFor = file;
            label.title = file; // Add title for full path on hover
            label.textContent = file;
            
            fileItem.appendChild(checkbox);
            fileItem.appendChild(label);
            dropdown.appendChild(fileItem);
        });
        dropdown.style.display = 'block';
    }


    

    // Toggle the dropdown visibility and request the file list when @ button is clicked
    atButton.addEventListener('click', function () {
        if (dropdown.style.display === 'none') {
            console.log("Fetching opened files from VS Code extension...");
            vscode.postMessage({ command: 'getOpenedFiles' });
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'fileList') {
            renderDropdown(message.files); // Render the file list
            dropdown.style.display = 'block';
        }
    });
    
    
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
            // Request userId and projectId from the extension
            const data = await requestGlobalState('lask');
            
            console.log(data.value);
           console.log(data.curr_file_code);
           
            // Call the API to get the AI response, and pass userId and projectId
            const responseMessage = await sendMessageToAPI(userMessage, data.value['user_id'], data.value['project_id'],data.curr_file_code);
    
            // Add the AI response to the chat container
            addMessageToChat('ai', formatResponse(responseMessage));
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChat('error', 'Something went wrong. Please try again.');
        }
    });
    
    // Function to request global state from the extension
    function requestGlobalState(key) {
        return new Promise((resolve, reject) => {
            window.addEventListener('message', event => {
                const message = event.data;
                console.log(message);
                
                if (message.command === 'globalState' && message.key === key) {
                    resolve(message);
                }
            });
    
            // Send a message to the extension to request the global state
            vscode.postMessage({
                command: 'getGlobalState',
                key: key
            });
        });
    }
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
    async function sendMessageToAPI(message, userId, projectId, curr_file_code) {
        console.log('Sending message:', message);

        const apiUrl = 'http://localhost:8000/api/general-chat/'; // Replace with your actual API URL
        const payload = {
            question: message,
            project_name: projectId,
            user_id: userId,
            project_id: projectId,
            curr_file_context: curr_file_code
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
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const useContextButton = document.getElementById('use-context');

    let selectedFiles = JSON.parse(sessionStorage.getItem('selectedFiles')) || [];

    function requestGlobalState(key) {
        return new Promise((resolve, reject) => {
            window.addEventListener('message', event => {
                const message = event.data;
                console.log(message);
                
                if (message.command === 'globalState' && message.key === key) {
                    resolve(message);
                }
            });
    
            // Send a message to the extension to request the global state
            vscode.postMessage({
                command: 'getGlobalState',
                key: key
            });
        });
    }
    remoteContextTab.addEventListener('change', () => {
        if (remoteContextTab.checked) {
            overlay.style.display = 'block';
        }
    });

    closeOverlay.addEventListener('click', () => {
        overlay.style.display = 'none';
        remoteContextTab.checked = false;
    });


    // form.addEventListener('submit', async (e) => {
    //     e.preventDefault();

    //     const repoUrl = document.getElementById('repo-url').value;
    //     const accessToken = document.getElementById('access-token').value;

    //     const data = await requestGlobalState('lask');
    //     const userId = data.value["user_id"];
    //     const projectId = data.value["project_id"];
    //     const allowedExtensions = ['.js', '.py', '.html'];  // Define allowed file extensions

    //     // Call the API using fetch
    //     try {
    //         const response = await fetch('http://127.0.0.1:8000/api/fetch_repo_structure/', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 repo_url: repoUrl,
    //                 access_token: accessToken,
    //                 allowed_extensions: allowedExtensions,
    //                 user_id: userId,
    //                 project_id: projectId
    //             })
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const responseData = await response.json();
    //         console.log('Repository Structure:', responseData.repository_structure);

    //         // Call displayFileList with the received repository structure
    //         displayFileList(responseData.repository_structure);

    //     } catch (error) {
    //         console.error('Error fetching repository structure:', error);
    //     }
    // });

    // function displayFileList(files) {
    //     fileList.innerHTML = '';
    //     files.forEach(file => {
    //         const li = document.createElement('li');
    //         const checkbox = document.createElement('input');
    //         checkbox.type = 'checkbox';
    //         checkbox.value = file;
    //         checkbox.checked = selectedFiles.includes(file);
    //         checkbox.addEventListener('change', () => {
    //             if (checkbox.checked) {
    //                 selectedFiles.push(file);
    //             } else {
    //                 selectedFiles = selectedFiles.filter(f => f !== file);
    //             }
    //             sessionStorage.setItem('selectedFiles', JSON.stringify(selectedFiles));
    //         });
    //         li.appendChild(checkbox);
    //         li.appendChild(document.createTextNode(file));
    //         fileList.appendChild(li);
    //     });
    //     fileListContainer.style.display = 'block';
    // }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const repoUrl = document.getElementById('repo-url').value;
        const accessToken = document.getElementById('access-token').value;
        const fileListContainer = document.getElementById('file-list-container');
        const fileList = document.getElementById('file-list'); // UL element to display the file list
    
        const data = await requestGlobalState('lask');
        const userId = data.value["user_id"];
        const projectId = data.value["project_id"];
        const allowedExtensions = ['.js', '.py', '.html'];  // Define allowed file extensions
    
        // Create a loader element dynamically and place it above the file list container
        const loaderElement = document.createElement('div');
        loaderElement.id = 'loader';
        loaderElement.classList.add('dots-loader');
        loaderElement.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        fileListContainer.parentNode.insertBefore(loaderElement, fileListContainer); // Insert loader above the fileListContainer
    
        fileListContainer.style.display = 'none';  // Hide the file list container while loading
    
        try {
            const response = await fetch('http://127.0.0.1:8000/api/fetch_repo_structure/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    repo_url: repoUrl,
                    access_token: accessToken,
                    allowed_extensions: allowedExtensions,
                    user_id: userId,
                    project_id: projectId
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const responseData = await response.json();
            console.log('Repository Structure:', responseData.repository_structure);
    
            // Remove the loader and display the file list
            loaderElement.remove();  // Remove loader after data is fetched
            displayFileList(responseData.repository_structure);  // Display the file list
            fileListContainer.style.display = 'block';  // Show the file list container
    
        } catch (error) {
            console.error('Error fetching repository structure:', error);
            loaderElement.remove();  // Remove loader in case of error
        }
    });
    
    function displayFileList(files) {
        const fileList = document.getElementById('file-list'); // UL element to display the file list
        let selectedFiles = JSON.parse(sessionStorage.getItem('selectedFiles')) || [];
    
        fileList.innerHTML = '';  // Clear any previous content
    
        files.forEach(file => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = file;
            checkbox.checked = selectedFiles.includes(file);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedFiles.push(file);
                } else {
                    selectedFiles = selectedFiles.filter(f => f !== file);
                }
                sessionStorage.setItem('selectedFiles', JSON.stringify(selectedFiles));
            });
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(file));
            fileList.appendChild(li);
        });
    
        const fileListContainer = document.getElementById('file-list-container');
        fileListContainer.style.display = 'block';
    }
    

    useContextButton.addEventListener('click', async () => {
        overlay.style.display = 'none';
        remoteContextTab.checked = false;
    
        // Collect necessary data
        const data = await requestGlobalState('lask');
        const userId = data.value["user_id"];
        const projectId = data.value["project_id"];
        const refRepoName = 'your-repo-name'; // Assuming this is fetched from elsewhere or can be set manually
    
        // Retrieve selected files
        const selectedFiles = JSON.parse(sessionStorage.getItem('selectedFiles')) || [];
    
        // Check if there are selected files
        if (selectedFiles.length === 0) {
            console.log('No files selected.');
            return;
        }
    
        // Call the API to fetch code from the selected file paths
        try {
            const response = await fetch('http://127.0.0.1:8000/api/fetch-code/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paths: selectedFiles,
                    user_id: userId,
                    project_id: projectId,
                    ref_repo_name: refRepoName
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const responseData = await response.json();
            console.log('Code Context:', responseData.code);
    
            // Here you can handle the fetched code and update the UI as needed
    
        } catch (error) {
            console.error('Error fetching code from paths:', error);
        }
    });
});


      window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('initLoader').style.display = 'none';
                document.querySelector('.to-hide').style.display = 'grid';
            }, 2000);
        });

        function showTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'inline-block';
        }

        function hideTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'none';
        }

        // Use these functions when sending/receiving messages
        async function sendMessage() {
            showTypingIndicator();
            // Your code to send message
            // const response = await getResponseFromAI();
            hideTypingIndicator();
            // Your code to display the response
        }
