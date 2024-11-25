import os
import re

def update_paths_in_file(file_path):
    # Open the HTML file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Update paths for all href and src attributes
    # Find href and src attributes (and some other similar ones)
    content = re.sub(r'(["\'])((?!http|#|\/)[^"\']+)(\1)', r'\1/\2\3', content)

    # Write the updated content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def update_paths_in_directory(directory):
    # Walk through the directory to find all HTML files
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                print(f'Updating paths in {file_path}...')
                update_paths_in_file(file_path)

if __name__ == '__main__':
    # Set the path to your project folder
    directory = 'C:/xampp/htdocs/pharma-master/public'  # Update to your actual directory
    update_paths_in_directory(directory)
