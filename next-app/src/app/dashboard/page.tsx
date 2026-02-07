"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

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
  humanAssigned?: boolean;
  humanNotes?: string;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentCall, setCurrentCall] = useState<Incident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [humanNotes, setHumanNotes] = useState("");
  const [dispatcherName, setDispatcherName] = useState("Dispatcher 01");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Find the most recent escalated call
    const escalatedCall = incidents.find((inc) => inc.requiresHuman && inc.dispatchStatus === "not-dispatched");
    if (escalatedCall) {
      setCurrentCall(escalatedCall);
      setHumanNotes(escalatedCall.humanNotes || "");
    } else {
      setCurrentCall(null);
    }
  }, [incidents]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    }
  };

  const updateIncidentStatus = async (id: string, dispatchStatus: string) => {
    try {
      await fetch(`${API_URL}/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatchStatus,
          humanAssigned: true,
          humanNotes,
          timelineEntry: `Status changed to ${dispatchStatus} by ${dispatcherName}`,
        }),
      });
      await fetchIncidents();
    } catch (err) {
      console.error("Failed to update incident:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-dispatched":
        return <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
      case "dispatched":
        return <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Dispatched</span>;
      case "en-route":
        return <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />En Route</span>;
      case "on-scene":
        return <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />On Scene</span>;
      case "resolved":
        return <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>;
      case "cancelled":
        return <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />Cancelled</span>;
      default:
        return <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <span className="font-sans text-2xl font-bold">police.ai</span>
          </Link>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={dispatcherName}
              onChange={(e) => setDispatcherName(e.target.value)}
              className="input-field w-48"
              placeholder="Dispatcher name"
            />
            <Link href="/call-intake" className="btn-ghost">
              Call Intake
            </Link>
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        {/* Current Call Panel */}
        {currentCall && (
          <div className="card mb-8 border-2 border-red-500">
            <div className="bg-red-600 text-white px-4 py-3 -mx-6 -mt-6 mb-6 rounded-t-xl flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <div className="font-bold text-lg">HUMAN ESCALATION REQUIRED</div>
                <div className="text-sm text-red-100">{currentCall.escalationReason}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-400 mb-1">Caller Information</div>
                  <div className="text-lg font-semibold">{currentCall.callerName || "Anonymous"}</div>
                  <div className="text-sm text-slate-300">{currentCall.phone}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-400 mb-1">Location</div>
                  <div className="text-sm">{currentCall.location}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-400 mb-1">Emergency Type</div>
                    <div className="text-sm capitalize">{currentCall.emergencyType}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-400 mb-1">Priority</div>
                    <div className={`text-sm uppercase font-bold ${getPriorityColor(currentCall.priority)}`}>
                      {currentCall.priority}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-400 mb-1">Panic Score</div>
                    <div className="text-sm font-bold text-red-500">{Math.round(currentCall.panicScore * 100)}%</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  {currentCall.injuries && currentCall.injuries !== "unknown" && currentCall.injuries !== "no" && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Injuries: {currentCall.injuries}</span>
                  )}
                  {currentCall.danger && currentCall.danger !== "unknown" && currentCall.danger !== "no" && (
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">Danger: {currentCall.danger}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-400 mb-1">Transcript</div>
                  <div className="bg-slate-800 rounded p-3 text-sm max-h-32 overflow-y-auto">
                    {currentCall.transcript}
                  </div>
                </div>
                {currentCall.aiSummary && (
                  <div>
                    <div className="text-sm font-semibold text-slate-400 mb-1">AI Summary</div>
                    <div className="bg-blue-900/30 rounded p-3 text-sm">{currentCall.aiSummary}</div>
                  </div>
                )}
              </div>
            </div>

            {currentCall.aiQuestions && currentCall.aiQuestions.length > 0 && (
              <div className="mb-6 bg-slate-800 rounded-lg p-4">
                <div className="font-semibold mb-3">AI Question & Answer Trail</div>
                {currentCall.aiQuestions.map((q, i) => (
                  <div key={i} className="mb-2 text-sm">
                    <div className="text-blue-400 font-semibold">Q: {q}</div>
                    {currentCall.aiAnswers[i] && (
                      <div className="text-slate-300 ml-4">A: {currentCall.aiAnswers[i]}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Dispatcher Notes</label>
              <textarea
                className="textarea-field h-24"
                value={humanNotes}
                onChange={(e) => setHumanNotes(e.target.value)}
                placeholder="Add notes about this incident..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateIncidentStatus(currentCall.id, "dispatched")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Dispatch Unit
              </button>
              <button
                onClick={() => updateIncidentStatus(currentCall.id, "resolved")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Resolved
              </button>
              <button
                onClick={() => updateIncidentStatus(currentCall.id, "cancelled")}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* All Calls List */}
        <div className="card">
          <h3 className="font-sans text-2xl font-bold mb-6">All Incidents</h3>
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No incidents recorded yet</p>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)}
                  className={`bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 cursor-pointer transition-colors border-2 ${
                    selectedIncident?.id === incident.id ? "border-primary" : "border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">{incident.callerName || "Anonymous"}</span>
                        {incident.requiresHuman && (
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            ESCALATED
                          </span>
                        )}
                          {getStatusBadge(incident.dispatchStatus)}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(incident.createdAt).toLocaleString()} • {incident.emergencyType}
                      </div>
                      {incident.humanAssigned && (
                        <div className="text-sm text-blue-400 mt-1">
                          Assigned to: {dispatcherName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold uppercase text-sm ${getPriorityColor(incident.priority)}`}>
                        {incident.priority}
                      </span>
                      <span className="text-sm text-slate-400">Panic: {Math.round(incident.panicScore * 100)}%</span>
                    </div>
                  </div>

                  {selectedIncident?.id === incident.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-400 mb-1">Location</div>
                        <div className="text-sm">{incident.location}</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-400 mb-1">Transcript</div>
                        <div className="text-sm bg-slate-800 rounded p-3">{incident.transcript}</div>
                      </div>
                      {incident.aiSummary && (
                        <div>
                          <div className="text-sm font-semibold text-slate-400 mb-1">AI Summary</div>
                          <div className="text-sm bg-blue-900/30 rounded p-3">{incident.aiSummary}</div>
                        </div>
                      )}
                      {incident.humanNotes && (
                        <div>
                          <div className="text-sm font-semibold text-slate-400 mb-1">Dispatcher Notes</div>
                          <div className="text-sm bg-green-900/30 rounded p-3">{incident.humanNotes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
