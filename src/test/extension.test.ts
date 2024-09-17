import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../extension'; // Uncomment and adjust as needed

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Activate command registration', async () => {
		const context: vscode.ExtensionContext = {
			subscriptions: [],
			workspaceState: {} as any,
			globalState: {} as any,
			extensionPath: '',
			asAbsolutePath: () => '',
			storagePath: '',
			globalStoragePath: '',
			logPath: '',
			extensionUri: vscode.Uri.parse(''),
			storageUri: vscode.Uri.parse(''), // Add these missing properties
			globalStorageUri: vscode.Uri.parse(''),
			logUri: vscode.Uri.parse(''),
			extensionMode: vscode.ExtensionMode.Development, // Set the mode (Development, Production, etc.)
			environmentVariableCollection: {} as any,
			secrets: {} as any,
			extension: {} as vscode.Extension<any>,
			languageModelAccessInformation: {} as any
		};

		// Await activation of the extension
		await myExtension.activate(context);  

		// Add an assertion to ensure that commands were registered or other side effects occurred
		assert.strictEqual(context.subscriptions.length > 0, true, 'No commands registered');
	});
});
