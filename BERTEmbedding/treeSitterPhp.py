import os
from pprint import pprint
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import Language

# Specify the base directory
base_dir = "D:\\Projects\\AI Capstone\\LASK-server"

# Collect all .php file paths
php_file_paths = []
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(".php"):
            php_file_paths.append(os.path.join(root, file))

# Load documents using GenericLoader
docs = []
for file_path in php_file_paths:
    loader = GenericLoader.from_filesystem(
        os.path.dirname(file_path),  # Directory containing the file
        glob=os.path.basename(file_path),  # Load this specific file
        suffixes=[".php"],  # Change the suffix to .php
        parser=LanguageParser(language=Language.PHP, parser_threshold=1000),  # Update to PHP
    )
    docs.extend(loader.load())  # Load and extend the docs list

# Print the number of documents loaded
print(len(docs))

# Print the metadata of each document
for document in docs:
    pprint(document.metadata)
