from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.ai.agent import library_agent
from app.ai.rag import initialize_rag
import uuid

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ToolCall(BaseModel):
    tool: str
    input: Any
    output: str

class ChatResponse(BaseModel):
    response: str
    tool_calls: List[ToolCall]
    session_id: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message with the AI assistant.

    The assistant can:
    - Search for books by title or author
    - Recommend books based on preferences
    - Check book availability
    - Get member borrowing history
    - Provide library statistics
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    session_id = request.session_id or str(uuid.uuid4())

    try:
        result = library_agent.process_message(request.message, session_id)

        tool_calls = [
            ToolCall(
                tool=tc["tool"],
                input=tc["input"],
                output=tc["output"]
            )
            for tc in result.get("tool_calls", [])
        ]

        return ChatResponse(
            response=result["response"],
            tool_calls=tool_calls,
            session_id=result["session_id"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.post("/sessions/{session_id}/clear")
async def clear_session(session_id: str):
    """Clear the conversation history for a specific session."""
    try:
        library_agent.clear_session(session_id)
        return {"message": f"Session {session_id} cleared successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing session: {str(e)}"
        )

@router.post("/rag/refresh")
async def refresh_rag():
    """Refresh the RAG vector store with updated book data."""
    try:
        success = initialize_rag()
        if success:
            return {"message": "RAG vector store refreshed successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to refresh RAG vector store"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing RAG: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Check if the AI service is running properly."""
    return {
        "status": "healthy",
        "service": "Library AI Assistant",
        "version": "1.0.0"
    }
