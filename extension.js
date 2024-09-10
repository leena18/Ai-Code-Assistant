const vscode = require('vscode');
const axios = require('axios');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Easy Translator extension is now active!');

    let disposable = vscode.commands.registerCommand('easy-translator.easyTranslator', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text) {
            vscode.window.showInformationMessage('No text selected');
            return;
        }

        try {
            const response = await axios.post(
                "https://microsoft-translator-text.p.rapidapi.com/translate?to%5B0%5D=de&api-version=3.0&profanityAction=NoAction&textType=plain",
                [{ "Text": text }],
                {
                    headers: {
                        "content-type": "application/json",
                        "X-RapidAPI-Key": "",
                        "X-RapidAPI-Host": "microsoft-translator-text.p.rapidapi.com"
                    }
                }
            );

            const translatedText = response.data[0].translations[0].text;
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, translatedText);
            });

            vscode.window.showInformationMessage('Translation complete!');
        } catch (error) {
            console.error('Error details:', error.response ? error.response.data : error.message);
            vscode.window.showErrorMessage(`Translation failed: ${error.response ? error.response.data.message : error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
