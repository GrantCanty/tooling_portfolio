import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from tools.tools import navigate_to_view, compare_projects
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
            compare_projects
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

    async def chat(self, message: str, history: list, current_view: str = None):
        dynamic_instruction = self.system_instruction
        if current_view:
            dynamic_instruction += f"\n\nCURRENT STATE: The user is currently looking at the '{current_view}' view. Do not use the navigate_to_view tool to navigate to this view, as they are already there. If they ask about something on this view, just respond conversationally.\n\nTODAY'S DATE: {datetime.now().strftime('%Y-%m-%d')}"

        messages = [{"role": "system", "content": dynamic_instruction}]
        for msg in history:
            messages.append(msg)
        messages.append({"role": "user", "content": message})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=self.tools,
            tool_choice="auto"
        )

        message_obj = response.choices[0].message
        
        # If there are tool calls, we return them along with the content
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
