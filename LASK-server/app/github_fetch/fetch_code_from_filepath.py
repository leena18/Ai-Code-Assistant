import os

def fetch_code_from_paths(json_data, paths):
    result = []
    
    for path in paths:
        # Convert backslashes to forward slashes to match JSON structure
        json_path = path.replace("\\", "/")
        
        try:
            # Get the file content using the path
            file_content = eval(f"json_data{''.join([f'[{repr(part)}]' for part in json_path.split('/')])}")
            
            # Append the file name and its content to the result
            result.append(f"File: {path}\n{file_content}\n\n")
        
        except KeyError:
            # If the path doesn't exist in the JSON, handle it
            result.append(f"File: {path}\nError: Path not found\n\n")
    
    return ''.join(result)


def save_code_to_file(formatted_code: str, filename: str = "text_context.txt", project_id: str = None, user_id: str = None):
    # Ensure the directory exists
    os.makedirs(f"./project_contexts/{project_id}/{user_id}", exist_ok=True)
    
    # Define the file path
    file_path = os.path.join(f"./project_contexts/{project_id}/{user_id}", filename)
    
    # Save the formatted code to a file
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(formatted_code)
    
    return file_path