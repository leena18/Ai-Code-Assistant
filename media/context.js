const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    document.getElementById('context-tab').addEventListener('click', function() {
        console.log('Context tab clicked');
        vscode.postMessage({ command: 'switchToContext' });
    });

    document.getElementById('chat-tab').addEventListener('click', function() {
        console.log('Chat tab clicked');
        vscode.postMessage({ command: 'switchToChat' });
    });

    // Constants and elements
    const addCodeContextButton = document.getElementById('addCodeContextButton');
    const addDocumentContextButton = document.getElementById('addDocumentContextButton');
    const codeContextDropdown = document.getElementById('codeContextDropdown');
    const documentContextDropdown = document.getElementById('documentContextDropdown');
    const fileList = document.getElementById('fileList');

    let contexts = []; // Array to store all contexts

    // Helper function to save contexts to a JSON file (mockup)
    function saveContextsToJson() {
        const jsonData = JSON.stringify(contexts, null, 2);
        console.log('Contexts saved to JSON:', jsonData);
    }

    // Helper function to render context items
    function renderContexts() {
        fileList.innerHTML = '';

        contexts.forEach((context, index) => {
            let iconSrc = '';

            // Determine which GIF icon to use based on the context type
            switch (context.type) {
                case 'file':
                    iconSrc = 'resources/file.gif';
                    break;
                case 'directory':
                    iconSrc = 'resources/directory.gif';
                    break;
                case 'code-block':
                    iconSrc = 'resources/code-block.gif';
                    break;
                case 'tech-doc':
                    iconSrc = 'resources/tech-doc.gif';
                    break;
                case 'req-doc':
                    iconSrc = 'resources/req-doc.gif';
                    break;
                default:
                    iconSrc = 'resources/default.gif';
            }

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <img src="${iconSrc}" alt="${context.type} icon" style="width: 20px;">
                ${context.name}
                <span class="remove-context" data-index="${index}">✕</span>
            `;
            fileList.appendChild(listItem);
        });

        // Add event listeners for removal buttons
        document.querySelectorAll('.remove-context').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                contexts.splice(index, 1);
                saveContextsToJson();
                renderContexts();
            });
        });
    }

    // Event Listeners for dropdown visibility
    addCodeContextButton.addEventListener('click', () => {
        codeContextDropdown.style.display = codeContextDropdown.style.display === 'flex' ? 'none' : 'flex';
        documentContextDropdown.style.display = 'none';
    });

    addDocumentContextButton.addEventListener('click', () => {
        documentContextDropdown.style.display = documentContextDropdown.style.display === 'flex' ? 'none' : 'flex';
        codeContextDropdown.style.display = 'none';
    });

    // Event Listeners for adding contexts
    document.getElementById('addFileContext').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                contexts.push({ name: file.name, type: 'file' });
                saveContextsToJson();
                uploadZipFile(input, "string");
                renderContexts();
            } else {
                alert("No file selected. Please select a ZIP file.");
            }
        };
        input.click();
    });

    document.getElementById('addDirectoryContext').addEventListener('click', async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true; // Allows directory selection
        input.onchange = async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const directoryName = files[0].webkitRelativePath.split('/')[0];
                contexts.push({ name: directoryName, type: 'directory' });
                console.log('Directory:', directoryName);

                // Create a ZIP file from the directory
                const zip = await createZipFromDirectory(files);
                console.log('ZIP:', zip);
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                console.log('ZIP blob:', zipBlob);  
                const zipFile = new File([zipBlob], `${directoryName}.zip`, { type: 'application/zip' });
                console.log('ZIP file:', zipFile);

                // Upload the ZIP file
                uploadZipFile(zipFile, directoryName);
                console.log('ZIP file uploaded');

                saveContextsToJson();
                console.log('Contexts saved to JSON', contexts);
                renderContexts();
                console.log('Contexts rendered', contexts);
            }
        };
        input.click();
    });

    document.getElementById('addCodeBlockContext').addEventListener('click', () => {
        const codeBlock = prompt("Enter code block");
        if (codeBlock) {
            contexts.push({ name: 'Code Block', type: 'code-block', content: codeBlock });
            saveContextsToJson();
            renderContexts();
        }
    });

    document.getElementById('addTechDocContext').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.doc,.docx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                contexts.push({ name: file.name, type: 'tech-doc' });
                saveContextsToJson();
                renderContexts();
            }
        };
        input.click();
    });

    document.getElementById('addReqDocContext').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.doc,.docx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                contexts.push({ name: file.name, type: 'req-doc' });
                saveContextsToJson();
                renderContexts();
            }
        };
        input.click();
    });

    // Initial render
    renderContexts();
});

async function createZipFromDirectory(files) {
    const zip = new JSZip();

    Array.from(files).forEach(file => {
        const relativePath = file.webkitRelativePath;
        zip.file(relativePath, file);
    });

    return zip;
}

async function uploadZipFile(file, projectName) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_name", projectName);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/upload-file/", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error:", errorData.message);
            alert(`Error: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        console.log("Success:", data);

    } catch (error) {
        console.error("Error:", error);
    }
}
