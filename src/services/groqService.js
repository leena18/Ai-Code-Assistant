"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqChatAPI = groqChatAPI;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables from the .env file
dotenv.config();
// Initialize the Groq API
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY || "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"
});
async function groqChatAPI(userMessage, commandType) {
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
    }
    catch (error) {
        console.error('Groq API Error:', error);
        throw new Error('Error communicating with Groq API');
    }
}
//# sourceMappingURL=groqService.js.map