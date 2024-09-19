const vscode = require('vscode');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const FileSelector = require('./selectors/fileSelector'); // Adjust path as necessary


const ContextManager = require('./contextManager'); // Adjust the path if necessary

dotenv.config();

// Hard-coded API Key
const apiKey = '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';

// Initialize the Groq API client with the hard-coded API key
const groq = new Groq({
    apiKey: apiKey
});

class ExperimentViewProvider {
    constructor(_extensionUri) {
        this.extensionUri = _extensionUri;
    }


    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
        };
    
        webviewView.webview.html = this.getWebviewContent();
    
        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':

                const userMessage = message.text;
             
                // Call the Groq API with the user's message
                try {
                    const response = await this.callGroqAPI(userMessage);
    
                    // Format response for CodeMirror
                    const formattedResponse = response.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, language, code) => {
                        return `<textarea class="CodeMirror" readonly>${code}</textarea>`;
                    });
    
                    webviewView.webview.postMessage({
                        command: 'showResponse',
                        text: formattedResponse
                    });
                } catch (error) {
                    console.error('Error from Groq API:', error);
                    webviewView.webview.postMessage({
                        command: 'showResponse',
                        text: 'Sorry, there was an error with the AI.'
                    });
                }


                case 'addCodeBlockContext':
                // Handle adding code block context here
                this.addCodeBlockContext();
                break;




            }

          
           




        });
    }
    

    
    async addCodeBlockContext() {
    try {
        // Use FileSelector to get the file URI
        const selectedFiles = await FileSelector.loadFilesFromWorkspace();

        if (selectedFiles.length > 0) {
            const fileUri = selectedFiles[0]; // Assuming we are picking only one file
            const filePath = fileUri.fsPath;

            // Read the file content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error reading file: ${err.message}`);
                    return;
                }

                // Store the content in the ContextManager
                ContextManager.addContext(data);

                // Show success message
                vscode.window.showInformationMessage('Code block context added successfully.');

                // Optionally, show a preview or further process the content
                console.log(`Added Code Block Context: ${data.substring(0, 200)}...`); // Log a preview
            });
        } else {
            vscode.window.showInformationMessage('No file selected.');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}
    
    
    getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chatbot</title>
    <style>
       html, body {
    height: 100%;
    margin: 0; /* Ensure there's no default margin */
}
        #navbar {
            
            padding: 5px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content:space-between;
        }
        .nav-button {
            background-color: #ddd;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
        }
        .nav-button.active {
            background-color: #bbb;
        }



        #profileMenu {
            margin-left: auto;
            display: flex;
            align-items: center;
            position: relative;
        }
        
        #profileIcon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
            cursor: pointer;
        }
        
        #threeDotMenu {
            position: relative;
        }
        
        #menuButton {
             background-color: transparent;
             color:#ffff;
            border: none;
            font-size: 18px;
            cursor: pointer;
        }
        
        #menuOptions {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        #menuOptions a {
            padding: 10px;
            text-decoration: none;
            color: #333;
            display: block;
        }
        
        #menuOptions a:hover {
            background-color: #f0f0f0;
        }
        
        #menuOptions.hidden {
    display: none; /* Hide the menu options */
}



        #chatPage, #contextPage {
            display: none;
        }
        #chatPage.active, #contextPage.active {
            display: block;
            height: 100%;
        }
        #chatOutput {
            // border: 1px solid #ddd;
            padding: 10px;
            height: 500px;
            overflow-y: scroll;
        }
       #userInput {
    width: 80%;
    padding: 8px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box; /* Include padding and border in element's total width and height */
    transition: border-color 0.3s ease;
}

#userInput:focus {
    border-color: #007acc; /* Change border color on focus */
    outline: none; /* Remove default focus outline */
}

#sendButton {
    width: 18%;
    padding: 8px;
    border: none;
    border-radius: 4px;
    background-color: #007acc; /* Blue background */
    color: white; /* White text */
    font-size: 14px;
    cursor: pointer; /* Pointer cursor on hover */
    transition: background-color 0.3s ease;
}

