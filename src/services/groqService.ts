import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize the Groq API
const groq = new Groq({
    apiKey: "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"
});

export async function groqChatAPI(userMessage: string): Promise<string> {
    try {

        console.log('User Message Groq:', userMessage);
        // Prompt template for code generation
        const promptTemplate = `
            You are an AI coding assistant. Answer the user queries and provide code if needed.
            Question: ${userMessage}
            code: 
            Return only the code without any explanations or comments.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: promptTemplate
                }
            ],
            model: 'gemma-7b-it',
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        console.log('Chat Completion:', chatCompletion);

        // Extract and return the code from Groq API response
        return chatCompletion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq API Error:', error);
        throw new Error('Error communicating with Groq API');
    }
}
