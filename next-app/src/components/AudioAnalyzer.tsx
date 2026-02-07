"use client";

import { useState, useEffect } from "react";
import { Volume2, Siren, AlertTriangle, Flame, Car, Users } from "lucide-react";

interface AudioSignal {
  type: "gunshot" | "siren" | "screaming" | "fire_alarm" | "crash" | "crowd" | "none";
  confidence: number; // 0-1
  timestamp: string;
}

interface AudioAnalyzerProps {
  transcript: string;
  onAudioDetected?: (signal: AudioSignal) => void;
}

export default function AudioAnalyzer({ transcript, onAudioDetected }: AudioAnalyzerProps) {
  const [detectedAudio, setDetectedAudio] = useState<AudioSignal[]>([]);
  const [currentSignal, setCurrentSignal] = useState<AudioSignal | null>(null);

  useEffect(() => {
    if (transcript) {
      analyzeAudio(transcript);
    }
  }, [transcript]);

  const analyzeAudio = (text: string) => {
    const lower = text.toLowerCase();
    const signals: AudioSignal[] = [];

    // Detect various audio patterns from transcript keywords
    const patterns = [
      {
        type: "gunshot" as const,
        keywords: ["gunshot", "shot", "shooting", "gun fire", "bang", "shots fired"],
        icon: AlertTriangle,
      },
      {
        type: "siren" as const,
        keywords: ["siren", "ambulance", "police car", "fire truck"],
        icon: Siren,
      },
      {
        type: "screaming" as const,
        keywords: ["scream", "screaming", "yelling", "shouting", "crying"],
        icon: Volume2,
      },
      {
        type: "fire_alarm" as const,
        keywords: ["fire alarm", "alarm", "smoke detector", "beeping"],
        icon: Flame,
      },
      {
        type: "crash" as const,
        keywords: ["crash", "collision", "bang", "smash", "breaking glass"],
        icon: Car,
      },
      {
        type: "crowd" as const,
        keywords: ["crowd", "lots of people", "many people", "gathering"],
        icon: Users,
      },
    ];

    patterns.forEach((pattern) => {
      const matches = pattern.keywords.filter((k) => lower.includes(k));
      if (matches.length > 0) {
        const confidence = Math.min(0.5 + (matches.length * 0.2), 1.0);
        const signal: AudioSignal = {
          type: pattern.type,
          confidence,
          timestamp: new Date().toISOString(),
        };
        signals.push(signal);
        setCurrentSignal(signal);
        if (onAudioDetected) {
          onAudioDetected(signal);
        }
      }
    });

    if (signals.length > 0) {
      setDetectedAudio((prev) => [...signals, ...prev].slice(0, 10));
    }
  };

  const getSignalIcon = (type: AudioSignal["type"]) => {
    switch (type) {
      case "gunshot":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "siren":
        return <Siren className="w-5 h-5 text-blue-500" />;
      case "screaming":
        return <Volume2 className="w-5 h-5 text-orange-500" />;
      case "fire_alarm":
        return <Flame className="w-5 h-5 text-red-600" />;
      case "crash":
        return <Car className="w-5 h-5 text-yellow-500" />;
      case "crowd":
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Volume2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSignalColor = (type: AudioSignal["type"]) => {
    switch (type) {
      case "gunshot":
        return "bg-red-900/50 border-red-700";
      case "siren":
        return "bg-blue-900/50 border-blue-700";
      case "screaming":
        return "bg-orange-900/50 border-orange-700";
      case "fire_alarm":
        return "bg-red-900/50 border-red-600";
      case "crash":
        return "bg-yellow-900/50 border-yellow-700";
      case "crowd":
        return "bg-purple-900/50 border-purple-700";
      default:
        return "bg-slate-800 border-slate-600";
    }
  };

  const formatSignalType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="card border-2 border-blue-500/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Volume2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-sans text-xl font-bold">Background Audio Analysis</h3>
          <p className="text-sm text-slate-400">Environmental Sound Detection</p>
        </div>
      </div>

      {/* Current Signal */}
      {currentSignal && (
        <div className={`p-4 border rounded-lg mb-4 ${getSignalColor(currentSignal.type)}`}>
          <div className="flex items-center gap-3 mb-2">
            {getSignalIcon(currentSignal.type)}
            <div className="flex-1">
              <div className="font-bold text-lg capitalize">{formatSignalType(currentSignal.type)}</div>
              <div className="text-xs text-slate-400">
                Confidence: {Math.round(currentSignal.confidence * 100)}%
              </div>
            </div>
            <div className="text-xs text-slate-400">
              {new Date(currentSignal.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${currentSignal.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Audio History */}
      {detectedAudio.length > 0 ? (
        <div>
          <div className="text-xs text-slate-400 mb-2 font-semibold">Detection History:</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {detectedAudio.map((signal, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 border rounded-lg ${getSignalColor(signal.type)}`}
              >
                {getSignalIcon(signal.type)}
                <div className="flex-1">
                  <div className="text-sm font-semibold capitalize">{formatSignalType(signal.type)}</div>
                  <div className="text-xs text-slate-400">
                    {Math.round(signal.confidence * 100)}% confident
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No background audio detected yet</p>
          <p className="text-xs text-slate-500">Listening for sirens, gunshots, alarms...</p>
        </div>
      )}

      {/* Critical Alerts */}
      {detectedAudio.some(s => s.type === "gunshot" || s.type === "fire_alarm") && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="text-xs font-semibold text-red-400 mb-1">🚨 Critical Audio Detected</div>
          <div className="text-xs text-red-300">
            Dangerous situation indicated by background sounds. Prioritize dispatch.
          </div>
        </div>
      )}
    </div>
  );
}
