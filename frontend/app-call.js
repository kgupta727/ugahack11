const apiBase = "http://localhost:5050";

const startCall = document.getElementById("startCall");
const stopCall = document.getElementById("stopCall");
const toggleListen = document.getElementById("toggleListen");
const geoLocate = document.getElementById("geoLocate");
const playback = document.getElementById("playback");
const createIncident = document.getElementById("createIncident");
const clearIncident = document.getElementById("clearIncident");
const refreshQueue = document.getElementById("refreshQueue");
const callList = document.getElementById("callList");
const callState = document.getElementById("callState");
const callTimer = document.getElementById("callTimer");
const aiFlags = document.getElementById("aiFlags");
const themeToggle = document.getElementById("themeToggle");
const auditList = document.getElementById("auditList");
const refreshAudit = document.getElementById("refreshAudit");
const runTriage = document.getElementById("runTriage");

const callerName = document.getElementById("callerName");
const callerPhone = document.getElementById("callerPhone");
const locationText = document.getElementById("locationText");
const priority = document.getElementById("priority");
const transcript = document.getElementById("transcript");
const notes = document.getElementById("notes");
const aiSummary = document.getElementById("aiSummary");
const aiQuestions = document.getElementById("aiQuestions");
const aiAnswers = document.getElementById("aiAnswers");
const emergencyType = document.getElementById("emergencyType");
const peopleCount = document.getElementById("peopleCount");
const injuries = document.getElementById("injuries");
const danger = document.getElementById("danger");
const relationship = document.getElementById("relationship");
const specialCircumstances = document.getElementById("specialCircumstances");
const buildingDetails = document.getElementById("buildingDetails");
const accessibility = document.getElementById("accessibility");
const language = document.getElementById("language");
const panicScore = document.getElementById("panicScore");
const noiseLevel = document.getElementById("noiseLevel");
const callRecording = document.getElementById("callRecording");
const callDropped = document.getElementById("callDropped");
const callbackRequested = document.getElementById("callbackRequested");

const statusButtons = document.querySelectorAll("[data-dispatch]");

let recognition;
let listening = false;
let callActive = false;
let callStartTime;
let timerInterval;
let selectedIncidentId = null;
let currentGeo = null;
let interruptCount = 0;

const createChip = (text) => {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = text;
  return chip;
};

const updateFlags = () => {
  aiFlags.innerHTML = "";
  const combined = `${transcript.value} ${notes.value} ${specialCircumstances.value}`.toLowerCase();
  const flags = [];
  if (/(gun|shot|bleed|bleeding|unconscious|cardiac|not breathing|fire|explosion)/.test(combined)) {
    flags.push("Critical cues detected");
  }
  if (/(panic|help|please|hurry|screaming)/.test(combined)) {
    flags.push("Panic indicators");
  }
  if (/(child|baby|elderly)/.test(combined)) {
    flags.push("Vulnerable caller");
  }
  flags.forEach((flag) => aiFlags.appendChild(createChip(flag)));

  if (!priority.value || priority.value === "medium") {
    const inferred = inferPriority(combined);
    priority.value = inferred;
  }

  const panic = computePanicScore(combined);
  panicScore.textContent = panic.toFixed(2);
  noiseLevel.textContent = computeNoiseLevel(combined);
  language.value = detectLanguage(combined);
};

const inferPriority = (text) => {
  if (/(gun|shot|bleed|bleeding|unconscious|cardiac|not breathing|fire|explosion)/.test(text)) {
    return "critical";
  }
  if (/(injury|accident|crash|assault|overdose|seizure)/.test(text)) {
    return "high";
  }
  if (/(suspicious|theft|break in|break-in|missing|disturbance)/.test(text)) {
    return "medium";
  }
  if (/(information|fyi|report only|noise complaint)/.test(text)) {
    return "info";
  }
  return "low";
};

const detectLanguage = (text) => {
  if (/(hola|gracias|ayuda|policia)/.test(text)) return "es";
  if (/(bonjour|merci|aidez|police)/.test(text)) return "fr";
  if (/(hallo|hilfe|polizei)/.test(text)) return "de";
  return "en";
};

