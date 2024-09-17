from tree_sitter import Language
import os

# Define paths
language_library_path = 'build/my-languages.so'
language_parsers = [
    'vendor/tree-sitter-python'  # Add paths to other language parsers here
]

# Check if the build directory exists, if not, create it
if not os.path.exists('build'):
    os.makedirs('build')

# Build the Tree-sitter language library
Language.build_library(
    # Path to save the shared library
    language_library_path,
    # List of language parser directories
    language_parsers
)

print(f"Language library built and saved to {language_library_path}")
