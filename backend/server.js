import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const fallbackIncidents = [];
const fallbackAudit = [];

const initFirestore = () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return null;
  }
  if (admin.apps.length) {
    return admin.firestore();
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
  return admin.firestore();
};

const firestore = initFirestore();
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const geminiModel = gemini ? gemini.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

const computePriority = (incident) => {
  const transcript = (incident.transcript || "").toLowerCase();
  const notes = (incident.notes || "").toLowerCase();
  const combined = `${transcript} ${notes}`;
  if (/(gun|shot|bleed|bleeding|unconscious|cardiac|not breathing|fire|explosion)/.test(combined)) {
    return "critical";
  }
  if (/(injury|accident|crash|assault|overdose|seizure)/.test(combined)) {
    return "high";
  }
  if (/(suspicious|theft|break in|break-in|missing|disturbance)/.test(combined)) {
    return "medium";
  }
  if (combined.trim().length === 0 || /(information|fyi|report only|noise complaint)/.test(combined)) {
    return "info";
  }
  return "low";
};

const detectLanguage = (incident) => {
  const text = `${incident.transcript || ""} ${incident.notes || ""}`.toLowerCase();
  if (/(hola|gracias|ayuda|policia)/.test(text)) return "es";
  if (/(bonjour|merci|aidez|police)/.test(text)) return "fr";
  if (/(hallo|hilfe|polizei)/.test(text)) return "de";
  return "en";
};

const computePanicScore = (incident) => {
  const text = `${incident.transcript || ""} ${incident.notes || ""}`;
  const lowered = text.toLowerCase();
  let score = 0.2;
  if (/(panic|help|please|hurry|screaming|crying)/.test(lowered)) score += 0.35;
  if (/[!]{2,}/.test(text)) score += 0.15;
  if (text.length > 240) score += 0.1;
  return Math.min(1, score);
};

const computeNoiseLevel = (incident) => {
  const text = `${incident.transcript || ""}`;
  if (/(background noise|crowd|sirens|chaos)/i.test(text)) return "high";
  if (text.length > 180) return "medium";
  return "low";
};

const addAudit = async (action, detail) => {
  const entry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    action,
    detail
  };
  fallbackAudit.unshift(entry);
  if (firestore) {
    await firestore.collection("audit").doc(entry.id).set(entry);
  }
};

const saveIncident = async (incident) => {
  fallbackIncidents.unshift(incident);
  if (firestore) {
    await firestore.collection("incidents").doc(incident.id).set(incident);
  }
};

const updateIncident = async (id, patch) => {
  if (firestore) {
    const ref = firestore.collection("incidents").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const updated = { ...snap.data(), ...patch };
    await ref.set(updated, { merge: true });
    return updated;
  }
  const incident = fallbackIncidents.find((item) => item.id === id);
  if (!incident) return null;
  Object.assign(incident, patch);
  return incident;
};

const listIncidents = async ({ status, priority, q, limit }) => {
  if (firestore) {
    let query = firestore.collection("incidents").orderBy("createdAt", "desc");
    if (status) query = query.where("dispatchStatus", "==", status);
    if (priority) query = query.where("priority", "==", priority);
    if (limit) query = query.limit(Number(limit));
    const snapshot = await query.get();
    let results = snapshot.docs.map((doc) => doc.data());
    if (q) {
      const needle = String(q).toLowerCase();
      results = results.filter((item) =>
        `${item.callerName} ${item.location} ${item.transcript}`.toLowerCase().includes(needle)
      );
    }
    return results;
  }

  let results = [...fallbackIncidents];
  if (status) {
    results = results.filter((item) => item.dispatchStatus === status);
  }
  if (priority) {
    results = results.filter((item) => item.priority === priority);
  }
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((item) =>
      `${item.callerName} ${item.location} ${item.transcript}`.toLowerCase().includes(needle)
    );
  }
  return limit ? results.slice(0, Number(limit)) : results;
};

const getIncident = async (id) => {
  if (firestore) {
    const snap = await firestore.collection("incidents").doc(id).get();
    return snap.exists ? snap.data() : null;
  }
  return fallbackIncidents.find((item) => item.id === id) || null;
};