const computePanicScore = (text) => {
  let score = 0.2;
  if (/(panic|help|please|hurry|screaming|crying)/.test(text)) score += 0.35;
  if (/[!]{2,}/.test(text)) score += 0.15;
  if (text.length > 240) score += 0.1;
  return Math.min(1, score);
};

const computeNoiseLevel = (text) => {
  if (/(background noise|crowd|sirens|chaos)/.test(text)) return "High";
  if (text.length > 180) return "Medium";
  return "Low";
};

const startTimer = () => {
  callStartTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const display = `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    callTimer.textContent = display;
  }, 1000);
};

const stopTimer = () => {
  clearInterval(timerInterval);
  callTimer.textContent = "00:00";
};

const setCallState = (state) => {
  callState.textContent = state;
};

const ensureRecognition = () => {
  if (recognition) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toggleListen.textContent = "Voice Unsupported";
    toggleListen.disabled = true;
    return;
  }
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let combined = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      combined += event.results[i][0].transcript;
    }
    transcript.value = `${transcript.value} ${combined}`.trim();
    updateFlags();
  };

  recognition.onerror = () => {
    listening = false;
    toggleListen.textContent = "Voice Intake";
  };
};

const startListening = () => {
  ensureRecognition();
  if (!recognition) return;
  recognition.lang = language.value === "es" ? "es-ES" :
    language.value === "fr" ? "fr-FR" :
    language.value === "de" ? "de-DE" : "en-US";
  recognition.start();
  listening = true;
  toggleListen.textContent = "Stop Intake";
};

const stopListening = () => {
  if (recognition && listening) recognition.stop();
  listening = false;
  toggleListen.textContent = "Voice Intake";
};

const speak = (text) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const speakWithElevenLabs = async (text) => {
  const response = await fetch(`${apiBase}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    speak(text);
    return;
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  audio.onended = () => URL.revokeObjectURL(audioUrl);
};

const createIncidentPayload = () => ({
  callerName: callerName.value.trim(),
  phone: callerPhone.value.trim(),
  transcript: transcript.value.trim(),
  notes: notes.value.trim(),
  location: locationText.value.trim() || "Unknown",
  geo: currentGeo,
  priority: priority.value,
  emergencyType: emergencyType.value,
  peopleCount: peopleCount.value,
  injuries: injuries.value,
  danger: danger.value,
  relationship: relationship.value,
  specialCircumstances: specialCircumstances.value.trim(),
  accessibility: accessibility.value.trim(),
  buildingDetails: buildingDetails.value.trim(),
  language: language.value,
  callDuration: callActive ? Math.floor((Date.now() - callStartTime) / 1000) : 0,
  callRecording: callRecording.checked,
  callbackRequested: callbackRequested.checked,
  callDropped: callDropped.checked,
  interruptCount,
  aiSummary: aiSummary.value.trim(),
  aiQuestions: aiQuestions.value.split("\n").filter((line) => line.trim()),
  aiAnswers: aiAnswers.value.split("\n").filter((line) => line.trim())
});

const renderCallList = (incidents) => {
  if (!callList) return;
  callList.innerHTML = "";
  incidents.forEach((incident) => {
    const row = document.createElement("div");
    row.className = "call-row";
    row.dataset.id = incident.id;

    row.innerHTML = `
      <div>
        <strong>${incident.callerName}</strong>
        <p class="mini">${incident.location} · ${incident.emergencyType || "unknown"}</p>
      </div>
      <div class="call-meta">
        <span class="priority ${incident.priority}">${incident.priority}</span>
        <span class="mini">${incident.dispatchStatus}</span>
      </div>
    `;

    row.addEventListener("click", () => {
      selectedIncidentId = incident.id;
      document.querySelectorAll(".call-row").forEach((item) => item.classList.remove("selected"));
      row.classList.add("selected");
    });

    callList.appendChild(row);
  });
};

const fetchIncidents = async () => {
  const response = await fetch(`${apiBase}/api/incidents`);
  const data = await response.json();
  if (callList) {
    renderCallList(data.incidents || []);
  }
};

