"use client";

import { useState, useEffect } from "react";
import { Smile, Frown, Meh, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface SentimentData {
  emotion: "calm" | "anxious" | "panicked" | "fearful" | "angry" | "neutral";
  score: number; // 0-1
  keywords: string[];
  trend: "increasing" | "decreasing" | "stable";
}

interface SentimentAnalysisProps {
  transcript: string;
  onEmotionDetected?: (emotion: string, score: number) => void;
}

export default function SentimentAnalysis({ transcript, onEmotionDetected }: SentimentAnalysisProps) {
  const [sentiment, setSentiment] = useState<SentimentData>({
    emotion: "neutral",
    score: 0.5,
    keywords: [],
    trend: "stable",
  });

  useEffect(() => {
    if (transcript && transcript.length > 20) {
      analyzeSentiment(transcript);
    }
  }, [transcript]);

  const analyzeSentiment = (text: string) => {
    const lower = text.toLowerCase();
    
    // Emotion detection based on keywords
    const panicKeywords = ["help", "please", "hurry", "dying", "can't breathe", "bleeding"];
    const fearKeywords = ["scared", "afraid", "terrified", "frightened"];
    const angerKeywords = ["angry", "furious", "mad"];
    const calmKeywords = ["okay", "fine", "stable", "breathing"];

    const panicCount = panicKeywords.filter((k) => lower.includes(k)).length;
    const fearCount = fearKeywords.filter((k) => lower.includes(k)).length;
    const angerCount = angerKeywords.filter((k) => lower.includes(k)).length;
    const calmCount = calmKeywords.filter((k) => lower.includes(k)).length;

    // Count exclamation marks and CAPS
    const exclamations = (text.match(/!/g) || []).length;
    const uppercaseRatio = text.replace(/[^A-Z]/g, "").length / text.length;

    // Calculate sentiment score
    let emotion: SentimentData["emotion"] = "neutral";
    let score = 0.5;
    let keywords: string[] = [];

    if (panicCount >= 2 || exclamations >= 3) {
      emotion = "panicked";
      score = 0.9;
      keywords = panicKeywords.filter((k) => lower.includes(k));
    } else if (fearCount >= 2) {
      emotion = "fearful";
      score = 0.8;
      keywords = fearKeywords.filter((k) => lower.includes(k));
    } else if (panicCount >= 1 || exclamations >= 1) {
      emotion = "anxious";
      score = 0.7;
      keywords = [...panicKeywords, ...fearKeywords].filter((k) => lower.includes(k));
    } else if (angerCount >= 2) {
      emotion = "angry";
      score = 0.75;
      keywords = angerKeywords.filter((k) => lower.includes(k));
    } else if (calmCount >= 2) {
      emotion = "calm";
      score = 0.3;
      keywords = calmKeywords.filter((k) => lower.includes(k));
    }

    // Detect trend
    const words = text.split(" ");
    const lastHalf = words.slice(Math.floor(words.length / 2)).join(" ").toLowerCase();
    const lastHalfPanic = panicKeywords.filter((k) => lastHalf.includes(k)).length;
    const firstHalfPanic = panicKeywords.filter((k) => 
      words.slice(0, Math.floor(words.length / 2)).join(" ").toLowerCase().includes(k)
    ).length;

    let trend: SentimentData["trend"] = "stable";
    if (lastHalfPanic > firstHalfPanic) {
      trend = "increasing";
    } else if (lastHalfPanic < firstHalfPanic) {
      trend = "decreasing";
    }

    const newSentiment = { emotion, score, keywords, trend };
    setSentiment(newSentiment);

    if (onEmotionDetected) {
      onEmotionDetected(emotion, score);
    }
  };

  const getEmotionIcon = () => {
    switch (sentiment.emotion) {
      case "panicked":
        return <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />;
      case "fearful":
        return <Frown className="w-8 h-8 text-orange-500" />;
      case "anxious":
        return <Meh className="w-8 h-8 text-yellow-500" />;
      case "calm":
        return <Smile className="w-8 h-8 text-green-500" />;
      case "angry":
        return <Frown className="w-8 h-8 text-red-600" />;
      default:
        return <Meh className="w-8 h-8 text-slate-500" />;
    }
  };

  const getEmotionColor = () => {
    switch (sentiment.emotion) {
      case "panicked":
        return "text-red-500";
      case "fearful":
        return "text-orange-500";
      case "anxious":
        return "text-yellow-500";
      case "calm":
        return "text-green-500";
      case "angry":
        return "text-red-600";
      default:
        return "text-slate-500";
    }
  };

  const getTrendIcon = () => {
    switch (sentiment.trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="card border-2 border-purple-500/50">
      <div className="flex items-center gap-4 mb-4">
        {getEmotionIcon()}
        <div className="flex-1">
          <h3 className="font-sans text-xl font-bold">Emotional State Analysis</h3>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold capitalize ${getEmotionColor()}`}>
              {sentiment.emotion}
            </span>
            {getTrendIcon()}
          </div>
        </div>
      </div>

      {/* Emotion Intensity Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Calm</span>
          <span>Intensity: {Math.round(sentiment.score * 100)}%</span>
          <span>Panicked</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              sentiment.score > 0.8 ? "bg-red-500" :
              sentiment.score > 0.6 ? "bg-orange-500" :
              sentiment.score > 0.4 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${sentiment.score * 100}%` }}
          />
        </div>
      </div>

      {/* Detected Keywords */}
      {sentiment.keywords.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 mb-2 font-semibold">Detected Keywords:</div>
          <div className="flex flex-wrap gap-2">
            {sentiment.keywords.map((keyword, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-purple-900/30 border border-purple-700 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {sentiment.emotion === "panicked" && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="text-xs font-semibold text-red-400 mb-1">⚠️ High Stress Detected</div>
          <div className="text-xs text-red-300">
            Consider using calming language. Reassure caller that help is on the way.
          </div>
        </div>
      )}
    </div>
  );
}
