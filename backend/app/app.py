import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from .ai.llm_service import LLMService

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    current_view: Optional[str] = None
    current_project_id: Optional[str] = None

class ImportRequest(BaseModel):
    repo_url: str

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await llm_service.chat(
            request.message,
            request.history,
            request.current_view,
            request.current_project_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import")
async def import_project(request: ImportRequest):
    try:
        from .importer import parse_github_url, fetch_repo_metadata, download_and_parse_repo, infer_technologies
        
        owner, repo = parse_github_url(request.repo_url)
        if not owner or not repo:
            raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")
            
        meta = fetch_repo_metadata(owner, repo)
        title = meta.get("name", repo)
        description = meta.get("description", "Imported from GitHub")
        primary_lang = meta.get("language")
        default_branch = meta.get("default_branch", "main")
        stars = meta.get("stargazers_count", 0)
        forks = meta.get("forks_count", 0)
        
        files, readme, file_paths = download_and_parse_repo(owner, repo, default_branch)
        if not files:
            raise HTTPException(status_code=400, detail="Failed to fetch files from repository")
            
        technologies = infer_technologies(file_paths, primary_lang)
        project_id = f"imported-{repo.lower()}"
        
        project_details = {
            "id": project_id,
            "title": title,
            "description": description,
            "technologies": technologies,
            "github_url": f"https://github.com/{owner}/{repo}",
            "readme": readme,
            "files": files,
            "file_paths": file_paths,
            "stars": stars,
            "forks": forks
        }
        
        storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
        os.makedirs(storage_dir, exist_ok=True)
        
        project_detail_path = os.path.join(storage_dir, f"project-{project_id}.json")
        with open(project_detail_path, "w") as f:
            json.dump(project_details, f, indent=2)
            
        projects_list_path = os.path.join(storage_dir, "projects.json")
        projects = []
        if os.path.exists(projects_list_path):
            with open(projects_list_path, "r") as f:
                try:
                    projects = json.load(f)
                except Exception:
                    projects = []
                    
        existing_index = next((i for i, p in enumerate(projects) if p["id"] == project_id), None)
        project_entry = {
            "id": project_id,
            "title": title,
            "description": description,
            "technologies": technologies,
            "image": None
        }
        
        if existing_index is not None:
            projects[existing_index] = project_entry
        else:
            projects.append(project_entry)
            
        with open(projects_list_path, "w") as f:
            json.dump(projects, f, indent=2)
            
        # Re-initialize LLM context so the agent knows about the new project
        llm_service.context = llm_service._load_context()
        llm_service.system_instruction = f"""
You are Grant's AI Portfolio Agent. Your goal is to help users explore Grant's background, projects, and skills.
You have access to Grant's professional history and tools to navigate the website.

{llm_service.context}

RULES:
1. If asked about a project, always refer to it by its 'id'.
2. If the user query is about seeing something, use the navigate_to_view tool.
3. If the user is just curious about the project but is not asking to actually see it, just respond by chatting.
4. Only use the comparison compare project tool if the user asks about looking at 2 projects at once.
5. ALWAYS provide a brief, friendly confirmation message in the 'content' field when you call a tool (e.g., "Sure, let's take a look at my projects!").
"""
            
        return {"success": True, "project": project_entry}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/{item}")
async def get_data(item: str):
    file_path = os.path.join(os.path.dirname(__file__), "../../storage", f"{item}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Data not found")
    
    with open(file_path, "r") as f:
        return json.load(f)

