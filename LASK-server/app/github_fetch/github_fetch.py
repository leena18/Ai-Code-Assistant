from fastapi import HTTPException
import requests
import json
import os

# Function to fetch repository structure using GitHub API v3
def get_repo_structure(api_url, headers, allowed_extensions):
    try:
        # Send a request to the GitHub API to get the directory contents
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors

        contents = response.json()
        structure = {}

        # Loop through the contents and organize them into files and directories
        for item in contents:
            if item['type'] == 'file':
                # Get the file extension
                file_extension = os.path.splitext(item['name'])[1]
                if not allowed_extensions or file_extension in allowed_extensions:
                    # Fetch file contents if the extension matches
                    file_response = requests.get(item['download_url'], headers=headers)
                    structure[item['name']] = file_response.text  # Store file content
            elif item['type'] == 'dir':
                # Recursively get the contents of the directory
                structure[item['name']] = get_repo_structure(item['url'], headers, allowed_extensions)
        
        return structure

    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch repository contents: {e}")
        return {}

# Main function to fetch the repository structure from GitHub
def fetch_github_repo_structure(repo_url, access_token=None, allowed_extensions=None, user_id=None, project_id=None):
    if "github.com" not in repo_url:
        raise HTTPException(status_code=400, detail="Invalid GitHub URL.")

    # Extract owner and repo from URL
    repo_url_parts = repo_url.rstrip('/').split('/')
    owner = repo_url_parts[-2]
    repo = repo_url_parts[-1]
    reponame = repo

    # GitHub API URL to get repository contents at the root
    api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/"

    headers = {
        'X-GitHub-Api-Version': '2022-11-28'
    }
    if access_token:
        headers['Authorization'] = f'token {access_token}'

    # Fetch repository structure starting from the root directory
    repo_structure = get_repo_structure(api_url, headers, allowed_extensions)

    # Save the repository structure to a file
    save_structure_to_file(repo_structure, project_id, user_id, reponame)

    return get_files(repo_structure)

# Function to save repository structure to a file
def save_structure_to_file(structure, project_id, user_id, reponame):
    # Create directory path
    relative_path = f"./project_contexts/{project_id}/{user_id}"
    os.makedirs(relative_path, exist_ok=True)  # Create directories if they do not exist

    # Save structure as JSON
    file_path = os.path.join(relative_path, f"remote.json")
    with open(file_path, "w") as json_file:
        json.dump(structure, json_file, indent=4)

# Function to get files from the JSON structure
def get_files(json_obj, current_path=""):
    file_list = []
    for key, value in json_obj.items():
        new_path = os.path.join(current_path, key)
        if isinstance(value, dict):  # Folder
            file_list.extend(get_files(value, new_path))
        else:  # File
            file_list.append(new_path)
    return file_list

# Load JSON from file
def load_json_from_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)
