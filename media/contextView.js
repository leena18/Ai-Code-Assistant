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


        // Listen for the file path from the extension
        window.addEventListener('message', (event) => {
            const message = event.data;
    
            switch (message.command) {
                case 'loadContextData':
                    const contextData = message.data;
                    console.log('Received context data:', contextData);
                    loadContexts(contextData); // Call loadContexts with the received data
                    break;
            }
        });

        function loadContexts(contextData) {
            // Load Tech Documents
            const techDocumentsList = document.getElementById('techDocumentsList');
            if (contextData.contextFilesList) {
                contextData.contextFilesList.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    techDocumentsList.appendChild(li);
                });
            }
    
            // Load Requirement Documents
            const reqDocumentsList = document.getElementById('reqDocumentsList');
            if (contextData.reqDocumentsList) {
                contextData.reqDocumentsList.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    reqDocumentsList.appendChild(li);
                });
            }
    
            // Add logic for GitHub Repositories and Uploaded Folders if you have data for those
            // For example:
            // if (contextData.githubRepoList) {
            //     contextData.githubRepoList.forEach(repo => {
            //         const li = document.createElement('li');
            //         li.textContent = repo;
            //         githubRepoList.appendChild(li);
            //     });
            // }
            //
            // if (contextData.folderList) {
            //     contextData.folderList.forEach(folder => {
            //         const li = document.createElement('li');
            //         li.textContent = folder;
            //         folderList.appendChild(li);
            //     });
            // }
        }



    // Initially load all contexts on page load
    
});
