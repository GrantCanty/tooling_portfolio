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

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await llm_service.chat(request.message, request.history, request.current_view)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/{item}")
async def get_data(item: str):
    file_path = os.path.join(os.path.dirname(__file__), "../../storage", f"{item}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Data not found")
    
    with open(file_path, "r") as f:
        return json.load(f)
