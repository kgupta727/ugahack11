# AI Voice 911 Receiver

Demo-grade AI voice based 911 receiver that auto-answers, captures call data, prioritizes incidents, and tracks dispatch status.

## Features
- Instant AI pickup with voice prompts
- Live transcription and panic cue flags
- Automatic priority scoring
- Location pinning with GPS support
- Incident queue with dispatch status controls

## Configure API integrations
Create a `.env` in [911/backend](911/backend) using [911/backend/.env.example](911/backend/.env.example):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (copy the private key and keep line breaks as `\n`)
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

Restart the backend after adding the env file.

## Run backend
```
cd backend
npm install
npm run start
```

## Run frontend
Open frontend/index.html in the browser.

> Note: SpeechRecognition is supported in Chrome-based browsers. Use HTTPS or localhost for mic access.
