// import * as vscode from 'vscode';
// import axios from 'axios';

// export class GitHubLoader {
//     static async loadRemoteRepository(chatProvider: any) {
//         const repoUrl = await vscode.window.showInputBox({
//             placeHolder: 'Enter the remote repository URL (e.g., GitHub link)',
//             prompt: 'Provide a valid GitHub/Bitbucket repository URL'
//         });

//         if (repoUrl) {
//             try {
//                 const repoContent = await axios.get(repoUrl);
//                 chatProvider.addContext(repoContent.data);
//                 vscode.window.showInformationMessage('Context loaded from remote repository.');
//             } catch (error) {
//                 vscode.window.showErrorMessage('Failed to load repository content.');
//             }
//         }
//     }
// }


import * as vscode from 'vscode';
import axios from 'axios';

export class GitHubLoader {
    static async loadRemoteRepository(chatProvider: any) {
        const repoUrl = await vscode.window.showInputBox({
            placeHolder: 'Enter the remote repository URL (e.g., GitHub link)',
            prompt: 'Provide a valid GitHub repository URL (e.g., https://github.com/owner/repo)'
        });

        const token = await vscode.window.showInputBox({
            placeHolder: 'Enter your GitHub Personal Access Token (optional)',
            prompt: 'Providing a token increases your rate limit for API requests.',
            ignoreFocusOut: true
        });

        if (repoUrl) {
            try {
                const apiUrl = this.constructApiUrl(repoUrl);
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const repoContent = await this.fetchRepoContent(apiUrl, headers);

                chatProvider.addContext(repoContent.join('\n')); // Adding combined context to chatProvider
                vscode.window.showInformationMessage('Context loaded from remote repository.');
            } catch (error: any) {
                vscode.window.showErrorMessage('Failed to load repository content. ' + error.message);
            }
        }
    }

    // Helper function to convert the repo URL to the API URL
    static constructApiUrl(repoUrl: string): string {
        const match = repoUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            const [_, owner, repo] = match;
            return `https://api.github.com/repos/${owner}/${repo}/contents`;
        }
        throw new Error('Invalid GitHub repository URL.');
    }

    // Function to handle paginated requests and fetch all repo content
    static async fetchRepoContent(apiUrl: string, headers: any, page: number = 1, repoContent: string[] = []): Promise<string[]> {
        const response = await axios.get(`${apiUrl}?page=${page}`, { headers });
        const data = response.data;

        // Extract file names or relevant content
        for (const item of data) {
            if (item.type === 'file') {
                // Fetch content of each file
                const fileContent = await this.fetchFileContent(item.download_url, headers);
                repoContent.push(`--- ${item.name} ---\n${fileContent}`);
            }
        }

        // If there's more data, recursively fetch the next page
        const linkHeader = response.headers.link;
        const hasNextPage = linkHeader && linkHeader.includes('rel="next"');
        if (hasNextPage) {
            return this.fetchRepoContent(apiUrl, headers, page + 1, repoContent);
        }

        return repoContent;
    }

    // Function to fetch the content of a single file
    static async fetchFileContent(fileUrl: string, headers: any): Promise<string> {
        const response = await axios.get(fileUrl, { headers });
        return response.data;
    }
}

