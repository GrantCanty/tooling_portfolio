import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from tools.tools import navigate_to_view, compare_projects, read_project_file
import logging
from datetime import datetime

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class LLMService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("MISTRAL_API_KEY", "your-key-here"),
            base_url=os.getenv("LLM_PROXY_URL", "http://localhost:4000")
        )
        self.model = "mistral/mistral-small-latest"
        
        # Load candidate data from storage
        self.context = self._load_context()
        
        self.system_instruction = f"""
You are Grant's AI Portfolio Agent. Your goal is to help users explore Grant's background, projects, and skills.
You have access to Grant's professional history and tools to navigate the website.

{self.context}

RULES:
1. If asked about a project, always refer to it by its 'id'.
2. If the user query is about seeing something, use the navigate_to_view tool.
3. If the user is just curious about the project but is not asking to actually see it, just respond by chatting.
4. Only use the comparison compare project tool if the user asks about looking at 2 projects at once.
5. ALWAYS provide a brief, friendly confirmation message in the 'content' field when you call a tool (e.g., "Sure, let's take a look at my projects!").
"""     
        self.tools = [
            navigate_to_view,
            compare_projects,
            read_project_file
        ]

    def _load_context(self):
        storage_path = "/storage"
        if not os.path.exists(storage_path):
            # Fallback for local development outside docker
            storage_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))

        try:
            with open(os.path.join(storage_path, "projects.json"), "r") as f:
                projects = json.load(f)
            with open(os.path.join(storage_path, "resume.json"), "r") as f:
                resume = json.load(f)
            with open(os.path.join(storage_path, "education.json"), "r") as f:
                education = json.load(f)
            
            context = "CANDIDATE PROFILE: Grant, Gen AI Developer.\n\nPROJECTS:\n"
            for p in projects:
                context += f"- id: '{p['id']}', title: '{p['title']}', description: '{p['description']}'\n"
            
            context += "\nEDUCATION:\n"
            for e in education:
                for major in e['fields']:
                    context += f"- {e['degree_level']} in {major} from {e['institution']} ({e['year']})\n"

            context += "\nRESUME:\n"
            context += "RESUME EDUCATION:\n"
            for r in resume['education']:
                context += f"- {r['degree_level']} from {r['institution']} ({r['end_date']})\n"
            context += f"- minor in {resume['additional_education']['minor']} from {resume['additional_education']['institution']}\n"
            context += f"- certificate in {resume['additional_education']['certificate']} from {resume['additional_education']['institution']}\n"
            
            context += "\nRESUME WORK EXPERIENCE:\n"
            for r in resume['work_experience']:
                context += f"- {r['company']} ({r['start_date']} - {r['end_date']}):\n"
                for role in r['roles']:
                    context += f"  - {role['title']} from {r['location']} ({role['start_date']} - {role['end_date']})\n"
                    for resp in role['responsibilities']:
                        context += f"    - {resp}\n"
            
            context += f"\nRESUME PROJECTS:\n"
            for p in resume['programming_projects']:
                context += f"- {p['name']} ({p['start_date']} - {p['end_date']}): {p['description']}\n"

            context += f"\nRESUME LEADERSHIP:\n"
            for l in resume['leadership']:
                context += f"- {l['organization']} ({l['start_date']} - {l['end_date']}):\n"
                for role in l['roles']:
                    context += f"  - {role['title']} from {l['location']} ({role['start_date']} - {role['end_date']})\n"
                    for resp in role['responsibilities']:
                        context += f"    - {resp}\n"    
            
            context += f"\nRESUME SKILLS: \n"
            for l in resume['skills']:
                context += f"- {l}:\n"
                for s in resume['skills'][l]:
                    context += f"  - {s}\n"
            
            return context
        except Exception as e:
            print(f"Error loading context: {e}")
            return "CANDIDATE PROFILE: Grant, Gen AI Developer."

    def _read_project_file_content(self, project_id: str, file_path: str) -> str:
        if not project_id:
            return "Error: No active project context to read files from."
        
        storage_path = "/storage"
        if not os.path.exists(storage_path):
            storage_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))

        detail_path = os.path.join(storage_path, f"project-{project_id}.json")
        if not os.path.exists(detail_path):
            return f"Error: Details for project '{project_id}' not found."

        try:
            with open(detail_path, "r") as f:
                proj = json.load(f)
            files = proj.get("files", {})
            
            # 1. Try exact match
            if file_path in files:
                return files[file_path]
                
            # 2. Try normalized path matches (fuzzy)
            norm_path = file_path.replace("\\", "/").strip("/")
            for k, content in files.items():
                k_norm = k.replace("\\", "/").strip("/")
                if k_norm == norm_path or k_norm.endswith("/" + norm_path) or norm_path.endswith("/" + k_norm):
                    return content
                    
            return f"Error: File '{file_path}' not found in project '{project_id}'. Available files: {list(files.keys())}"
        except Exception as e:
            return f"Error reading file '{file_path}': {str(e)}"

    async def chat(self, message: str, history: list, current_view: str = None, current_project_id: str = None):
        dynamic_instruction = self.system_instruction
        if current_view:
            dynamic_instruction += f"\n\nCURRENT STATE: The user is currently looking at the '{current_view}' view. Do not use the navigate_to_view tool to navigate to this view, as they are already there. If they ask about something on this view, just respond conversationally.\n\nTODAY'S DATE: {datetime.now().strftime('%Y-%m-%d')}"

        if current_project_id:
            storage_path = "/storage"
            if not os.path.exists(storage_path):
                storage_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))
            
            detail_path = os.path.join(storage_path, f"project-{current_project_id}.json")
            if os.path.exists(detail_path):
                try:
                    with open(detail_path, "r") as f:
                        proj_details = json.load(f)
                    file_list = proj_details.get("file_paths", [])
                    file_list_str = ", ".join(file_list)
                    dynamic_instruction += f"""

ACTIVE PROJECT CONTEXT:
You are currently viewing the project '{proj_details.get('title')}' (id: '{current_project_id}').
Project description: {proj_details.get('description')}
GitHub Repository: {proj_details.get('github_url', 'N/A')}

Available files in this project:
[{file_list_str}]

If the user asks questions about specific code files, structure, or implementation details of this project, you MUST use the `read_project_file` tool to retrieve the content of the file and read it before explaining. Do not make up code!
"""
                except Exception as e:
                    logger.error(f"Error loading project details for context: {e}")

        messages = [{"role": "system", "content": dynamic_instruction}]
        for msg in history:
            # Clean roles if needed, ensure they fit system/user/assistant/tool
            messages.append(msg)
        messages.append({"role": "user", "content": message})

        # Tool execution loop (max 3 runs to avoid infinite loops)
        loop_count = 0
        while loop_count < 3:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=self.tools,
                tool_choice="auto"
            )

            message_obj = response.choices[0].message
            
            # Check if there are tool calls to resolve
            if message_obj.tool_calls:
                # We need to distinguish between backend tools (like read_project_file)
                # and frontend tools (like navigate_to_view or compare_projects)
                backend_tool_calls = []
                frontend_tool_calls = []
                
                for tool_call in message_obj.tool_calls:
                    if tool_call.function.name == "read_project_file":
                        backend_tool_calls.append(tool_call)
                    else:
                        frontend_tool_calls.append(tool_call)
                
                if backend_tool_calls:
                    # Append assistant's response with tool calls to history
                    messages.append(message_obj)
                    
                    # Execute backend tools and append results
                    for tool_call in backend_tool_calls:
                        args = json.loads(tool_call.function.arguments)
                        file_path = args.get("file_path", "")
                        content = self._read_project_file_content(current_project_id, file_path)
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": "read_project_file",
                            "content": content
                        })
                    loop_count += 1
                    continue # Re-submit messages to the LLM with tool outputs
                
                # If only frontend tool calls, break and return them to the client
                break
            
            break # No tool calls at all, return normal message

        # Format tool calls for frontend
        tool_calls = []
        if message_obj.tool_calls:
            for tool_call in message_obj.tool_calls:
                tool_calls.append({
                    "name": tool_call.function.name,
                    "arguments": json.loads(tool_call.function.arguments)
                })

        return {
            "content": message_obj.content,
            "tool_calls": tool_calls
        }
