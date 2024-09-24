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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandHandler = commandHandler;
const vscode = __importStar(require("vscode"));
const groqService_1 = require("../services/groqService");
async function commandHandler(commandType) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No code editor is active.');
        return;
    }
    const code = editor.document.getText(editor.selection);
    let userMessage = '';
    switch (commandType) {
        case 'explainCode':
            userMessage = `Explain the following code: ${code}`;
            break;
        case 'fixCode':
            userMessage = `Fix the following code: ${code}`;
            break;
        case 'writeDocstrings':
            userMessage = `Write docstrings for the following code: ${code}`;
            break;
        case 'generateTests':
            userMessage = `Generate tests for the following code: ${code}`;
            break;
        case 'exploreCodebase':
            userMessage = `Explore the following codebase: ${code}`;
            break;
        default:
            vscode.window.showErrorMessage('Unknown command.');
            return;
    }
    try {
        const response = await (0, groqService_1.groqChatAPI)(userMessage, commandType);
        vscode.window.showInformationMessage(`AI Response: ${response}`);
    }
    catch (error) {
        vscode.window.showErrorMessage('Error processing the command.');
        console.error(error);
    }
}
//# sourceMappingURL=commandRegister.js.map