import re
import urllib.request
import urllib.error
import json
import zipfile
import io
import os

def parse_github_url(url: str):
    url = url.strip()
    # Matches github.com/owner/repo or just owner/repo
    match = re.search(r'(?:github\.com/)?([^/]+)/([^/]+?)(?:\.git|/)?$', url)
    if match:
        owner = match.group(1)
        repo = match.group(2)
        return owner, repo
    return None, None

def fetch_repo_metadata(owner: str, repo: str):
    url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Grant-Portfolio-Agent/1.0"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching metadata for {owner}/{repo}: {e}")
        return {}

def fetch_repo_branches(owner: str, repo: str):
    url = f"https://api.github.com/repos/{owner}/{repo}/branches"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Grant-Portfolio-Agent/1.0"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            branches_data = json.loads(response.read().decode('utf-8'))
            return [b["name"] for b in branches_data]
    except Exception as e:
        print(f"Error fetching branches for {owner}/{repo}: {e}")
        return ["main"]

def download_and_parse_repo(owner: str, repo: str, default_branch: str = "main"):
    zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{default_branch}.zip"
    req = urllib.request.Request(
        zip_url,
        headers={"User-Agent": "Grant-Portfolio-Agent/1.0"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            zip_bytes = response.read()
    except urllib.error.HTTPError as e:
        # If main.zip returns 404, fall back to master.zip
        if default_branch == "main":
            return download_and_parse_repo(owner, repo, "master")
        raise e

    zip_file = zipfile.ZipFile(io.BytesIO(zip_bytes))
    namelist = zip_file.namelist()
    if not namelist:
        return {}, "", []
        
    root_folder = namelist[0].split('/')[0] + '/'
    
    files_map = {}
    file_paths = []
    readme_content = ""
    
    # Exclude directories
    exclude_prefixes = (
        '.git/', 'node_modules/', 'venv/', 'env/', '__pycache__/', 
        'dist/', 'build/', 'target/', 'vendor/', '.idea/', '.vscode/',
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
    )
    
    # Exclude binaries and images
    exclude_extensions = (
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz',
        '.mp3', '.mp4', '.wav', '.webp', '.exe', '.dll', '.so', '.dylib', '.pyc',
        '.db', '.sqlite', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.png'
    )

    for name in namelist:
        if name.endswith('/'):
            continue
            
        rel_path = name[len(root_folder):]
        
        if any(rel_path.startswith(prefix) or rel_path.endswith(prefix) for prefix in exclude_prefixes):
            continue
        if any(rel_path.endswith(ext) for ext in exclude_extensions):
            continue
            
        # File size limit of 150 KB to avoid huge text files (like minified JS)
        info = zip_file.getinfo(name)
        if info.file_size > 150 * 1024:
            continue
            
        try:
            content = zip_file.read(name).decode('utf-8', errors='replace')
            files_map[rel_path] = content
            file_paths.append(rel_path)
            
            if rel_path.lower() == 'readme.md':
                readme_content = content
        except Exception as e:
            print(f"Error reading file {rel_path} in zip: {e}")
            
    if not readme_content:
        readme_content = f"# {repo}\nRepository imported from GitHub."
        
    return files_map, readme_content, file_paths

def infer_technologies(file_paths, primary_language):
    techs = set()
    if primary_language:
        techs.add(primary_language)
        
    ext_mapping = {
        '.py': 'Python',
        '.go': 'Go',
        '.js': 'JavaScript',
        '.jsx': 'React',
        '.ts': 'TypeScript',
        '.tsx': 'React/TypeScript',
        '.rs': 'Rust',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.sh': 'Shell',
        '.html': 'HTML',
        '.css': 'CSS',
        '.sql': 'SQL',
        '.yml': 'YAML',
        '.yaml': 'YAML',
        '.json': 'JSON'
    }
    
    for path in file_paths:
        filename = os.path.basename(path)
        if filename == 'Dockerfile':
            techs.add('Docker')
            continue
        _, ext = os.path.splitext(path)
        if ext in ext_mapping:
            techs.add(ext_mapping[ext])
            
    # Limit to top 6 inferred technologies to keep badges clean
    return list(techs)[:6]
