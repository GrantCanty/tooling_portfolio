
navigate_to_view = {
    "type": "function",
    "function": {
        "name": "navigate_to_view",
        "description": "Navigate the user interface to a specific view based on their request, with optional arguments to focus on specific tabs, branches, or files in project explorer.",
        "parameters": {
            "type": "object",
            "properties": {
                "view": {
                    "type": "string",
                    "enum": ["landing", "projects", "resume", "music", "education", "graph"],
                    "description": "The name of the view to navigate to."
                },
                "id": {
                    "type": "string",
                    "description": "Optional ID for a specific project or item (e.g. 'imported-bruit' or 'music-gen-app') to focus on."
                },
                "tab": {
                    "type": "string",
                    "enum": ["code", "commits"],
                    "description": "Optional tab to select in projects details view."
                },
                "branch": {
                    "type": "string",
                    "description": "Optional branch name to switch to in projects details view."
                },
                "file_path": {
                    "type": "string",
                    "description": "Optional relative file path of the file to open in projects details view (e.g. 'main.go')."
                }
            },
            "required": ["view"]
        }
    }
}

compare_projects = {
    "type": "function",
    "function": {
        "name": "compare_projects",
        "description": "Enter a split screen view to compare 2 projects side by side",
        "parameters": {
            "type": "object",
            "properties": {
                "id1": {"type": "string", "description": "The slug of the first project"},
                "id2": {"type": "string", "description": "The slug of the second project"}
            },
            "required": ["id1", "id2"]
        }
    }
}

read_project_file = {
    "type": "function",
    "function": {
        "name": "read_project_file",
        "description": "Read the contents of a specific file in the active project to answer questions about the code.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "The relative path of the file to read (e.g. 'main.go', 'src/App.jsx')."
                }
            },
            "required": ["file_path"]
        }
    }
}

