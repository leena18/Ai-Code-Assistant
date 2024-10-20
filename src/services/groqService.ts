import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize the Groq API
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "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"
});

export async function groqChatAPI(userMessage: string, commandType: string): Promise<string> {
    try {
        console.log('User Message Groq:', userMessage);
        
        // Adjust prompt based on command type
        let promptTemplate = '';

        switch (commandType) {
            case 'explainCode':
                promptTemplate = `
                    You are an AI coding assistant. Please explain the following code in detail:
                    ${userMessage}
                `;
                break;
            case 'fixCode':
                promptTemplate = `
                    You are an AI coding assistant. Fix any issues in the following code:
                    ${userMessage}
                    Return only the corrected code without any explanations or comments.
                `;
                break;
            case 'writeDocstrings':
                promptTemplate = `
                    You are an AI coding assistant. Write proper docstrings for the following code:
                    ${userMessage}
                `;
                break;
            case 'generateTests':
                promptTemplate = `
                    You are an AI coding assistant. Generate unit tests for the following code:
                    ${userMessage}
                    Return only the test code.
                `;
                break;
            case 'exploreCodebase':
                promptTemplate = `
                    You are an AI coding assistant. Provide a summary or exploration of the following codebase:
                    ${userMessage}
                `;
                break;
            
                case 'nlpCode':
                    promptTemplate = `
    ${userMessage}
    
            Please provide only the code without any explanation or surrounding text. Do not include language-specific formatting like \\\javascript or \\\. Only provide the raw code as output.
                `;
                    
                    break;
            
                    case 'addComments':
                        promptTemplate = `
                            You are an AI assistant. Your task is to add useful, precise, and beginner-friendly comments to the code provided below:
                            
                            ${userMessage}
        
                            Code with comments:
        
                            Return only the code with comments without any further explanation.
                        `;
                        break;






            default:
                promptTemplate = userMessage; // Fallback for unrecognized commands
                break;
        }

        // Chat completion API call
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: promptTemplate
                }
            ],
            model: 'gemma-7b-it', // Assuming this is the model you want to use
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        console.log('Chat Completion:', chatCompletion);

        // Extract and return the response from the Groq API
        return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq API Error:', error);
        throw new Error('Error communicating with Groq API');
    }
}