const fetchAudit = async () => {
  if (!auditList) return;
  const response = await fetch(`${apiBase}/api/audit`);
  const data = await response.json();
  const logs = data.audit || [];
  auditList.innerHTML = "";
  logs.slice(0, 12).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "audit-item";
    item.textContent = `${new Date(entry.at).toLocaleTimeString()} · ${entry.action} · ${entry.detail}`;
    auditList.appendChild(item);
  });
};

startCall.addEventListener("click", () => {
  if (callActive) return;
  callActive = true;
  setCallState("Active - AI handling");
  startTimer();
  startCall.disabled = true;
  stopCall.disabled = false;
  speak("911, what is your emergency? Stay with me. I am here to help.");
});

stopCall.addEventListener("click", () => {
  callActive = false;
  setCallState("Call ended");
  stopTimer();
  startCall.disabled = false;
  stopCall.disabled = true;
  stopListening();
  interruptCount = 0;
});

toggleListen.addEventListener("click", () => {
  if (listening) {
    stopListening();
  } else {
    startListening();
  }
});

playback.addEventListener("click", () => {
  interruptCount += 1;
  speakWithElevenLabs("I have your location and details. Help is on the way. Stay safe.");
});

geoLocate.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationText.value = "Geolocation not supported";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      currentGeo = { latitude, longitude, accuracy };
      locationText.value = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
    },
    () => {
      locationText.value = "Unable to access GPS";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

createIncident.addEventListener("click", async () => {
  updateFlags();
  const payload = createIncidentPayload();
  if (!payload.transcript && !payload.notes) {
    speakWithElevenLabs("Please share the details of the emergency.");
  }

  const response = await fetch(`${apiBase}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    clearForm();
    fetchIncidents();
    fetchAudit();
  }
});

clearIncident.addEventListener("click", () => {
  clearForm();
});

if (refreshQueue) {
  refreshQueue.addEventListener("click", () => {
    fetchIncidents();
  });
}

if (refreshAudit) {
  refreshAudit.addEventListener("click", () => {
    fetchAudit();
  });
}

statusButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!selectedIncidentId) return;
    const status = button.dataset.dispatch;
    await fetch(`${apiBase}/api/incidents/${selectedIncidentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dispatchStatus: status, timelineEntry: `Status set to ${status}` })
    });
    fetchIncidents();
  });
});

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
  }
  localStorage.setItem("nexus-theme", theme);
};

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("nexus-theme");
setTheme(savedTheme || "dark");

const clearForm = () => {
  callerName.value = "";
  callerPhone.value = "";
  locationText.value = "";
  transcript.value = "";
  notes.value = "";
  aiSummary.value = "";
  aiQuestions.value = "";
  aiAnswers.value = "";
  priority.value = "high";
  emergencyType.value = "other";
  peopleCount.value = "unknown";
  injuries.value = "unknown";
  danger.value = "unknown";
  relationship.value = "unknown";
  specialCircumstances.value = "";
  buildingDetails.value = "";
  accessibility.value = "";
  language.value = "en";
  callRecording.checked = false;
  callDropped.checked = false;
  callbackRequested.checked = false;
  panicScore.textContent = "0.0";
  noiseLevel.textContent = "Low";
  aiFlags.innerHTML = "";
};

[transcript, notes, specialCircumstances].forEach((field) => field.addEventListener("input", updateFlags));

fetchIncidents();
fetchAudit();

if (runTriage) {
  runTriage.addEventListener("click", async () => {
    runTriage.disabled = true;
    runTriage.textContent = "Running...";
    const payload = createIncidentPayload();
    const response = await fetch(`${apiBase}/api/ai/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const data = await response.json();
      aiSummary.value = data.summary || aiSummary.value;
      if (data.priority) priority.value = data.priority;
      if (data.language) language.value = data.language;
      if (Array.isArray(data.questions)) {
        aiQuestions.value = data.questions.join("\n");
      }
      updateFlags();
    }
    runTriage.disabled = false;
    runTriage.textContent = "Run AI Triage";
  });
}
