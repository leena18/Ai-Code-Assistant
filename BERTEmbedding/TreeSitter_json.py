from tree_sitter import Language, Parser
import os

# Load the JSON grammar for tree-sitter
Language.build_library(
  'build/my-languages.so',  # Output file
  [
    'tree-sitter-json'  # Path to the JSON grammar repository
  ]
)

# Load the language
JSON_LANGUAGE = Language('build/my-languages.so', 'json')

# Initialize parser
parser = Parser()
parser.set_language(JSON_LANGUAGE)

# Read JSON content from file
file_path = 'sample.json'  # Replace with your JSON file path
with open(file_path, 'r') as f:
    json_content = f.read()

# Parse the JSON content
tree = parser.parse(bytes(json_content, "utf8"))

# Function to recursively print the syntax tree
def print_node(node, indent=0):
    print(' ' * indent + f"{node.type} [{node.start_point} - {node.end_point}]")
    for child in node.children:
        print_node(child, indent + 2)

# Print the root node
root_node = tree.root_node
print_node(root_node)
