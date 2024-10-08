import os
from pprint import pprint
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import Language
from tree_sitter import Language as TSLanguage, Parser
import tree_sitter_python

# Specify the base directory (use raw string or escape backslashes)
base_dir = r"D:\Projects\AI Capstone\LASK-server"  # Use raw string to avoid escape issues

# Load the Tree-sitter Python language
PY_LANGUAGE = TSLanguage(tree_sitter_python.language())

# Initialize the Tree-sitter parser
parser = Parser()
parser.language = PY_LANGUAGE

# Collect all .py file paths
py_file_paths = []
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(".py"):
            py_file_paths.append(os.path.join(root, file))

# Load documents using GenericLoader
docs = []
for file_path in py_file_paths:
    loader = GenericLoader.from_filesystem(
        os.path.dirname(file_path),  # Directory containing the file
        glob=os.path.basename(file_path),  # Load this specific file
        suffixes=[".py"],
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=1000),
    )
    docs.extend(loader.load())  # Load and extend the docs list



def extract_code_structure(node, indent=0):
    """Recursively extract the structure of code from the tree."""
    indentation = ' ' * indent

    if node.type == 'class_definition':
        # Class Name
        class_name = None
        for child in node.children:
            if child.type == 'identifier':
                class_name = child.text.decode('utf-8')
                print(f"{indentation}Class: {class_name}")
        for child in node.children:
            extract_code_structure(child, indent + 4)
    
    elif node.type == 'function_definition':
        # Function Name and Parameters
        function_name = None
        params = []
        for child in node.children:
            if child.type == 'identifier':  # Function name
                function_name = child.text.decode('utf-8')
            elif child.type == 'parameters':  # Function parameters
                params = [p.text.decode('utf-8') for p in child.children if p.type == 'identifier']
        
        if function_name:
            print(f"{indentation}Method: {function_name}")
            print(f"{indentation}    Parameters: {params}")
        
        for child in node.children:
            extract_code_structure(child, indent + 4)

    elif node.type == 'expression_statement':
        # Expression inside the function
        print(f"{indentation}    Expression: {node.text.decode('utf-8')}")

    elif node.type == 'assignment':
        # Assignment statement
        left = node.child_by_field_name('left')
        right = node.child_by_field_name('right')

        # Ensure both sides of the assignment exist
        if left and right:
            left_text = left.text.decode('utf-8')
            right_text = right.text.decode('utf-8')
            print(f"{indentation}    Assignment: {left_text} = {right_text}")
        else:
            print(f"{indentation}    Incomplete assignment detected")

    # Traverse recursively for all child nodes
    for child in node.children:
        extract_code_structure(child, indent)



for doc in docs:
    tree = parser.parse(bytes(doc.page_content, 'utf-8'))  # Ensure proper byte encoding
    root_node = tree.root_node
    print("\nParsed Tree (Tree-sitter):")
    extract_code_structure(root_node)