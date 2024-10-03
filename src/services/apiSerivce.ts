import WebSocket from 'ws';
interface QuestionRequest {
    question: string;
    project_name: string;
}

interface CommentRequest {
    code: string;
}

// Function to utilize the WebSocket API for general chat
export async function generalChatWebSocket(
    sessionId: string,
    projectName: string,
    question: string,
    onMessageCallback: (response: string) => void,
    onErrorCallback?: (error: string) => void
): Promise<void> {
    const websocketUrl = "ws://127.0.0.1:8000/api/ws/general-chat/"; // WebSocket URL

    // Create a new WebSocket connection
    const socket = new WebSocket(websocketUrl);

    // WebSocket event handlers

    // When the WebSocket connection is open
    socket.onopen = function () {
        console.log("WebSocket connection opened");

        // Send the initial data with session_id and project_name to the backend
        const initialData = {
            session_id: sessionId,
            project_name: projectName
        };
        socket.send(JSON.stringify(initialData));
        console.log("Initial data sent:", initialData);

        // Send the user's question after establishing the connection
        const questionData = {
            question: question
        };
        socket.send(JSON.stringify(questionData));
        console.log("Question sent:", questionData);
    };

    // When a message is received from the server (AI response or errors)
    socket.onmessage = function (event) {
        const data = JSON.parse(event.data.toString());

        // Check if there's an error
        if (data.error) {
            console.error("Error from server:", data.error);
            if (onErrorCallback) {
                onErrorCallback(data.error);
            }
        } else if (data.response) {
            // If there's a valid response, handle it (call the callback function)
            onMessageCallback(data.response);
        }
    };

    // When the WebSocket connection is closed
    socket.onclose = function () {
        console.log("WebSocket connection closed");
    };

    // When a WebSocket error occurs
    socket.onerror = function (error) {
        console.error("WebSocket error:", error);
        if (onErrorCallback) {
            onErrorCallback("WebSocket connection error");
        }
    };
}

// Regular API POST request for generating code
export async function generateCode(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/generate-code/";

    // Create the request body based on the API's expected input
    const requestBody: QuestionRequest = {
        question: question,
        project_name: projectName
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody) // Convert the request body to JSON
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorData: any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }

        // Parse the response data
        const data: any = await response.json();
        return data.answer; // Extract the 'response' field from the API response
    } catch (error: any) {
        console.error("Error occurred while calling generateCode API:", error);
        return `Error: ${error.message}`;
    }
}

// Regular API POST request for generating comments based on code
export async function generateComments(code: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/generate-comments/"; // API endpoint

    // Create the request body based on the API's expected input
    const requestBody: CommentRequest = {
        code: code
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody) // Convert the request body to JSON
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
            const errorData: any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }

        // Parse the response data
        const data: any = await response.json();
        return data.comments; // Extract the 'comments' field from the API response
    } catch (error: any) {
        console.error("Error occurred while calling generateComments API:", error);
        return `Error: ${error.message}`;
    }
}