const getAudit = async () => {
  if (firestore) {
    const snapshot = await firestore.collection("audit").orderBy("at", "desc").limit(200).get();
    return snapshot.docs.map((doc) => doc.data());
  }
  return fallbackAudit.slice(0, 200);
};

app.get("/health", (req, res) => {
  res.json({ status: "ok", firestore: Boolean(firestore), gemini: Boolean(geminiModel) });
});

app.get("/api/incidents", async (req, res) => {
  const { status, priority, q, limit } = req.query;
  const incidents = await listIncidents({ status, priority, q, limit });
  res.json({ incidents });
});

app.get("/api/incidents/:id", async (req, res) => {
  const incident = await getIncident(req.params.id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json({ incident });
});

app.post("/api/incidents", async (req, res) => {
  const {
    callerName,
    phone,
    transcript,
    notes,
    location,
    geo,
    priority,
    emergencyType,
    peopleCount,
    injuries,
    danger,
    relationship,
    specialCircumstances,
    accessibility,
    buildingDetails,
    language,
    callDuration,
    callRecording,
    callbackRequested,
    callDropped,
    aiSummary
  } = req.body || {};

  const derivedPriority = priority || computePriority({ transcript, notes });
  const detectedLanguage = language || detectLanguage({ transcript, notes });
  const panicScore = computePanicScore({ transcript, notes });
  const noiseLevel = computeNoiseLevel({ transcript });
  const requiresHuman = ["critical", "high"].includes(derivedPriority) || panicScore >= 0.7;
  const escalationReason = requiresHuman
    ? (["critical", "high"].includes(derivedPriority) ? "High priority" : "High panic score")
    : "";

  const incident = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    callerName: callerName || "Unknown",
    phone: phone || "Unknown",
    transcript: transcript || "",
    notes: notes || "",
    location: location || "Unknown",
    geo: geo || null,
    priority: derivedPriority,
    emergencyType: emergencyType || "unknown",
    peopleCount: peopleCount || "unknown",
    injuries: injuries || "unknown",
    danger: danger || "unknown",
    relationship: relationship || "unknown",
    specialCircumstances: specialCircumstances || "",
    accessibility: accessibility || "",
    buildingDetails: buildingDetails || "",
    language: detectedLanguage,
    callDuration: callDuration || 0,
    callRecording: Boolean(callRecording),
    callbackRequested: Boolean(callbackRequested),
    callDropped: Boolean(callDropped),
    panicScore,
    noiseLevel,
    interruptCount: 0,
    aiSummary: aiSummary || "",
    aiQuestions: Array.isArray(req.body?.aiQuestions) ? req.body.aiQuestions : [],
    aiAnswers: Array.isArray(req.body?.aiAnswers) ? req.body.aiAnswers : [],
    requiresHuman,
    escalationReason,
    humanAssigned: false,
    humanNotes: "",
    dispatchStatus: "not-dispatched",
    dispatchUnits: [],
    timeline: [
      { at: new Date().toISOString(), label: "Call received" }
    ]
  };

  await saveIncident(incident);
  await addAudit("incident.created", `${incident.callerName} @ ${incident.location}`);
  res.status(201).json({ incident });
});

