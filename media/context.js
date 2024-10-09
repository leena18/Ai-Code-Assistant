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
            }else {
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

async function uploadZipFile(fileInput, projectName) {
    // Get the selected file from the file input element
    
    const formData = new FormData();
    
    // Append the file and project name to the form data
    formData.append("file", fileInput);
    formData.append("project_name", projectName);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/upload-file/", {
            method: "POST",
            body: formData,
        });

        // Check if the response is OK
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error:", errorData.message);
            alert(`Error: ${errorData.message}`);
            return;
        }

        // Get the response data
        const data = await response.json();
        console.log("Success:", data);
        
    } catch (error) {
        console.error("Error:", error);
       
    }
}


document.getElementById('addGitLabRepoLink').addEventListener('click', function() {
    const inputBox = document.getElementById('gitLabInputBox');
    inputBox.style.display = inputBox.style.display === 'none' || inputBox.style.display === '' ? 'block' : 'none';
});

document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('gitLabInputBox').style.display = 'none';
});

function closeInputBox() {
    document.getElementById("gitLabInputBox").style.display = "none";
  }

 // Add an event listener for the submit button
 document.getElementById("submitRepoLink").addEventListener("click", function() {
    // Get the input values
    const repoLink = document.getElementById('repoLink').value.trim();
    const authToken = document.getElementById('authToken').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    
    const gitLabInputBox = document.getElementById('gitLabInputBox');
    const loader = document.getElementById('loader');
    const inputBoxContent = document.querySelector('.input-box-content');

    // Show the loader and add blur effect
    loader.style.display = 'block';
    inputBoxContent.classList.add('blur-effect');
    // Reset error message
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
      
    // Basic validation
    if (!isValidURL(repoLink)) {
        errorMessage.textContent = 'Please enter a valid GitLab Repo URL.';
        errorMessage.style.display = 'block';
        return;
      }
  
      if (!authToken) {
        errorMessage.textContent = 'Please enter a valid Auth Token.';
        errorMessage.style.display = 'block';
        return;
      }

 // Function to validate if the URL is a valid GitLab repo link
 function isValidURL(url) {
    const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[a-zA-Z0-9._~:?#@!$&'()*+,;=%-]*)*\/?$/;
    return pattern.test(url);
  }
  



    // Call the backend API function (assuming it's defined in your services folder)
    callGitLabAPI(repoLink, authToken)
      .then(response => {
        // Handle the response if necessary
        console.log("API call successful:", response);
        displayFileList(response.files);
        // Close the input box after the API call
        closeInputBox();
      })
      .catch(error => {
        // Handle the error if the API call fails
        console.error("Error calling API:", error);
      })
      .finally(() => {
        // Hide the loader when the API call is complete
        loader.style.display = 'none';
        inputBoxContent.classList.remove('blur-effect');
      });
    });


  // Function to handle the close button click for the file list box
  function closeFileBox() {
    document.getElementById("fileListBox").style.display = "none";
  }

// Add an event listener for the confirm selection button
document.getElementById("confirmSelection").addEventListener("click", function() {
    // Close the file list box when the button is clicked
    const selectedFiles = [];
    const checkboxes = document.querySelectorAll("#fileListContainer input[type='checkbox']");

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            selectedFiles.push(checkbox.value);
        }
    });

    console.log("Selected files:", selectedFiles);
    
    


    const fileListBox = document.getElementById('fileListBox');
    const fileBoxContent = document.querySelector('.file-box-content');

    // Create and show the loader
    const loader = document.createElement('div');
    loader.className = 'centered-loader';
    fileListBox.appendChild(loader);

    // Disable the content while the loader is visible
    fileBoxContent.classList.add('blur-effect');

    // Call the backend API function (assuming it's defined in your services folder)
    fetchCodeFromPaths(selectedFiles)
        .then(response => {
            // Remove the loader once the response is received
            loader.remove();
            fileBoxContent.classList.remove('blur-effect');

            // Show success message with a checkmark
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <div class="success-icon"></div>
                <span>Done!</span>
            `;
            fileListBox.appendChild(successMessage);
            successMessage.style.display = 'block';

            // Hide the success message after 2 seconds
            setTimeout(() => {
                successMessage.remove();
              //  closeFileBox(); // Close the file box or perform any other action you need
            }, 2000);
        })
        .catch(error => {
            // Handle the error if the API call fails
            console.error("Error in file selection API:", error);
            loader.remove();
            fileBoxContent.classList.remove('blur-effect');
        });

    
  });





 // Function to display the file list with checkboxes
 function displayFileList(files) {
    const fileListContainer = document.getElementById("fileListContainer");
    fileListContainer.innerHTML = ""; // Clear any existing content

    files.forEach((file, index) => {
      // Create checkbox and label for each file
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `file-${index}`;
      checkbox.value = file;

      const label = document.createElement("label");
      label.htmlFor = `file-${index}`;
      label.textContent = file;

      // Wrap the checkbox and label in a div
      const fileDiv = document.createElement("div");
      fileDiv.appendChild(checkbox);
      fileDiv.appendChild(label);

      fileListContainer.appendChild(fileDiv);
    });

    // Show the file list box
    document.getElementById("fileListBox").style.display = "block";
  }












///------------mock function for api call(to be rmeoved and use serivce )--------

 // Example function for the API call (replace with your actual service function)
 async function callGitLabAPI(repoLink, authToken) {
    const apiUrl = 'http://127.0.0.1:8000/api/fetch_repo_structure/';
    // Mocking a response for now with a list of files (replace with your API call)

    const repoRequest = {
        repo_url: repoLink,  // Set your repo URL
        access_token: authToken,      // Set your GitHub access token, if required
        allowed_extensions: ["js", "py", "java"],      // Set the file extensions you want to allow
        user_id: "user1",                       // Set the user ID
        project_id: "project1"                  // Set the project ID
    };


    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(repoRequest)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log("Repository Structure:", data.repository_structure);
        displayFileList(data.repository_structure)
    } catch (error) {
        console.error("Failed to fetch repository structure:", error.message);
    }

    // return new Promise((resolve) => {
    //   const mockResponse = {
    //     files: [
    //       "file1.js", "file2.js", "file3.html", "file4.css", "file5.md",
    //       "file6.py", "file7.java", "file8.ts", "file9.json", "file10.xml"
    //     ]
    //   };
    //   setTimeout(() => resolve(mockResponse), 500); // Simulate API response time
    // });
  }


  async function fetchCodeFromPaths(paths) {
    const apiUrl = 'http://127.0.0.1:8000/api/fetch-code/';  // Update with the correct API URL

    // Create the request payload based on the FilePaths model
    const filePathsRequest = {
        "paths": paths,
        "user_id": "user1",
        "project_id": "project1",
        "ref_repo_name": "blog_spring_react.json"
      }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filePathsRequest)  // Convert the request to JSON
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched Code:", data.code);  // Output the fetched code to the console
    } catch (error) {
        console.error("Failed to fetch code:", error.message);
    }
}

async function createZipFromDirectory(files) {
    const zip = new JSZip();

    Array.from(files).forEach(file => {
        const relativePath = file.webkitRelativePath;
        zip.file(relativePath, file);
    });

    return zip;
}