import json

# Function to fetch code from file paths in JSON
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

# Example usage:
json_file = {
    ".mvn": {
        "wrapper": {}
    },
    "pom.xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<project ... </project>",
    "src": {
        "main": {
            "java": {
                "com": {
                    "example": {
                        "blog_server": {
                            "BlogServerApplication.java": "package com.example.blog_server;\n\npublic class BlogServerApplication {...}"
                        }
                    }
                }
            }
        }
    }
}

paths = [
    "src\\main\\java\\com\\example\\blog_server\\BlogServerApplication.java",
    "pom.xml"
]

# Fetch the code from paths
code_context = fetch_code_from_paths(json_file, paths)
print(code_context)
