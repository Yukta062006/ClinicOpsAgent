"""
FastAPI Server for Project Vaani TTS
ClinicOpsAgent Microservice

Endpoints:
- GET  /health      -> Health check
- GET  /status      -> Detailed model info, supported languages, device
- POST /synthesize  -> Synthesize text to WAV audio (base64)
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load local environment variables if present
load_dotenv()

from vaani_service import VaaniTTSManager, MODEL_ID, SUPPORTED_LANGUAGES

app = FastAPI(
    title="ClinicOpsAgent Project Vaani TTS Service",
    description="Text-to-Speech API powered by ARTPARK-IISc/DhVaani-0.5",
    version="1.0.0"
)

# Allow requests from frontend and local Node.js proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tts_manager = VaaniTTSManager.get_instance()

class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text content to speak", min_length=1)
    language: str = Field("en", description="Target language code (en, hi, mr, etc.)")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0, description="Speech rate multiplier")
    reference_gender: Optional[str] = Field("female", description="Voice reference gender ('female' or 'male')")

class SynthesizeResponse(BaseModel):
    success: bool
    audioBase64: Optional[str] = None
    format: str = "audio/wav"
    engine: str = "project-vaani-dhvaani-0.5"
    language: str = "en"
    sampling_rate: int = 24000
    message: Optional[str] = None

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "ClinicOpsAgent Project Vaani TTS",
        "model": MODEL_ID,
        "is_model_loaded": tts_manager.is_loaded,
        "device": tts_manager.device
    }

@app.get("/status")
def get_status():
    return {
        "model": MODEL_ID,
        "architecture": "ZipVoice (123M flow-matching) with character tokenizer",
        "is_loaded": tts_manager.is_loaded,
        "load_error": tts_manager.load_error,
        "device": tts_manager.device,
        "sampling_rate": tts_manager.sampling_rate,
        "supported_languages": SUPPORTED_LANGUAGES,
        "has_hf_token": bool(os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN"))
    }

@app.post("/synthesize", response_model=SynthesizeResponse)
def synthesize_speech(payload: SynthesizeRequest):
    try:
        lang = payload.language.lower()
        if lang not in SUPPORTED_LANGUAGES:
            lang = "en"

        result = tts_manager.synthesize(
            text=payload.text,
            language=lang,
            speed=payload.speed or 1.0,
            reference_gender=payload.reference_gender or "female"
        )
        return SynthesizeResponse(
            success=True,
            audioBase64=result["audioBase64"],
            format=result.get("format", "audio/wav"),
            engine="project-vaani-dhvaani-0.5",
            language=lang,
            sampling_rate=result.get("sampling_rate", 24000)
        )
    except Exception as e:
        # Return structured error so caller can gracefully fallback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ============ QUEUE MANAGEMENT ENDPOINTS (QUARANTINED) ============
# Duplicate queue endpoints previously defined here have been quarantined into backend/quarantine_queue.py.
# All queue management is authoritatively handled by the primary Express API (server.mjs).

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

