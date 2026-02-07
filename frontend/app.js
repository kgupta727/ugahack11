const apiBase = "http://localhost:5050";

const currentCall = document.getElementById("currentCall");
const callList = document.getElementById("callList");
const refreshQueue = document.getElementById("refreshQueue");
const auditList = document.getElementById("auditList");
const refreshAudit = document.getElementById("refreshAudit");
const themeToggle = document.getElementById("themeToggle");

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
  }
  localStorage.setItem("nexus-theme", theme);
};

const renderCurrentCall = (incident) => {
  if (!currentCall) return;
  if (!incident) {
    currentCall.innerHTML = "<div class=\"empty-state\">No active calls</div>";
    return;
  }

  const escalation = incident.requiresHuman
    ? `<div class="escalation">Human takeover required · ${incident.escalationReason || "High priority"}</div>`
    : "";

  const questions = (incident.aiQuestions || []).map((q) => `<li>${q}</li>`).join("");
  const answers = (incident.aiAnswers || []).join("\n");

  currentCall.innerHTML = `
    <div class="current-card">
      <div class="current-header">
        <div>
          <h2>Current Call</h2>
          <p class="mini">${incident.callerName} · ${incident.location}</p>
        </div>
        <span class="priority ${incident.priority}">${incident.priority}</span>
      </div>
      ${escalation}
      <div class="current-meta">
        <div>
          <p class="metric-label">Emergency type</p>
          <p class="metric-value">${incident.emergencyType || "unknown"}</p>
        </div>
        <div>
          <p class="metric-label">Dispatch</p>
          <p class="metric-value">${incident.dispatchStatus}</p>
        </div>
        <div>
          <p class="metric-label">Panic score</p>
          <p class="metric-value">${incident.panicScore?.toFixed?.(2) || incident.panicScore || "0.0"}</p>
        </div>
        <div>
          <p class="metric-label">Language</p>
          <p class="metric-value">${incident.language || "en"}</p>
        </div>
      </div>
      <div class="current-body">
        <div>
          <h3>AI Summary</h3>
          <p class="mini">${incident.aiSummary || "No AI summary yet."}</p>
        </div>
        <div>
          <h3>AI Questions</h3>
          <ul class="mini">${questions || "<li>No AI questions logged.</li>"}</ul>
        </div>
        <div>
          <label>Human Answers</label>
          <textarea id="humanAnswers" rows="4" placeholder="Operator responses to AI questions...">${answers}</textarea>
        </div>
        <div>
          <label>Human Notes</label>
          <textarea id="humanNotes" rows="4" placeholder="Dispatcher notes...">${incident.humanNotes || ""}</textarea>
        </div>
      </div>
      <div class="current-actions">
        <button class="primary" id="saveHandoff">Save Handoff Notes</button>
        <div class="status-controls">
          <button class="ghost" data-status="not-dispatched">Not Dispatched</button>
          <button class="ghost" data-status="en-route">En Route</button>
          <button class="ghost" data-status="on-scene">On Scene</button>
          <button class="ghost" data-status="resolved">Resolved</button>
        </div>
      </div>
    </div>
  `;

  const saveButton = document.getElementById("saveHandoff");
  const answersField = document.getElementById("humanAnswers");
  const notesField = document.getElementById("humanNotes");
  const statusButtons = currentCall.querySelectorAll("[data-status]");

  saveButton?.addEventListener("click", async () => {
    await fetch(`${apiBase}/api/incidents/${incident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aiAnswers: answersField.value.split("\n").filter((line) => line.trim()),
        humanNotes: notesField.value,
        humanAssigned: true,
        requiresHuman: true,
        timelineEntry: "Human dispatcher engaged"
      })
    });
  });

  statusButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await fetch(`${apiBase}/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatchStatus: button.dataset.status, timelineEntry: `Status set to ${button.dataset.status}` })
      });
      fetchIncidents();
    });
  });
};

const renderCallList = (incidents) => {
  if (!callList) return;
  callList.innerHTML = "";
  incidents.forEach((incident) => {
    const row = document.createElement("div");
    row.className = "call-row";
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
    callList.appendChild(row);
  });
};

const fetchIncidents = async () => {
  const response = await fetch(`${apiBase}/api/incidents`);
  const data = await response.json();
  const incidents = data.incidents || [];
  const [current, ...past] = incidents;
  renderCurrentCall(current);
  renderCallList(past);
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

refreshQueue?.addEventListener("click", fetchIncidents);
refreshAudit?.addEventListener("click", fetchAudit);
themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("nexus-theme");
setTheme(savedTheme || "dark");
fetchIncidents();
fetchAudit();
