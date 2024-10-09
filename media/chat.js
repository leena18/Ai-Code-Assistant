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

function generateCode() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();  // Trim spaces
    if (message) {
        addMessage('Me', message, false);  // Display the user message in the chat panel
        vscode.postMessage({ command: 'generateCode', text: message });  // Send the message to VS Code extension API
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

// Function to display messages in the chat window
function addMessage(sender, text, isAI = false) {
    const messagesDiv = document.getElementById("messages");
  
   
    // Create the icon element
    const iconElement = document.createElement("img");
  
    iconElement.src = isAI ? "https://cdn-icons-png.flaticon.com/512/10881/10881863.png" : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    iconElement.alt = isAI ? "LASK" : "User";
    iconElement.classList.add(isAI ? "ai-icon" : "user-icon");
    // Create the message element
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", isAI ? "ai-message" : "user-message");
  
    const fullTextNode = createMessageHTML(text); // Properly handle HTML content
  
    // Check if the text is too long (over 4 lines or 200 characters) and add "Read More" functionality
    const isLongMessage = text.split(/\r\n|\r|\n/).length > 4 || text.length > 200;
    if (isLongMessage) {
      const shortText = text.substring(0, 200);
      const shortTextNode = createMessageHTML(`${shortText}...`);
  
      const shortTextElement = document.createElement("span");
      shortTextElement.append(...shortTextNode);
  
      const fullTextElement = document.createElement("span");
      fullTextElement.append(...fullTextNode);
      fullTextElement.style.display = "none";
  
      const readMoreLink = document.createElement("button");
      readMoreLink.textContent = "Read More";
      readMoreLink.classList.add("read-more-button");
  
      const readLessLink = document.createElement("button");
      readLessLink.textContent = "Read Less";
      readLessLink.classList.add("read-less-button");
      readLessLink.style.display = "none";
  
      readMoreLink.onclick = () => {
        shortTextElement.style.display = "none";
        readMoreLink.style.display = "none";
        fullTextElement.style.display = "inline";
        readLessLink.style.display = "inline";
      };
  
      readLessLink.onclick = () => {
        shortTextElement.style.display = "inline";
        readMoreLink.style.display = "inline";
        fullTextElement.style.display = "none";
        readLessLink.style.display = "none";
      };
  
      messageElement.appendChild(shortTextElement);
      messageElement.appendChild(readMoreLink);
      messageElement.appendChild(readLessLink);
      messageElement.appendChild(fullTextElement);
    } else {
      messageElement.append(...fullTextNode);
    }
  
    // Append the icon and message element to the container
    messageElement.appendChild(iconElement);
    
  
    // Add the container to the messages div
    messagesDiv.appendChild(messageElement);
  
  
  
    // Add Copy and Insert buttons for AI messages
    if (isAI) {
      // Copy button
      // Create the Copy button
      const copyButton = document.createElement("button");
      copyButton.textContent = "Copy"; // Set the text content
      copyButton.classList.add("copy-button");
  
      // Copy functionality
      copyButton.onclick = () => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            alert("Code copied to clipboard!");
          })
          .catch((err) => {
            console.error("Could not copy text: ", err);
          });
      };
  
  
      // Create the Insert button
      const insertButton = document.createElement("button");
      insertButton.textContent = "Insert"; // Set the text content
      insertButton.classList.add("insert-button");
  
      // Insert functionality
      insertButton.onclick = () => {
        
          vscode.postMessage({ command: 'insertCodeBlock', text: text });
  
      };
  
      messageElement.appendChild(copyButton);
      messageElement.appendChild(insertButton);
    }
  
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom to display the latest message
  }
  
  // Function to insert code at the current cursor position
  function insertAtCursor(text) {
    const input = document.getElementById("messageInput");
    const start = input.selectionStart;
    const end = input.selectionEnd;
  
    // Insert the text at the current cursor position
    input.value =
      input.value.substring(0, start) + text + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length; // Move the cursor after the inserted text
  }
  
// Listen for messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    
    console.log("Message received in chat.js: ", message);
  
    switch (message.command) {
    
  
      case 'addMessage':
        // Mark AI responses with isAI = true
        if (message.sender === 'AI') {
          message.text = `<pre><code>${message.text}</code></pre>`;
          Prism.highlightAll();
        }
  
        addMessage(message.sender, message.text, message.sender === 'AI');
        break;
  
      default:
        console.warn("Unknown command received: ", message.command);
        break;
    }
  });
// Add event listeners for the send button and allow sending messages via the "Enter" key
document.getElementById('sendButton').addEventListener('click', sendMessage);

//code button
document.getElementById('generateCodeButton').addEventListener('click', generateCode);
document.getElementById('messageInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});



// Add event listeners for the send button and allow sending messages via the "Enter" key
document.getElementById("sendButton").addEventListener("click", sendMessage);

//code button
document
  .getElementById("generateCodeButton")
  .addEventListener("click", generateCode);
document
  .getElementById("messageInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

// Tab switching logic
document.getElementById("context-tab").addEventListener("click", function () {
  vscode.postMessage({ command: "switchToContext" }); // Send message to switch to context view
});

document.getElementById("chat-tab").addEventListener("click", function () {
  vscode.postMessage({ command: "switchToChat" }); // Send message to switch to chat view
});
