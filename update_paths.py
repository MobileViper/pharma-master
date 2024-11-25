import os

# Define the base URL for Heroku deployment
BASE_URL = "/"

# Directory containing the files
BASE_DIR = "C:\\xampp\\htdocs\\pharma-master"

# File extensions to scan (e.g., HTML, JS, CSS)
EXTENSIONS = (".html", ".js", ".css")

def update_paths_in_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    # Update paths: Replace local paths with relative Heroku-compatible paths
    updated_content = content.replace("C:\\xampp\\htdocs\\pharma-master\\", BASE_URL)

    with open(file_path, "w", encoding="utf-8") as file:
        file.write(updated_content)
    print(f"Updated paths in: {file_path}")

def main():
    for root, _, files in os.walk(BASE_DIR):
        # Skip the public directory to avoid modifying files inside it
        if 'public' in root:
            continue

        for file in files:
            if file.endswith(EXTENSIONS):
                file_path = os.path.join(root, file)
                update_paths_in_file(file_path)

if __name__ == "__main__":
    main()
