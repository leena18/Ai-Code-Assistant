const vscode = acquireVsCodeApi();

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

// --------------------------------- Handle the Documents 

// Function to handle file upload
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

        // Show success message
        alert(`${file.name} uploaded successfully!`);
    });
}

// Function to create and handle file input for a given button
function createFileInputAndHandleUpload(buttonId, fileListId) {
    document.getElementById(buttonId).addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true; // Allow multiple file uploads

        fileInput.addEventListener('change', function() {
            const fileListElement = document.getElementById(fileListId);
            handleFileUpload(fileInput, fileListElement);
        });

        fileInput.click(); // Trigger the file selection dialog
    });
}

// Add file upload logic for the respective buttons
createFileInputAndHandleUpload('addTechDoc', 'techDocumentsList'); // Tech Document Upload
createFileInputAndHandleUpload('addReqDoc', 'reqDocumentsList');   // Requirement Document Upload
createFileInputAndHandleUpload('addFileContext', 'contextFilesList'); // Context File Upload


// Handle directory upload (upload as zip)
document.getElementById('addDirectoryContext').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true; // Allow directory selection
    input.addEventListener('change', (event) => {
        const files = event.target.files;
        const zip = new JSZip(); // Using JSZip library to create zip file

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            zip.file(file.webkitRelativePath, file); // Store the file in the zip
        }

        // Generate the zip file
        zip.generateAsync({ type: "blob" }).then((content) => {
            // Create a link to download the zip
            const blobUrl = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'uploaded_directory.zip'; // Name for the downloaded zip
            a.click();
            alert('Directory uploaded successfully as a zip file!');
        });
    });

    input.click(); // Trigger the directory selection dialog
});

// Handle context buttons
document.getElementById('addCodeBlockContext').addEventListener('click', () => {
    vscode.postMessage({ command: 'addCodeBlockContext' });
});
