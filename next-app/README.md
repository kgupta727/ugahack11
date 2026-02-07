# police.ai - AI-Powered Emergency Dispatch System

Real-time AI emergency call handler built with Next.js 15, TypeScript, and Tailwind CSS. The AI autonomously answers 911 calls, conducts intelligent triage, and escalates critical cases to human dispatchers.

## 🚨 How It Works

### The Emergency Call Journey

1. **Call Arrives (0 seconds)**
   - Emergency call comes in
   - AI answers instantly with zero hold time
   - Call appears in dispatcher dashboard
   - Status: Not Dispatched, Priority: TBD

2. **AI Greeting (0-3 seconds)**
   - AI speaks: "911, what's your emergency?"
   - Call recording and transcription start
   - Timer begins counting
   - Location detection activates

3. **Caller Speaks (3-30 seconds)**
   - Caller describes emergency naturally
   - Live transcript streams in real-time
   - Gemini AI analyzes speech continuously
   - Location keywords extracted from conversation

4. **AI Auto-Fills Information (10-20 seconds)**
   - **Priority** assigned (Critical/High/Medium/Low)
   - **Emergency type** classified (Medical/Fire/Crime/Accident)
   - **Location** extracted ("fire at ACU Bank on 15th street")
   - **AI Summary** generates bullet points
   - **Panic score** calculated from speech patterns

5. **AI Asks Smart Follow-ups (20-60 seconds)**
   - Only asks if critical info missing
   - "Is anyone injured?"
   - "Are you in a safe location?"
   - "How many people are involved?"
   - Builds Q&A trail for dispatcher review

6. **Auto-Escalation Decision**
   - IF priority is Critical/High OR panic ≥70%
   - AI automatically escalates to human dispatcher
   - Shows full conversation history
   - Dispatcher takes over seamlessly

7. **Dispatcher Actions (30-90 seconds)**
   - Reviews AI summary and transcript
   - Reads Q&A trail for context
   - Clicks "Dispatch" to send units
   - Can override any AI classification
   - Adds human notes

8. **Ongoing Monitoring**
   - AI can continue providing instructions
   - Dispatcher tracks multiple calls simultaneously
   - Status changes: Dispatched → En Route → On Scene → Resolved
   - Full audit trail maintained

9. **Resolution**
   - Units arrive on scene
   - Dispatcher marks "Resolved"
   - Call recording archived
   - Full transcript and AI analysis saved

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on port 5050

### Installation

```bash
cd next-app
npm install
```

### Development

Start the dev server:

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000)

### Backend Setup

The backend must be running for AI features:

```bash
cd ../backend
npm install
npm run start
```

Configure API keys in `../backend/.env`:

```bash
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id

# Optional - Firebase for persistence
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

## 🎯 Core Features

### 1. AI Call Handler
- **Zero hold times** - AI answers every call instantly
- **Voice recognition** - Browser speech-to-text captures caller
- **Text-to-speech** - ElevenLabs voices AI responses
- **Natural conversation** - AI conducts emergency interview

### 2. Intelligent Triage
- **Gemini AI analysis** - Real-time emergency classification
- **Priority detection** - Critical/High/Medium/Low auto-assigned
- **Emergency typing** - Medical/Fire/Crime/Accident/Other
- **Location extraction** - Pulls addresses from natural speech
- **Panic scoring** - Detects caller stress levels

### 3. Smart Q&A System
- **Context-aware questions** - AI asks only what's needed
- **Conversation trail** - Full Q&A history for dispatcher
- **Dynamic follow-ups** - Adapts based on caller responses
- **Time-efficient** - Only asks critical missing info

### 4. Auto-Escalation
- **Intelligent routing** - Critical/High priority → human dispatcher
- **Panic detection** - ≥70% panic score → immediate escalation
- **Full context** - Dispatcher sees complete AI conversation
- **Seamless handoff** - No information loss

### 5. Live Dispatcher Dashboard
- **Real-time monitoring** - See all active calls updating live
- **Status overview** - Unresolved/Open/Dispatched/Resolved counts
- **Priority highlighting** - Critical calls visually prominent
- **One-click actions** - Dispatch/Resolve/Cancel buttons
- **Human notes** - Add dispatcher observations

### 6. Call Monitoring
- **Live transcripts** - See conversations as they happen
- **AI summaries** - Quick bullet-point overview
- **Q&A trail** - Review AI questioning logic
- **Escalation reasons** - Why call needs human attention
- **Multiple simultaneous calls** - Monitor many emergencies at once

## 📁 Project Structure

```
next-app/
├── src/
│   └── app/
│       ├── page.tsx            # Landing page
│       ├── call-intake/
│       │   └── page.tsx        # AI call handler interface
│       └── dashboard/
│           └── page.tsx        # Dispatcher monitoring
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## 🎨 Pages

### Landing Page (/)
- Hero section with police.ai branding
- Live stats monitor (active calls, resolved, dispatched)
- Feature highlights
- CTA to call intake

### Call Intake (/call-intake)
**Left Panel - AI Call Handler:**
- "Answer Call" button starts AI conversation
- Live call state display (Greeting/Listening/Analyzing/Asking)
- Call timer showing elapsed time
- Real-time priority/emergency type/location detection
- Current AI question display
- Live transcript with auto-scroll
- AI summary generation
- Q&A trail buildup
- "End Call" to stop

