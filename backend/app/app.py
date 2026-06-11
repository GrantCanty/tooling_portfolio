import os
import json
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
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

def get_project_title(project_id: str, default_title: str) -> str:
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
    projects_list_path = os.path.join(storage_dir, "projects.json")
    if os.path.exists(projects_list_path):
        try:
            with open(projects_list_path, "r") as f:
                projects = json.load(f)
            for p in projects:
                if p.get("id") == project_id and p.get("title"):
                    return p["title"]
        except Exception:
            pass
    return default_title

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    current_view: Optional[str] = None
    current_project_id: Optional[str] = None

class ImportRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None

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
        from .importer import parse_github_url, fetch_repo_metadata, fetch_repo_branches, fetch_repo_commits, download_and_parse_repo, infer_technologies
        
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
        
        branches = fetch_repo_branches(owner, repo)
        active_branch = request.branch if request.branch else default_branch
        if branches and active_branch not in branches:
            if default_branch in branches:
                active_branch = default_branch
            elif len(branches) > 0:
                active_branch = branches[0]
                
        files, readme, file_paths = download_and_parse_repo(owner, repo, active_branch)
        if not files:
            raise HTTPException(status_code=400, detail="Failed to fetch files from repository")
            
        technologies = infer_technologies(file_paths, primary_lang)
        project_id = f"imported-{repo.lower()}"
        
        commits, has_more = fetch_repo_commits(owner, repo, active_branch)
        
        project_details = {
            "id": project_id,
            "title": get_project_title(project_id, title),
            "description": description,
            "technologies": technologies,
            "github_url": f"https://github.com/{owner}/{repo}",
            "readme": readme,
            "files": files,
            "file_paths": file_paths,
            "stars": stars,
            "forks": forks,
            "branches": branches,
            "active_branch": active_branch,
            "commits": commits,
            "has_more_commits": has_more
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
        llm_service.refresh_context()
            
        return {"success": True, "project": project_entry}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def sync_project_background(project_id: str, github_url: str):
    try:
        from .importer import parse_github_url, fetch_repo_metadata, download_and_parse_repo, infer_technologies, fetch_repo_branches, fetch_repo_commits
        
        owner, repo = parse_github_url(github_url)
        if not owner or not repo:
            return
            
        meta = fetch_repo_metadata(owner, repo)
        if not meta:
            return
            
        title = meta.get("name", repo)
        description = meta.get("description", "")
        primary_lang = meta.get("language")
        default_branch = meta.get("default_branch", "main")
        stars = meta.get("stargazers_count", 0)
        forks = meta.get("forks_count", 0)
        
        # Read the existing active branch
        active_branch = default_branch
        storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
        project_detail_path = os.path.join(storage_dir, f"project-{project_id}.json")
        if os.path.exists(project_detail_path):
            try:
                with open(project_detail_path, "r") as f:
                    old_details = json.load(f)
                    active_branch = old_details.get("active_branch", default_branch)
            except Exception:
                pass
                
        branches = fetch_repo_branches(owner, repo)
        if branches and active_branch not in branches:
            if default_branch in branches:
                active_branch = default_branch
            elif len(branches) > 0:
                active_branch = branches[0]
                
        files, readme, file_paths = download_and_parse_repo(owner, repo, active_branch)
        if not files:
            return
            
        technologies = infer_technologies(file_paths, primary_lang)
        commits, has_more = fetch_repo_commits(owner, repo, active_branch)
        
        project_details = {
            "id": project_id,
            "title": get_project_title(project_id, title),
            "description": description,
            "technologies": technologies,
            "github_url": github_url,
            "readme": readme,
            "files": files,
            "file_paths": file_paths,
            "stars": stars,
            "forks": forks,
            "branches": branches,
            "active_branch": active_branch,
            "commits": commits,
            "has_more_commits": has_more
        }
        
        storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
        project_detail_path = os.path.join(storage_dir, f"project-{project_id}.json")
        with open(project_detail_path, "w") as f:
            json.dump(project_details, f, indent=2)
            
        projects_list_path = os.path.join(storage_dir, "projects.json")
        if os.path.exists(projects_list_path):
            with open(projects_list_path, "r") as f:
                projects = json.load(f)
            for p in projects:
                if p["id"] == project_id:
                    p["technologies"] = technologies
                    p["description"] = description
            with open(projects_list_path, "w") as f:
                json.dump(projects, f, indent=2)
    except Exception as e:
        print(f"Background sync failed for {project_id}: {e}")

@app.get("/data/{item}")
async def get_data(item: str, background_tasks: BackgroundTasks):
    file_path = os.path.join(os.path.dirname(__file__), "../../storage", f"{item}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Data not found")
    
    with open(file_path, "r") as f:
        data = json.load(f)
        
    if item.startswith("project-") and isinstance(data, dict) and data.get("github_url"):
        project_id = data.get("id")
        github_url = data.get("github_url")
        if project_id and github_url:
            mtime = os.path.getmtime(file_path)
            # 5-minute cooldown (300 seconds)
            if time.time() - mtime > 300:
                background_tasks.add_task(sync_project_background, project_id, github_url)
                
    return data

