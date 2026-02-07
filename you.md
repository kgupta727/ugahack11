# 911 Nexus Build Instructions

This demo is a UI + lightweight API. The list below is the concrete work needed to reach a production-grade 911 system. I split it into phases so you can build, test, and validate safely.

## Phase 0 - Run The Demo (already working)
1) Backend
   - `cd 911/backend`
   - `npm install`
   - `npm run start` (default `http://localhost:5050`)
2) Frontend
   - Open `911/frontend/index.html` in Chrome
   - Allow microphone access on localhost

## Phase 1 - Core Platform Foundations
### 1.1 Architecture
- Split into services: `voice-intake`, `dispatch`, `records`, `analytics`.
- Add a realtime layer: WebSocket or WebRTC data channel for live updates.
- Add a message bus (Kafka, NATS, or Redis Streams) for call events.

### 1.2 Database
- Use PostgreSQL for canonical records.
- Use Redis for hot state (active calls, queues).
- Add time-series storage for call metrics (Timescale or ClickHouse).

### 1.3 Auth + Security
- Admin auth: OIDC (Azure AD or Auth0).
- Role-based access control: operator, supervisor, admin, auditor.
- Audit log with immutable storage (append-only).

## Phase 2 - Telephony + Voice
### 2.1 Telephony
- Integrate a provider (Twilio, Bandwidth, or AWS Connect).
- Provision phone numbers and SIP trunking.
- Implement call pickup webhooks and call control events.

### 2.2 Speech-to-Text
- Streaming STT (Azure Speech, Google, or Deepgram).
- Support multiple languages and auto-detection.
- Confidence scoring and partial hypotheses.

### 2.3 Text-to-Speech
- TTS voice selection for calm, clear dispatch prompts.
- Barge-in (interrupt detection) to stop AI audio if caller speaks.
- Dynamic volume based on caller audio level.

### 2.4 Audio Analysis
- Noise reduction (RNNoise or provider DSP).
- Panic detection: analyze cadence, volume, pitch shifts.
- Emotion classification (keep a conservative threshold, inform but do not decide).

## Phase 3 - Intake + Classification
### 3.1 Structured Intake
- Build a JSON schema for call data with required fields.
- Enforce emergency type, location, people involved, hazards.

### 3.2 Priority Model
- Five-tier priority with rules + ML fallback.
- Automatic escalation triggers and human override.

### 3.3 Location Services
- Geocoding + reverse geocoding.
- What3words optional integration.
- Map tiles (Mapbox, Google Maps, or ESRI).

## Phase 4 - Dispatch Coordination
- CAD integration (local agency interfaces vary).
- Unit availability and location ingestion.
- ETA calculation and route optimization.
- Unit status lifecycle: en-route, on scene, clear.
- Auto-backup dispatch for critical calls.

## Phase 5 - Records, Analytics, Compliance
- Call recording with encryption at rest.
- HIPAA / CJIS compliance review.
- Data retention policy and legal hold.
- Exportable reports (PDF + CSV).
- Incident analytics, heatmaps, staffing metrics.

## Phase 6 - Communication Extensions
- SMS support for hearing impaired.
- TTY/TDD bridging.
- Translation on demand.
- Callback workflow for dropped calls.
- Multi-party conferencing with specialists.

## Phase 7 - Reliability + Operations
- High availability across regions.
- Disaster recovery and backups.
- Live health dashboards and alerting.
- Chaos testing and load tests (concurrency, peak events).

## Implementation Checklist
- [ ] Replace demo UI API with real DB-backed service
- [ ] Add realtime updates (WebSocket)
- [ ] Add telephony provider webhooks
- [ ] Add STT/TTS streaming pipeline
- [ ] Add structured intake schema validation
- [ ] Add dispatch integration adapters
- [ ] Add secure auth + roles
- [ ] Add audit logging and encryption
- [ ] Add monitoring + incident response playbooks

## What You Need From Me Next
If you want me to start coding the next step, pick one:
1) Telephony + STT/TTS streaming pipeline
2) Database schema + records service
3) Realtime dashboard (WebSocket)
4) Location services + map integration

I can begin building the backend services and wire the UI to them once you pick the next track.