#sendButton:hover {
    background-color: #005fa3; /* Darker blue on hover */
}

#sendButton:active {
    background-color: #004d7a; /* Even darker blue on click */
}

        #contextOptions {
            margin-top: 20px;
        }
        #contextOptions button {
            margin: 5px;
            padding: 5px;
            font-size:12px;
            cursor: pointer;
        }
        #contextOptions button.active {
            background-color: #ddd;
        }
            #contextOptions {
    display: flex;
    flex-direction: column; /* Stack buttons vertically */
    gap: 10px; /* Space between buttons */
}

.chat-input-container {
    display: flex;
    gap: 5px;
    margin-top: 10px; 
}


.context-button {
    background-color: #156ca1 ; /* Primary button color */
    color: #fff; /* Text color */
    border: none; /* Remove default border */
    padding: 10px 15px; /* Button padding */
    border-radius: 10px; /* Rounded corners */
    font-size: 10px; /* Font size */
    cursor: pointer; /* Pointer cursor on hover */
    transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
}

.context-button:hover {
    background-color: #0056b3; /* Darker background on hover */
    transform: scale(1.05); /* Slight zoom effect */
}

.context-button:focus {
    outline: none; /* Remove default focus outline */
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5); /* Add custom focus outline */
}

/*------------------- Upload section container */
h3 {
    font-size: 1.8em;
    font-weight: 600;
    margin-bottom: 1em;
    
    
}

