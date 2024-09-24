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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ChatPaneel_1 = require("./panels/ChatPaneel");
const commandRegister_1 = require("./features/commandRegister"); // Import for handling commands
function activate(context) {
    // Register the Chat Panel for the activity bar (in the sidebar)
    const chatProvider = new ChatPaneel_1.ChatPanel(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ChatPaneel_1.ChatPanel.viewType, chatProvider));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('aiChat.explainCode', () => {
        (0, commandRegister_1.commandHandler)('explainCode');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aiChat.fixCode', () => {
        (0, commandRegister_1.commandHandler)('fixCode');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aiChat.writeDocstrings', () => {
        (0, commandRegister_1.commandHandler)('writeDocstrings');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aiChat.generateTests', () => {
        (0, commandRegister_1.commandHandler)('generateTests');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('aiChat.exploreCodebase', () => {
        (0, commandRegister_1.commandHandler)('exploreCodebase');
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map