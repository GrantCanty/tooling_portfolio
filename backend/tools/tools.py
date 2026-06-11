
navigate_to_view = {
    "type": "function",
    "function": {
        "name": "navigate_to_view",
        "description": "Navigate the user interface to a specific view based on their request.",
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
                    "description": "Optional ID for a specific project or item to focus on."
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