/* Upload section container */
.upload-section {
    
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    max-width: 600px;
    margin: 20px auto;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

/* Section headings */
.upload-section h4 {
    font-size: 1.4em;
    font-weight: 500;
    margin-bottom: 10px;
    
}

/* Input file styling */
.upload-section input[type="file"] {
    display: block;
 
    
    margin-bottom: 15px;
   
    
 
    
    cursor: pointer;
}

/* Button styling */
.upload-section button {
    background-color: #098972;
    color: white;
    border: none;
    padding: 5px 15px;
    font-size: 1em;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: block;
    width: 30%;
    margin-top: 10px;
}

.upload-section button:hover {
    background-color: #45a049;
}

/* File list styling */
.file-list {
    list-style-type: none;
    padding: 0;
    margin-top: 10px;
}

.file-item {
    display: flex;
    justify-content: space-between;
    
    padding: 8px 12px;
    margin-bottom: 8px;
    
    font-size: 0.95em;
}

.remove-file {
    color: #ff5c5c;
    cursor: pointer;
    font-size: 1.2em;
    margin-left: 10px;
}

.remove-file:hover {
    color: #ff2c2c;
}






    </style>
</head>
<body>
    <div id="navbar">


    <div>  

    <button class="nav-button active" id="chatNav">Chat</button>
    <button class="nav-button" id="contextNav">Context</button>
    
    </div>


    <!-- Profile and Menu Section -->
    <div id="profileMenu">
             
        <img src="https://i.pinimg.com/originals/07/66/d1/0766d183119ff92920403eb7ae566a85.png" alt="Profile" id="profileIcon" />
        <div id="threeDotMenu">
            <button id="menuButton">...</button>
            <div id="menuOptions" class="hidden">
                <a href="#settings">Settings</a>
                <a href="#help">Help</a>
                <a href="#login">Login</a>
            </div>
        </div>
    </div>
</div>

    
    <!-- Chat Page -->
    <div id="chatPage" class="active">
        <h2>Welcome to Lask.AI✨</h2>
        <div id="chatOutput"></div>

        <div class="chat-input-container">
        <input type="text" id="userInput" placeholder="Type your message..." />
        <button id="sendButton">Send</button>
   
        </div>
     </div>
    <!-- Context Page -->
    <div id="contextPage">
        <h3>🧠Context Management</h3>
       <div id="contextOptions">
    <button class="context-button" id="addFileContext">+ Add File Context</button>
    <button class="context-button" id="addCodeBlockContext">+ Add Code Block Context</button>
    <button class="context-button" id="addDirectoryContext">+ Add Directory Context</button>
    <button class="context-button" id="addGitHubRepoContext">+ Add GitHub Repo Context</button>
    
</div>

<!-- Documents Page (Updated) -->
<div id="documentsPage" class="hidden"> <!-- Initially hidden -->
    <h3>📎Attach documents</h3>
    
    <!-- Technical Document Upload Section -->
    <div class="upload-section">
        <h4>Upload Technical Document:</h4>
        <input type="file" id="techDocumentUpload" multiple accept=".pdf, .doc, .docx, .txt" />
        <button id="uploadTechDocumentButton">Upload</button>

        <!-- List of uploaded technical documents -->
        <ul id="techDocumentsList" class="file-list"></ul>
    </div>

    <!-- Requirement Document Upload Section -->
    <div class="upload-section">
        <h4>Upload Requirement Document:</h4>
        <input type="file" id="reqDocumentUpload" multiple accept=".pdf, .doc, .docx, .txt" />
        <button id="uploadReqDocumentButton">Upload</button>

        <!-- List of uploaded requirement documents -->
        <ul id="reqDocumentsList" class="file-list"></ul>
    </div>
</div>




    </div>
    
    <script>




    //--------------------main js 


        const vscode = acquireVsCodeApi();
        
        document.getElementById('chatNav').addEventListener('click', () => {
            document.getElementById('chatPage').classList.add('active');
            document.getElementById('contextPage').classList.remove('active');
            document.getElementById('chatNav').classList.add('active');
            document.getElementById('contextNav').classList.remove('active');
        });
        
        document.getElementById('contextNav').addEventListener('click', () => {
            document.getElementById('chatPage').classList.remove('active');
            document.getElementById('contextPage').classList.add('active');
            document.getElementById('chatNav').classList.remove('active');
            document.getElementById('contextNav').classList.add('active');
        });


// ----------------------------------chat js 

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

// -------------handle menu 


document.getElementById('menuButton').addEventListener('click', () => {
    const menuOptions = document.getElementById('menuOptions');
    menuOptions.classList.toggle('hidden');
});

document.getElementById('profileIcon').addEventListener('click', () => {
    // Optionally handle profile icon click
});






//--------------------------------- handle the documents 



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

       

       window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'showResponse') {
                const botResponseElement = document.createElement('div');
                botResponseElement.innerHTML = 'AI: <pre class="CodeMirror"><code>' + message.text + '</code></pre>';
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







    </script>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
           <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.3/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.3/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.3/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.3/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.3/mode/htmlmixed/htmlmixed.min.js"></script>




</body>
</html>
`;
    }


 
    
   
   
    async callGroqAPI(userMessage) {
        try {
            // Retrieve context from ContextManager
            const context = ContextManager.getContext();
            
            // Combine context with user message
            const combinedMessage = context ? `${context}\n\nUser: ${userMessage}` : `User: ${userMessage}`;
    
            // Create a chat completion request
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'user', content: combinedMessage }
                ],
                model: 'llama3-8b-8192',
                temperature: 1,
                max_tokens: 1024,
                top_p: 1,
                stream: false, // Adjust based on Groq SDK's capabilities
                stop: null
            });
    
            // Extract response text
            return chatCompletion.choices[0]?.message?.content || '';
    
        } catch (error) {
            console.error('Error from Groq API:', error);
            return 'Sorry, there was an error communicating with the AI.';
        }
    }
}


  // ----------------------------------Command to fix selected code using Lask.AI (Groq API)
  
  const fixCodeCommand = vscode.commands.registerCommand('aiChatbot.fixCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
                // Prompt template for fixing code
                const fixPromptTemplate = `
                    You are an AI assistant. fix the error in the code and rewrite the whole code with comments:
                    ${selectedText}

                    code:

                    Your code is given above
                    Return only the code without any explanations.
                `;

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: fixPromptTemplate
                        }
                    ],
                    model: 'gemma-7b-it',
                    temperature: 1,
                    max_tokens: 1024,
                    top_p: 1,
                    stop: ["Your code is given above"]
                });

                let suggestedFix = chatCompletion.choices[0]?.message?.content || 'No fix suggested.';

                // Generalized trimming for the first line and last line (removing ```language at start and ``` at end)
                const lines = suggestedFix.split('\n'); // Split the content by new lines
                
                // Check if the first line starts with ```
                if (lines[0].startsWith('```')) {
                    lines.shift(); // Remove the first line
                }
                
                // Check if the last line is ```
                if (lines[lines.length - 1].startsWith('```')) {
                    lines.pop(); // Remove the last line
                }
                
                // Join the remaining lines back into a single string
                const trimmedSuggestedFix = lines.join('\n').trim();

                suggestedFix=trimmedSuggestedFix;




                // Show popup with suggested fix
                const action = await vscode.window.showInformationMessage(
                    `Suggested fix:\n${suggestedFix}`,
                    'Accept', 'Reject'
                );

                if (action === 'Accept') {
                    // Apply the fix in the editor
                    editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, suggestedFix); // Replace code with fix
                    });
                    vscode.window.showInformationMessage('Code fix applied.');
                } else {
                    vscode.window.showInformationMessage('Code fix rejected.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get a fix from Lask.AI.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
});



