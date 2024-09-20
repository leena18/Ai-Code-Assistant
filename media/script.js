const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const chatOutput = document.getElementById('chatOutput');

sendButton.addEventListener('click', function() {
    const userMessage = userInput.value;
    if (userMessage.trim() !== '') {
        const userMessageElement = document.createElement('div');
        userMessageElement.textContent = 'You: ' + userMessage;
        chatOutput.appendChild(userMessageElement);
        userInput.value = '';
        // Simulate the chatbot's response
        setTimeout(function() {
            const botResponse = 'Chatbot: This is a sample response from the chatbot.';
            const botResponseElement = document.createElement('div');
            botResponseElement.textContent = botResponse;
            chatOutput.appendChild(botResponseElement);
        }, 1000);
    }
});
