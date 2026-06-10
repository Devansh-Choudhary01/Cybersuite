from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from groq import Groq
import os
from app.core.config import settings

router = APIRouter(tags=["ai"])

# Initialize Groq client
api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY") or "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"
client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are CyberSuite AI, an expert cybersecurity assistant built into a security platform. You help analyze scan results, explain vulnerabilities, suggest fixes, and answer security questions. Be concise, technical, and actionable."""

class MessageModel(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[MessageModel]
    model: Optional[str] = "llama-3.3-70b-versatile"

class TokenCounts(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    message: str
    tokens: TokenCounts
    model: str

def get_ai_response(messages: list, model: str = "llama-3.3-70b-versatile") -> dict:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        max_tokens=1024,
        temperature=0.7,
    )
    return {
        "message": response.choices[0].message.content,
        "tokens": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
        "model": response.model
    }

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        messages_list = [{"role": m.role, "content": m.content} for m in req.messages]
        res = get_ai_response(messages_list, req.model)
        return ChatResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))