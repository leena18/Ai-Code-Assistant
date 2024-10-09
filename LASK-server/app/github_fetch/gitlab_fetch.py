from fastapi import HTTPException
import requests
import json
import os
from app.github_fetch.github_fetch import get_files, save_structure_to_file

def get_repo_structure(api_url, headers, allowed_extensions, ref):
    try:
        # Send a request to the GitLab API to get the directory contents
        print(f"Fetching contents from: {api_url}")  # Debug: Print the API URL being accessed
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors

        contents = response.json()  # Parse the JSON response
        print(f"Contents fetched: {contents}")  # Debug: Print the fetched contents
        structure = {}  # Initialize a dictionary to store the repository structure

        if not contents:  # Check if contents are empty
            print(f"No contents found at {api_url}")  # Debug: Notify if no contents are found
            return structure  # Return empty structure

        # Loop through the contents and organize them into files and directories
        for item in contents:
            if item['type'] == 'blob':  # It's a file
                # Get the file extension
                file_extension = os.path.splitext(item['name'])[1]
                if not allowed_extensions or file_extension in allowed_extensions:
                    # Fetch file contents using GitLab API to get raw content
                    file_path_encoded = requests.utils.quote(item['path'], safe='')
                    file_url = f"{api_url.split('/tree')[0]}/files/{file_path_encoded}/raw?ref={ref}"
                    try:
                        file_response = requests.get(file_url, headers=headers)
                        file_response.raise_for_status()
                        structure[item['name']] = file_response.text  # Store file content
                    except requests.exceptions.RequestException as file_error:
                        print(f"Failed to fetch file contents for {item['name']}: {file_error}")  # Debug: Handle file fetch errors
            elif item['type'] == 'tree':  # It's a directory
                # Recursively get the contents of the directory
                folder_api_url = f"{api_url}&path={item['path']}"
                structure[item['name']] = get_repo_structure(folder_api_url, headers, allowed_extensions, ref)  # Recursive call

        return structure  # Return the constructed structure

    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch repository contents: {e}")  # Debug: Handle repository fetch errors
        return {}  # Return empty structure on error

# Fetch all branches of a GitLab repository
def get_repo_branches(api_url, headers):
    try:
        # Fetch all branches from the GitLab API
        response = requests.get(f"{api_url}/repository/branches", headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors

        branches = response.json()  # Parse the JSON response
        return [branch['name'] for branch in branches] if branches else []  # Return branch names

    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch repository branches: {e}")  # Debug: Handle branch fetch errors
        return []  # Return an empty list on error

# Fetch the structure for all branches of the repository
def fetch_gitlab_repo_structure(repo_url, access_token=None, allowed_extensions=None, user_id=None, project_id=None):
    # Extract the project path from the GitLab repo URL
    if "gitlab.com" in repo_url or "gitlab.valuebound.net" in repo_url:
        repo_url_parts = repo_url.rstrip('/').split('/')
        owner = repo_url_parts[-2]
        repo = repo_url_parts[-1]
        project_path = f"{owner}/{repo}"
    else:
        print("Invalid GitLab URL.")  # Debug: Handle invalid URLs
        return {}

    # GitLab API URL to get repository contents
    api_url = f"https://gitlab.valuebound.net/api/v4/projects/{requests.utils.quote(project_path, safe='')}"

    headers = {}
    if access_token:  # Check if the access token exists
        headers['Authorization'] = f'Bearer {access_token}'  # Set Authorization header

    # Fetch all branches
    branches = get_repo_branches(api_url, headers)
    print(f"Branches fetched: {branches}")  # Debug: Print fetched branches

    # Initialize a dictionary to store the structure of each branch
    all_branches_structure = {}

    for branch in branches:
        print(f"Fetching structure for branch: {branch}")  # Debug: Notify about branch fetching
        branch_api_url = f"{api_url}/repository/tree?ref={branch}"  # Construct API URL for branch
        all_branches_structure[branch] = get_repo_structure(branch_api_url, headers, allowed_extensions, branch)  # Fetch branch structure

    save_structure_to_file(all_branches_structure, project_id, user_id, repo)

    return get_files(all_branches_structure)  # Return the structure of all branches
