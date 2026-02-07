"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Radio, Mic, MicOff, Volume2, MapPin, Phone, User, AlertTriangle, Clock, Activity, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
import SentimentAnalysis from "@/components/SentimentAnalysis";
import AudioAnalyzer from "@/components/AudioAnalyzer";
import MedicalAssistant from "@/components/MedicalAssistant";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
});

interface Incident {
  id: string;
  createdAt: string;
  callerName: string;
  phone: string;
  location: string;
  geo?: { latitude: number; longitude: number };
  emergencyType: string;
  priority: string;
  panicScore: number;
  injuries: string;
  danger: string;
  transcript: string;
  aiSummary: string;
  aiQuestions: string[];
  aiAnswers: string[];
  requiresHuman: boolean;
  escalationReason?: string;
  dispatchStatus: string;
}

type CallState = "idle" | "greeting" | "listening" | "analyzing" | "asking" | "waiting_answer" | "creating" | "completed";

export default function CallIntake() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<string[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detectedPriority, setDetectedPriority] = useState("");
  const [detectedEmergencyType, setDetectedEmergencyType] = useState("");
  const [detectedLocation, setDetectedLocation] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showMedicalAssist, setShowMedicalAssist] = useState(false);
  const [mapIncidents, setMapIncidents] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAnswerRef = useRef("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (callState !== "idle" && callState !== "completed") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      const data = await res.json();
      setIncidents(data.incidents || []);
      
      // Prepare map data
      const withLocation = (data.incidents || []).filter((inc: any) => inc.geo?.latitude && inc.geo?.longitude).map((inc: any) => ({
        id: inc.id,
        lat: inc.geo.latitude,
        lng: inc.geo.longitude,
        priority: inc.priority,
        emergencyType: inc.emergencyType,
        callerName: inc.callerName,
        status: inc.dispatchStatus,
      }));
      setMapIncidents(withLocation);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    }
  };

  const speakAI = async (text: string) => {
    setIsSpeaking(true);
    setCurrentQuestion(text);

    try {
      // Try ElevenLabs first
      const res = await fetch(`${API_URL}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audioRef.current = null;
        };
        
        await audio.play();
      } else {
        // Fallback to browser TTS
        fallbackSpeak(text);
      }
    } catch (err) {
      // Fallback to browser TTS
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + " ";
        }
      }

      if (finalTranscript) {
        if (callState === "listening") {
          setTranscript((prev) => prev + finalTranscript);
          currentAnswerRef.current = "";
        } else if (callState === "waiting_answer") {
          currentAnswerRef.current += finalTranscript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      if (callState !== "idle" && callState !== "completed") {
        recognition.start(); // Keep listening
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const runTriage = async (transcriptText: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          notes: "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary || "");
        setDetectedPriority(data.priority || "medium");
        setDetectedEmergencyType(inferEmergencyType(transcriptText));
        setDetectedLocation(extractLocation(transcriptText));
        
        // Set questions queue
        if (data.questions && data.questions.length > 0) {
          setQuestionQueue(data.questions);
        }
        
        return data;
      }
    } catch (err) {
      console.error("Triage failed:", err);
    }
    return null;
  };

  const extractLocation = (text: string): string => {
    // Simple location extraction - look for common patterns
    const streetMatch = text.match(/(\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln))/i);
    if (streetMatch) return streetMatch[0];
    
    const placeMatch = text.match(/(at|near|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (placeMatch) return placeMatch[2];
    
    return "Location pending";
  };

  const inferEmergencyType = (text: string): string => {
    const lower = text.toLowerCase();
    if (/(fire|smoke|burning|flames)/.test(lower)) return "fire";
    if (/(shot|gun|stab|assault|robbery|attack)/.test(lower)) return "crime";
    if (/(hurt|injured|bleeding|unconscious|chest pain|breathing|overdose)/.test(lower)) return "medical";
    if (/(crash|accident|collision)/.test(lower)) return "accident";
    return "other";
  };

  const startAICall = async () => {
    setCallState("greeting");
    setElapsedTime(0);
    setTranscript("");
    setAiSummary("");
    setAiQuestions([]);
    setAiAnswers([]);
    setQuestionQueue([]);
    setDetectedPriority("");
    setDetectedEmergencyType("");
    setDetectedLocation("");
    currentAnswerRef.current = "";

    // AI greets caller
    await speakAI("911, what's your emergency?");

    // Start listening
    startListening();
    
    // Move to listening state
    setCallState("listening");

    // After 15 seconds of initial listening, analyze
    setTimeout(() => {
      if (callState === "listening" || transcript.length > 50) {
        analyzeCall();
      }
    }, 15000);
  };

  const analyzeCall = async () => {
    if (!transcript.trim()) {
      await speakAI("I didn't catch that. Can you describe the emergency?");
      return;
    }

    setCallState("analyzing");
    const triageData = await runTriage(transcript);

    if (triageData && triageData.questions && triageData.questions.length > 0) {
      setCallState("asking");
      askNextQuestion();
    } else {
      // No questions needed, create incident
      await createIncident();
    }
  };

  const askNextQuestion = async () => {
    if (questionQueue.length === 0) {
      await createIncident();
      return;
    }

    const question = questionQueue[0];
    setQuestionQueue((prev) => prev.slice(1));
    setAiQuestions((prev) => [...prev, question]);
    currentAnswerRef.current = "";

    setCallState("asking");
    await speakAI(question);
    setCallState("waiting_answer");

    // Wait for answer (10 seconds timeout)
    setTimeout(() => {
      if (callState === "waiting_answer") {
        const answer = currentAnswerRef.current.trim();
        if (answer) {
          setAiAnswers((prev) => [...prev, answer]);
          setTranscript((prev) => prev + "\n[AI]: " + question + "\n[Caller]: " + answer);
        }
        askNextQuestion();
      }
    }, 10000);
  };

  const createIncident = async () => {
    setCallState("creating");

    try {
      const payload = {
        callerName: "Caller " + Math.floor(Math.random() * 1000),
        phone: "Unknown",
        transcript,
        notes: "",
        location: detectedLocation,
        priority: detectedPriority,
        emergencyType: detectedEmergencyType,
        aiSummary,
        aiQuestions,
        aiAnswers,
      };

      const res = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.incident.requiresHuman) {
          await speakAI("I'm connecting you with a dispatcher now. Stay on the line.");
        } else {
          await speakAI("Help is on the way. Stay safe.");
        }

        setCallState("completed");
        await fetchIncidents();

        // Reset after 3 seconds
        setTimeout(() => {
          stopListening();
          setCallState("idle");
          setElapsedTime(0);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to create incident:", err);
      setCallState("idle");
    }
  };

  const stopAICall = () => {
    stopListening();
    setCallState("idle");
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-slate-400";
    }
  };

  const getCallStateDisplay = () => {
    switch (callState) {
      case "idle":
        return "Ready";
      case "greeting":
        return "AI Greeting Caller";
      case "listening":
        return "AI Listening";
      case "analyzing":
        return "AI Analyzing...";
      case "asking":
        return "AI Asking Questions";
      case "waiting_answer":
        return "Waiting for Answer";
      case "creating":
        return "Creating Incident...";
      case "completed":
        return "Call Completed";
      default:
        return "Unknown";
    }
  };

  const activeIncidents = incidents.filter((inc) => inc.dispatchStatus === "not-dispatched");
  const dispatchedIncidents = incidents.filter((inc) => inc.dispatchStatus !== "not-dispatched" && inc.dispatchStatus !== "resolved");
  const resolvedIncidents = incidents.filter((inc) => inc.dispatchStatus === "resolved");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <span className="font-sans text-2xl font-bold">police.ai</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/call-intake" className="btn-primary">
              Call Intake
            </Link>
            <Link href="/dashboard" className="btn-ghost">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Stats Bar */}
      <div className="border-b border-slate-700 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 py-4 grid grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">Unresolved</div>
            <div className="text-2xl font-bold text-red-500">{activeIncidents.length}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">Open</div>
            <div className="text-2xl font-bold text-yellow-500">{activeIncidents.filter(i => i.requiresHuman).length}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">Dispatched</div>
            <div className="text-2xl font-bold text-blue-500">{dispatchedIncidents.length}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">Resolved</div>
            <div className="text-2xl font-bold text-green-500">{resolvedIncidents.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: AI Call Interface */}
          <div className="space-y-6">
            {/* AI Call Control Panel */}
            <div className="card border-2 border-primary/50">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-sans text-3xl font-bold">AI Call Handler</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`flex items-center gap-2 ${callState !== "idle" ? "text-green-500" : "text-slate-500"}`}>
                      <Activity className={`w-5 h-5 ${callState !== "idle" ? "animate-pulse" : ""}`} />
                      <span className="font-semibold">{getCallStateDisplay()}</span>
                    </div>
                    {isSpeaking && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Volume2 className="w-5 h-5 animate-pulse" />
                        <span className="text-sm">AI Speaking</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div className="text-3xl font-mono font-bold text-primary">
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                  {callState === "idle" || callState === "completed" ? (
                    <button onClick={startAICall} className="btn-primary flex items-center gap-2">
                      <Mic className="w-5 h-5" />
                      Answer Call
                    </button>
                  ) : (
                    <button onClick={stopAICall} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2">
                      <MicOff className="w-5 h-5" />
                      End Call
                    </button>
                  )}
                </div>
              </div>

              {/* AI Status Info */}
              {callState !== "idle" && (
                <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-400">Priority</div>
                    <div className={`text-lg font-bold uppercase ${getPriorityColor(detectedPriority)}`}>
                      {detectedPriority || "Detecting..."}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Emergency Type</div>
                    <div className="text-lg font-bold capitalize">{detectedEmergencyType || "Detecting..."}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Location</div>
                    <div className="text-lg font-bold truncate">{detectedLocation || "Detecting..."}</div>
                  </div>
                </div>
              )}

              {/* Current AI Question */}
              {currentQuestion && (
                <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="text-xs text-blue-400 mb-1 font-semibold">AI Currently Asking:</div>
                  <div className="text-lg">{currentQuestion}</div>
                </div>
              )}

              {/* Live Transcript */}
              <div>
                <label className="block text-sm font-semibold mb-2">Live Transcript</label>
                <textarea
                  className="textarea-field h-64 font-mono text-sm"
                  value={transcript}
                  readOnly
                  placeholder="Transcript will appear here as caller speaks..."
                />
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">AI Summary</label>
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-sm">
                    {aiSummary}
                  </div>
                </div>
              )}

              {/* Sentiment Analysis */}
              {callState !== "idle" && transcript && (
                <div className="mt-4">
                  <SentimentAnalysis transcript={transcript} />
                </div>
              )}

              {/* Audio Analyzer */}
              {callState !== "idle" && transcript && (
                <div className="mt-4">
                  <AudioAnalyzer transcript={transcript} />
                </div>
              )}

              {/* Medical Assistant Toggle */}
              {detectedEmergencyType === "medical" && callState !== "idle" && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowMedicalAssist(!showMedicalAssist)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    {showMedicalAssist ? "Hide Medical Instructions" : "Show Medical Instructions"}
                  </button>
                </div>
              )}

              {/* Medical Assistant Panel */}
              {showMedicalAssist && detectedEmergencyType === "medical" && (
                <div className="mt-4">
                  <MedicalAssistant
                    emergencyType={detectedEmergencyType}
                    onInstructionSpoken={async (instruction) => {
                      await speakAI(instruction);
                    }}
                  />
                </div>
              )}

              {/* Q&A Trail */}
              {aiQuestions.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">AI Q&A Trail</label>
                  <div className="bg-slate-800 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {aiQuestions.map((q, i) => (
                      <div key={i} className="text-sm">
                        <div className="text-blue-400 font-semibold">Q: {q}</div>
                        {aiAnswers[i] && (
                          <div className="text-slate-300 ml-4 mb-2">A: {aiAnswers[i]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Call Monitoring */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-sans text-2xl font-bold">Live Call Monitor</h3>
              <div className="flex gap-2">
                <Link href="/analytics" className="btn-primary text-sm px-4 py-2">
                  Analytics
                </Link>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              </div>
            </div>

            {/* Live Map */}
            {showMap && mapIncidents.length > 0 && (
              <div className="mb-6 rounded-lg overflow-hidden border-2 border-slate-600" style={{ height: '400px' }}>
                <LiveMap incidents={mapIncidents} units={[
                  { id: 'unit1', lat: mapIncidents[0]?.lat || 33.7490, lng: mapIncidents[0]?.lng || -84.3880, callsign: 'E-101', status: 'available' }
                ]} />
              </div>
            )}

            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {incidents.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No active calls</p>
              ) : (
                incidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)}
                    className={`bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                      selectedIncident?.id === incident.id ? "border-primary" : "border-transparent"
                    } ${incident.requiresHuman ? "ring-2 ring-red-500" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">{incident.callerName}</span>
                          {incident.requiresHuman && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              HUMAN NEEDED
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            incident.dispatchStatus === "not-dispatched" ? "bg-yellow-600" :
                            incident.dispatchStatus === "dispatched" ? "bg-blue-600" :
                            incident.dispatchStatus === "resolved" ? "bg-green-600" : "bg-slate-600"
                          } text-white`}>
                            {incident.dispatchStatus}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(incident.createdAt).toLocaleTimeString()} • {incident.emergencyType}
                        </div>
                        {incident.location !== "Location pending" && (
                          <div className="text-sm text-slate-300 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-semibold uppercase text-sm ${getPriorityColor(incident.priority)}`}>
                          {incident.priority}
                        </span>
                        <span className="text-xs text-slate-400">Panic: {Math.round(incident.panicScore * 100)}%</span>
                      </div>
                    </div>

                    {selectedIncident?.id === incident.id && (
                      <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                        {incident.aiSummary && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 mb-1">AI Summary</div>
                            <div className="text-sm bg-blue-900/30 rounded p-3">{incident.aiSummary}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-slate-400 mb-1">Transcript</div>
                          <div className="text-sm bg-slate-800 rounded p-3 max-h-32 overflow-y-auto font-mono">
                            {incident.transcript || "No transcript available"}
                          </div>
                        </div>
                        {incident.aiQuestions && incident.aiQuestions.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-400 mb-2">AI Q&A</div>
                            <div className="space-y-1">
                              {incident.aiQuestions.map((q, i) => (
                                <div key={i} className="text-xs">
                                  <div className="text-blue-400">Q: {q}</div>
                                  {incident.aiAnswers[i] && (
                                    <div className="text-slate-300 ml-3">A: {incident.aiAnswers[i]}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {incident.escalationReason && (
                          <div>
                            <div className="text-xs font-semibold text-red-400 mb-1">Escalation Reason</div>
                            <div className="text-sm text-red-300">{incident.escalationReason}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
