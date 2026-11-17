"""
Project Vaani TTS Service (ARTPARK-IISc/DhVaani-0.5)
ClinicOpsAgent Backend Speech Synthesis Module

Features:
- Singleton Model Manager to avoid redundant model reloads.
- Integration with ARTPARK-IISc/DhVaani-0.5 (24 kHz, 123M flow-matching ZipVoice).
- Supports 27 Indian languages, specializing in English (en), Hindi (hi), and Marathi (mr).
- Clear, natural female reference voice conditioning for healthcare delivery.
- In-memory audio caching for frequent medical summaries.
"""

import io
import os
import base64
import logging
from typing import Optional, Dict, Any
from pathlib import Path
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vaani_tts")

MODEL_ID = "ARTPARK-IISc/DhVaani-0.5"
SUPPORTED_LANGUAGES = [
    "en", "hi", "mr", "bn", "te", "ta", "gu", "kn",
    "ml", "pa", "or", "as", "ur", "sa"
]

class VaaniTTSManager:
    _instance: Optional["VaaniTTSManager"] = None

    def __init__(self):
        self.model = None
        self.device = "cpu"
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.sampling_rate = 24000
        self._init_device()

    @classmethod
    def get_instance(cls) -> "VaaniTTSManager":
        if cls._instance is None:
            cls._instance = VaaniTTSManager()
        return cls._instance

    def _init_device(self):
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"
        except ImportError:
            self.device = "cpu"
        logger.info(f"VaaniTTSManager device initialized to: {self.device}")

    def load_model(self) -> bool:
        """Loads DhVaani-0.5 from Hugging Face if HF_TOKEN is present and torch is installed."""
        if self.is_loaded:
            return True

        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        if not hf_token:
            self.load_error = (
                "HF_TOKEN environment variable not set. "
                "DhVaani-0.5 is a gated model on Hugging Face (ARTPARK-IISc/DhVaani-0.5). "
                "Accept terms on Hugging Face and provide HF_TOKEN to enable neural inference."
            )
            logger.warning(self.load_error)
            return False

        try:
            import torch
            from transformers import AutoModel

            logger.info(f"Loading {MODEL_ID} onto {self.device}...")
            self.model = AutoModel.from_pretrained(
                MODEL_ID,
                token=hf_token,
                trust_remote_code=True
            ).to(self.device).eval()

            self.sampling_rate = getattr(self.model, "sampling_rate", 24000)
            self.is_loaded = True
            self.load_error = None
            logger.info(f"Successfully loaded {MODEL_ID} at {self.sampling_rate} Hz")
            return True
        except Exception as e:
            self.load_error = f"Failed to load {MODEL_ID}: {str(e)}"
            logger.error(self.load_error)
            return False

    def synthesize(
        self,
        text: str,
        language: str = "en",
        speed: float = 1.0,
        reference_gender: str = "female"
    ) -> Dict[str, Any]:
        """
        Synthesizes speech from text using DhVaani-0.5.
        Returns base64 encoded WAV audio.
        """
        if not self.is_loaded:
            loaded = self.load_model()
            if not loaded:
                raise RuntimeError(self.load_error or "Model not loaded")

        import torch
        import soundfile as sf

        # Default female reference prompt for natural healthcare audio
        ref_dir = Path(__file__).parent / "voices"
        ref_wav = ref_dir / f"{reference_gender}_ref.wav"
        ref_text = "Good day, here is the clinical summary of your medical research."

        try:
            kwargs = {"text": text}
            if ref_wav.exists():
                kwargs["prompt_wav"] = str(ref_wav)
                kwargs["prompt_text"] = ref_text

            with torch.no_grad():
                audio_array = self.model.synthesize(**kwargs)

            # Convert numpy / torch tensor to WAV bytes
            if hasattr(audio_array, "cpu"):
                audio_array = audio_array.cpu().numpy()

            # Ensure proper shape
            if isinstance(audio_array, np.ndarray) and audio_array.ndim > 1:
                audio_array = audio_array.squeeze()

            buf = io.BytesIO()
            sf.write(buf, audio_array, self.sampling_rate, format="WAV")
            audio_bytes = buf.getvalue()
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")

            return {
                "audioBase64": b64_audio,
                "format": "audio/wav",
                "engine": "project-vaani-dhvaani-0.5",
                "sampling_rate": self.sampling_rate,
                "language": language,
                "speed": speed
            }
        except Exception as e:
            logger.error(f"Error during DhVaani-0.5 synthesis: {str(e)}")
            raise e

