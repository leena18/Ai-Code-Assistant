export interface QuestionRequest {
    question: string;
    project_name: string;
}

export interface CommentRequest {
    code: string;
}


// Function to call the /general-chat/ API and return the response as a string
export async function generalChat(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/general-chat/";

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
            const errorData:any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }
        
        
        // Parse the response data
        const data:any = await response.json();
        
        return data.response; // Extract the 'response' field from the API response
    } catch (error:any) {
        console.error("Error occurred while calling generalChat API:", error);
        return `Error: ${error.message}`;
    }
}
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
            const errorData:any = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }

        // Parse the response data
        const data:any = await response.json();
        return data.answer; // Extract the 'response' field from the API response
    } catch (error:any) {
        console.error("Error occurred while calling generalChat API:", error);
        return `Error: ${error.message}`;
    }
}

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
        console.log("AHHHHHHH#############################");
        

        // Parse the response data
        const data: any = await response.json();
        return data.comments; // Extract the 'comments' field from the API response
    } catch (error: any) {
        console.error("Error occurred while calling generateComments API:", error);
        return `Error: ${error.message}`;
    }
}
