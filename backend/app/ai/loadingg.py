import os
import json

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
    
    context = "CANDIDATE PROFILE: Grant, Gen AI Developer.\n"
    
    context += "\nRESUME:\n"
    context += "RESUME EDUCATION:\n"
    for r in resume['education']:
        context += f"- {r['degree']} from {r['institution']} ({r['end_date']})\n"
    
    context += "\nRESUME WORK EXPERIENCE:\n"
    for r in resume['work_experience']:
        context += f"- {r['company']} ({r['start_date']} - {r['end_date']}):\n"
        for role in r['roles']:
            print(f'roleeeee: {role}')
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

        #for s in l.keys():
        #    context += f"- {s}: {l[s]}\n"

    print(context)
    
except FileNotFoundError as e:
    raise FileNotFoundError(f"Missing data file: {e.filename}")