//-------------------------------commments feature 


// Command to add comments to selected code using Lask.AI (Groq API)
const addCommentsCommand = vscode.commands.registerCommand('aiChatbot.addComments', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selectedText = editor.document.getText(editor.selection);

        if (selectedText) {
            try {
                // Prompt template for adding comments to the selected code
                const commentPromptTemplate = `
                    You are an AI assistant. Your task is to add useful, precise, and beginner-friendly comments to the code provided below:
                    
                    ${selectedText}

                    Code with comments:

                    Return only the code with comments without any further explanation.
                `;

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'user',
                            content: commentPromptTemplate
                        }
                    ],
                    model: 'gemma-7b-it',  // Use an appropriate model
                    temperature: 1,
                    max_tokens: 1024,
                    top_p: 1,
                    stop: ["Code with comments:"]
                });

                let commentedCode = chatCompletion.choices[0]?.message?.content || 'No comments suggested.';

                // Generalized trimming for the first line and last line (removing ```language at start and ``` at end)
                const lines = commentedCode.split('\n'); // Split the content by new lines
                
                // Check if the first line starts with ```
                if (lines[0].startsWith('```')) {
                    lines.shift(); // Remove the first line
                }
                
                // Check if the last line is ```
                if (lines[lines.length - 1].startsWith('```')) {
                    lines.pop(); // Remove the last line
                }
                
                // Join the remaining lines back into a single string
                const trimmedCommentedCode = lines.join('\n').trim();

                commentedCode = trimmedCommentedCode;

                // Show popup with the commented code
                const action = await vscode.window.showInformationMessage(
                    `Code with suggested comments:\n${commentedCode}`,
                    'Accept', 'Reject'
                );

                if (action === 'Accept') {
                    // Apply the commented code in the editor
                    editor.edit(editBuilder => {
                        editBuilder.replace(editor.selection, commentedCode); // Replace code with commented code
                    });
                    vscode.window.showInformationMessage('Comments added to code.');
                } else {
                    vscode.window.showInformationMessage('Comment suggestion rejected.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get comments from Lask.AI.');
                console.error(error);
            }
        } else {
            vscode.window.showErrorMessage('No code selected.');
        }
    }
});









/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "experiment" is now active!');

    const provider = new ExperimentViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "experiment.sidebarView",
            provider
        )
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