**Right Panel - Live Monitor:**
- All active calls updating every 3 seconds
- Color-coded by priority
- Escalated calls highlighted with red ring
- Click to expand full details
- Status badges (Pending/Dispatched/Resolved)
- Panic scores displayed

### Dashboard (/dashboard)
**Escalated Call Panel:**
- Red alert banner for human-needed calls
- Full caller information
- Location and emergency details
- Priority and panic score
- Complete transcript
- AI summary
- Q&A conversation trail
- Escalation reason explanation
- Dispatcher notes textarea
- Action buttons (Dispatch/Resolve/Cancel)

**All Incidents List:**
- Complete call history
- Filter by status
- Sortable and expandable
- Assigned dispatcher shown
- Human notes visible

## 🔧 AI Conversation State Machine

The call intake uses a state-driven AI conversation:

```typescript
type CallState = 
  | "idle"           // Ready for new call
  | "greeting"       // AI saying "911, what's your emergency?"
  | "listening"      // AI listening to initial description
  | "analyzing"      // Calling Gemini for triage
  | "asking"         // AI asking follow-up question
  | "waiting_answer" // Listening for answer
  | "creating"       // Saving incident to backend
  | "completed"      // Call finished
```

**State Transitions:**
1. User clicks "Answer Call" → `greeting`
2. After TTS finishes → `listening`
3. After 15 seconds or 50+ chars → `analyzing`
4. If questions exist → `asking`
5. After speaking question → `waiting_answer`
6. After 10 seconds or answer detected → next question or `creating`
7. After incident saved → `completed`
8. After 3 seconds → `idle`

## 🔌 Backend Integration

### API Endpoints Used

**GET /api/incidents**
- Fetch all emergency incidents
- Returns array with full incident objects

**POST /api/incidents**  
- Create new incident from AI call
- Auto-calculates priority, panic score
- Returns created incident with escalation status

**PATCH /api/incidents/:id**
- Update incident status
- Add human notes and assignment
- Change dispatch status

**POST /api/ai/triage**
- Send transcript to Gemini AI
- Returns: summary, priority, questions array
- Used during call analysis phase

**POST /api/voice/tts**
- Convert text to speech via ElevenLabs
- Returns audio/mpeg stream
- Falls back to browser TTS if unavailable

### Incident Data Structure

```typescript
{
  id: string;
  createdAt: string;
  callerName: string;
  phone: string;
  location: string;
  emergencyType: "medical" | "fire" | "crime" | "accident" | "other";
  priority: "critical" | "high" | "medium" | "low";
  panicScore: number; // 0-1
  transcript: string;
  aiSummary: string;
  aiQuestions: string[];
  aiAnswers: string[];
  requiresHuman: boolean; // Auto-escalation flag
  escalationReason?: string;
  dispatchStatus: "not-dispatched" | "dispatched" | "en-route" | "on-scene" | "resolved";
  humanAssigned?: boolean;
  humanNotes?: string;
}
```

## 💡 What Makes This Different

### Before (Traditional 911):
- ❌ Caller waits on hold
- ❌ Human dispatcher manually types everything
- ❌ Asks 20+ standard questions
- ❌ Takes 3-5 minutes to gather info
- ❌ Prone to human error under stress
- ❌ Can only handle one call at a time

### After (AI 911):
- ✅ AI answers in 0 seconds
- ✅ Information auto-filled in 10-20 seconds
- ✅ Only asks critical missing questions
- ✅ Dispatcher reviews clean AI summary
- ✅ Dispatch decision in under 1 minute
- ✅ Monitor multiple calls simultaneously
- ✅ AI handles repetitive work, humans handle judgment

**The Magic:** AI handles listening, typing, categorizing. Humans focus on critical decisions, coordination, and complex situations.

## 🔐 Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5050
```

Backend `.env`:

```bash
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=voice_id_here
FIREBASE_PROJECT_ID=optional
FIREBASE_CLIENT_EMAIL=optional
FIREBASE_PRIVATE_KEY=optional
```

## 📱 Browser Compatibility

### Required Features
- **SpeechRecognition** - Chrome, Edge (for caller voice input)
- **Audio API** - All modern browsers (for AI voice output)
- **Fetch API** - All modern browsers (backend communication)

### Fallbacks
- ElevenLabs fails → Browser TTS
- SpeechRecognition unavailable → Manual transcript entry
- Backend offline → In-memory incident storage

## 🚢 Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

### Environment Setup
Add `NEXT_PUBLIC_API_URL` in Vercel dashboard pointing to deployed backend.

## 📊 Performance

- **Call answer time:** <1 second
- **Initial triage:** 15-20 seconds
- **Full incident creation:** 30-60 seconds
- **Dispatcher view update:** 3 second polling
- **Concurrent calls:** Unlimited (AI scales)

## 🎓 Development Tips

### Testing AI Flow
1. Click "Answer Call"
2. Watch state changes (Greeting → Listening → Analyzing)
3. Speak or type transcript manually
4. Observe auto-fill of priority, type, location
5. See AI questions appear
6. Check dashboard for escalation

### Debugging
- Open browser console for speech recognition logs
- Check Network tab for API calls
- Watch state transitions in React DevTools
- Monitor backend logs for Gemini/ElevenLabs responses

## 📝 License

MIT
