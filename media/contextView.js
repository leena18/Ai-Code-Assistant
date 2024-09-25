const vscode = acquireVsCodeApi();
document.addEventListener('DOMContentLoaded', function() {

    //Tab Switching
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
    // Simulated storage for uploaded contexts (in a real application, this can come from backend or local storage)
    let contexts = {
        techDocuments: [],
        reqDocuments: [],
        githubRepos: [],
        folders: [],
        contextFiles: []
    };

    // Functions to add items to the respective categories
    function addContext(category, name) {
        const categoryList = document.getElementById(category);
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${name}</span> <button class="remove-btn" onclick="removeContext(this, '${category}')">Remove</button>`;
        categoryList.appendChild(listItem);
    }

    // Load the contexts (from backend, memory, or local storage)
    function loadContexts() {
        // Example data to simulate previously uploaded contexts
        contexts = {
            techDocuments: ['Tech Doc 1.pdf', 'Tech Doc 2.docx'],
            reqDocuments: ['Requirements 1.docx', 'Requirements 2.pdf'],
            githubRepos: ['https://github.com/user/repo1', 'https://github.com/user/repo2'],
            folders: ['Folder 1.zip', 'Folder 2.zip'],
            contextFiles: ['Context File 1.txt', 'Context File 2.docx']
        };

        // Load tech documents
        contexts.techDocuments.forEach(doc => addContext('techDocumentsList', doc));

        // Load requirement documents
        contexts.reqDocuments.forEach(doc => addContext('reqDocumentsList', doc));

        // Load GitHub repositories
        contexts.githubRepos.forEach(repo => addContext('githubRepoList', repo));

        // Load folders
        contexts.folders.forEach(folder => addContext('folderList', folder));

        // Load context files
        contexts.contextFiles.forEach(file => addContext('contextFilesList', file));
    }

    // Remove context function
    window.removeContext = function(button, category) {
        const listItem = button.parentNode;
        listItem.remove();

        // Optionally: remove from the data storage as well
        const contextName = listItem.querySelector('span').textContent;
        contexts[category] = contexts[category].filter(item => item !== contextName);

        alert(`Removed ${contextName} from ${category}!`);
    };

    // Initially load all contexts on page load
    loadContexts();
});
