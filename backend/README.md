# Project Vaani / DhVaani-0.5 TTS Service for ClinicOpsAgent

This backend service provides AI-driven Text-to-Speech (TTS) using **ARTPARK-IISc/DhVaani-0.5** from Project Vaani / Indian Institute of Science (IISc).

## Model Details
- **Model:** `ARTPARK-IISc/DhVaani-0.5`
- **Architecture:** Zero-shot ZipVoice flow-matching TTS (123M parameters) fine-tuned with custom Indic character tokenizers.
- **Audio Output:** 24 kHz studio-quality audio.
- **Supported Languages:** 27 Indian languages, including English (`en`), Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Telugu (`te`), Tamil (`ta`), Gujarati (`gu`), Kannada (`kn`), and more.
- **Voice Conditioning:** Zero-shot reference voice cloning for clear natural healthcare female audio.

## Setup Instructions

### 1. Requirements
Ensure Python 3.10+ is installed.

```bash
cd backend
pip install -r requirements.txt
```

### 2. Hugging Face Access
DhVaani-0.5 is a gated model.
1. Visit [huggingface.co/ARTPARK-IISc/DhVaani-0.5](https://huggingface.co/ARTPARK-IISc/DhVaani-0.5) and accept the terms of use.
2. Obtain a user access token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
3. Set your token in the `.env` file or environment:
   ```env
   HF_TOKEN=hf_your_token_here
   PORT=8000
   ```

### 3. Run Service
```bash
uvicorn main:app --port 8000 --reload
```

The service will be accessible at `http://localhost:8000`. The ClinicOpsAgent main backend automatically proxies and falls back between Project Vaani, Sarvam AI, and Web Speech API.

