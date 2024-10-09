import * as vscode from 'vscode';
export interface QuestionRequest {
    question: string;
    project_name: string;
    project_id: string;
    user_id:string,
    curr_file_context:string
}

export interface CommentRequest {
    code: string;
    user_id: string;
    project_id: string;
}


// Function to call the /general-chat/ API and return the response as a string
export async function generalChat(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/general-chat/";

    const curr_file_code = await getCurrentFileCode()
    console.log(curr_file_code);
    
    // Create the request body based on the API's expected input
    const requestBody: QuestionRequest = {
        question: question,
        project_name: projectName,
        project_id: "project1",
        user_id: "user1",
        curr_file_context: curr_file_code
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

async function getCurrentFileCode(): Promise<string> {
    const editor = vscode.window.activeTextEditor; // Get the active text editor

    if (editor) {
        const document = editor.document; // Get the document from the editor
        const code = document.getText(); // Get the full text of the document
        return code; // Return the code
    } else {
        vscode.window.showErrorMessage('No active editor is open.'); // Handle case when no editor is open
        return ""; // Return undefined if no editor is active
    }
}


export async function generateCode(question: string, projectName: string): Promise<string> {
    const url = "http://127.0.0.1:8000/api/generate-code/";

    const curr_file_code = await getCurrentFileCode()
    console.log(curr_file_code);

    // Create the request body based on the API's expected input
    const requestBody: QuestionRequest = {
        question: question,
        project_name: projectName,
        user_id:"user1",
        project_id:"project1",
        curr_file_context:curr_file_code
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
        code: code,
        user_id: "user1",
        project_id: "project1"
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
