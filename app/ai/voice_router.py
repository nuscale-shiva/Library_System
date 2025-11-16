"""
Voice AI endpoints using Deepgram for STT/TTS
Deepgram handles speech recognition and synthesis
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/ai/voice", tags=["ai-voice"])


class SpeakRequest(BaseModel):
    """Request to convert text to speech."""
    text: str


@router.get("/deepgram-key")
async def get_deepgram_key():
    """
    Get Deepgram API key for frontend STT.
    Returns the API key so frontend can connect directly to Deepgram.
    """
    api_key = os.getenv("DEEPGRAM_API_KEY")

    if not api_key or api_key == "your_deepgram_api_key_here":
        raise HTTPException(
            status_code=500,
            detail="DEEPGRAM_API_KEY not configured. Add it to your .env file. Get your key from https://deepgram.com"
        )

    return {
        "api_key": api_key,
        "provider": "Deepgram"
    }


@router.post("/speak")
async def text_to_speech(request: SpeakRequest):
    """
    Convert text to speech using Deepgram TTS.
    Returns audio file for playback.
    """
    api_key = os.getenv("DEEPGRAM_API_KEY")

    if not api_key or api_key == "your_deepgram_api_key_here":
        raise HTTPException(
            status_code=500,
            detail="DEEPGRAM_API_KEY not configured"
        )

    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    try:
        # Call Deepgram TTS API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.deepgram.com/v1/speak?model=aura-asteria-en",
                headers={
                    "Authorization": f"Token {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "text": request.text
                },
                timeout=30.0
            )

            if response.status_code == 200:
                # Return audio stream
                return StreamingResponse(
                    iter([response.content]),
                    media_type="audio/mp3",
                    headers={
                        "Content-Disposition": "inline; filename=speech.mp3"
                    }
                )
            else:
                print(f"❌ Deepgram TTS error: {response.status_code}")
                print(f"   Response: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Deepgram TTS failed: {response.text}"
                )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Deepgram TTS request timed out"
        )
    except Exception as e:
        print(f"❌ Error in TTS: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating speech: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if Deepgram voice is configured."""
    api_key = os.getenv("DEEPGRAM_API_KEY")

    if api_key and api_key != "your_deepgram_api_key_here":
        return {
            "status": "available",
            "provider": "Deepgram",
            "message": "Voice AI is ready"
        }
    else:
        return {
            "status": "not_configured",
            "provider": "Deepgram",
            "message": "DEEPGRAM_API_KEY not set. Add it to .env file. Get your key from https://deepgram.com"
        }
