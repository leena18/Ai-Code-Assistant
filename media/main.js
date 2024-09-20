import { groqChatAPI } from './groqService';

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const chatContainer = document.getElementById('chatContainer');
    const initialView = document.getElementById('initialView');
    const chatView = document.getElementById('chatView');

    // Initially show the welcome message
    initialView.style.display = 'block';
    chatView.style.display = 'none';

    // Event listener for "Send" button
    sendButton.addEventListener('click', sendMessage);

    // Event listener for pressing "Enter"
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to send a message
    function sendMessage() {
        const message = messageInput.value.trim();

        if (!message) {
            return;
        }

        // Hide the initial view and show the chat panel after the first message
        if (initialView.style.display === 'block') {
            initialView.style.display = 'none';
            chatView.style.display = 'block';
        }

        // Display user's message in the chat
        displayMessage(message, 'chat-message');

        // Clear the input field
        messageInput.value = '';

        // Send the message to the AI service
        sendToAI(message);
    }

    // Function to display a message in the chat panel
    function displayMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(className);
        messageDiv.innerText = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
    }

    // Function to send the message to the AI and display its response
    function sendToAI(message) {
        // Display a loading message while waiting for the AI's response
        displayMessage('AI is processing...', 'chat-response');

        // Call the groqChatAPI to get the AI's response
        groqChatAPI(message, 'chat')
            .then(response => {
                // Display the AI's response in the chat
                displayMessage(`AI: ${response}`, 'chat-response');
            })
            .catch(error => {
                console.error('Error:', error);
                displayMessage('Error in getting AI response.', 'chat-response');
            });
    }
});