app.patch("/api/incidents/:id", async (req, res) => {
  const {
    dispatchStatus,
    dispatchUnits,
    notes,
    priority,
    location,
    geo,
    timelineEntry,
    callDropped,
    callbackRequested,
    emergencyType,
    peopleCount,
    injuries,
    danger,
    relationship,
    specialCircumstances,
    accessibility,
    buildingDetails,
    language,
    callDuration,
    interruptCount,
    aiSummary,
    aiQuestions,
    aiAnswers,
    requiresHuman,
    escalationReason,
    humanAssigned,
    humanNotes
  } = req.body || {};

  const patch = {
    ...(dispatchStatus ? { dispatchStatus } : {}),
    ...(Array.isArray(dispatchUnits) ? { dispatchUnits } : {}),
    ...(typeof notes === "string" ? { notes } : {}),
    ...(priority ? { priority } : {}),
    ...(location ? { location } : {}),
    ...(geo ? { geo } : {}),
    ...(typeof callDropped === "boolean" ? { callDropped } : {}),
    ...(typeof callbackRequested === "boolean" ? { callbackRequested } : {}),
    ...(emergencyType ? { emergencyType } : {}),
    ...(peopleCount ? { peopleCount } : {}),
    ...(injuries ? { injuries } : {}),
    ...(danger ? { danger } : {}),
    ...(relationship ? { relationship } : {}),
    ...(specialCircumstances ? { specialCircumstances } : {}),
    ...(accessibility ? { accessibility } : {}),
    ...(buildingDetails ? { buildingDetails } : {}),
    ...(language ? { language } : {}),
    ...(typeof callDuration === "number" ? { callDuration } : {}),
    ...(typeof interruptCount === "number" ? { interruptCount } : {}),
    ...(typeof aiSummary === "string" ? { aiSummary } : {}),
    ...(Array.isArray(aiQuestions) ? { aiQuestions } : {}),
    ...(Array.isArray(aiAnswers) ? { aiAnswers } : {}),
    ...(typeof requiresHuman === "boolean" ? { requiresHuman } : {}),
    ...(typeof escalationReason === "string" ? { escalationReason } : {}),
    ...(typeof humanAssigned === "boolean" ? { humanAssigned } : {}),
    ...(typeof humanNotes === "string" ? { humanNotes } : {})
  };

  if (timelineEntry) {
    const incident = await getIncident(req.params.id);
    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }
    patch.timeline = [
      { at: new Date().toISOString(), label: timelineEntry },
      ...(incident.timeline || [])
    ];
  }

  const updated = await updateIncident(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  await addAudit("incident.updated", `${req.params.id} ${timelineEntry || "updated"}`);
  res.json({ incident: updated });
});

app.post("/api/incidents/:id/callback", async (req, res) => {
  const existing = await getIncident(req.params.id);
  const updated = await updateIncident(req.params.id, {
    callbackRequested: true,
    timeline: [
      { at: new Date().toISOString(), label: "Callback requested" },
      ...((existing?.timeline || []))
    ]
  });
  if (!updated) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  await addAudit("incident.callback", `${req.params.id} callback requested`);
  res.json({ incident: updated });
});

app.get("/api/audit", async (req, res) => {
  const audit = await getAudit();
  res.json({ audit });
});

app.post("/api/ai/triage", async (req, res) => {
  if (!geminiModel) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }
  const incident = req.body || {};
  const prompt = [
    "You are an emergency dispatcher assistant.",
    "Return JSON only with fields: summary, priority, language, flags, recommendedDispatch, questions.",
    "summary: short, factual, 2-3 sentences.",
    "priority: one of critical, high, medium, low, info.",
    "language: ISO code (en, es, fr, de) based on caller text.",
    "flags: array of short tags (panic, weapons, medical, fire, etc.).",
    "recommendedDispatch: short sentence describing units.",
    "questions: array of short follow-up questions.",
    `Incident data: ${JSON.stringify(incident)}`
  ].join("\n");

  try {
    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    res.json({
      summary: parsed.summary || "",
      priority: parsed.priority || computePriority(incident),
      language: parsed.language || detectLanguage(incident),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      recommendedDispatch: parsed.recommendedDispatch || "",
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    });
  } catch (error) {
    res.status(502).json({ error: "Gemini request failed" });
  }
});

app.post("/api/voice/tts", async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = req.body?.voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    res.status(503).json({ error: "ElevenLabs not configured" });
    return;
  }
  const text = req.body?.text;
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const payload = {
    text,
    model_id: req.body?.modelId || "eleven_turbo_v2",
    voice_settings: {
      stability: typeof req.body?.stability === "number" ? req.body.stability : 0.4,
      similarity_boost: typeof req.body?.similarityBoost === "number" ? req.body.similarityBoost : 0.7
    }
  };

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      res.status(502).json({ error: "ElevenLabs request failed" });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    res.status(502).json({ error: "ElevenLabs request failed" });
  }
});

app.listen(port, () => {
  console.log(`AI 911 backend running on http://localhost:${port}`);
});
