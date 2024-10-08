import json
import os

def get_files(json_obj, current_path=""):
    file_list = []
    for key, value in json_obj.items():
        new_path = os.path.join(current_path, key)
        if isinstance(value, dict):  # It's a folder
            file_list.extend(get_files(value, new_path))
        else:  # It's a file
            file_list.append(new_path)
    return file_list

def load_json_from_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Replace 'your_json_file_path.json' with the actual path to the JSON file
json_file_path = 'filtered_repo_structure.json'

# Load the JSON from the file
json_data = load_json_from_file(json_file_path)

# Parse the JSON and get the list of files
file_list = get_files(json_data)

# Print the list of files
for file in file_list:
    print(file)
