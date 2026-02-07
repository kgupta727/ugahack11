"use client";

import Link from "next/link";
import { Activity, Radio, Users, Phone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <span className="font-sans text-2xl font-bold">police.ai</span>
          </div>
          <div className="flex gap-4">
            <Link href="/call-intake" className="btn-primary">
              Open Call Intake
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-8 py-16 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-6">
              <h1 className="font-sans text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                AI‑Powered
                <br />
                <span className="text-primary">Emergency</span>
                <br />
                Dispatch
              </h1>
              <p className="text-lg text-slate-300 max-w-xl">
                Reduce response times and save lives with our intelligent call triage system. 
                AI handles routine intake while seamlessly escalating critical cases to human dispatchers.
              </p>
              <div className="flex gap-4">
                <Link href="/call-intake" className="btn-primary">
                  Open Call Intake
                </Link>
              </div>
            </div>

            {/* Right: Live Monitor Panel */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-2xl font-bold">Live Monitor</h2>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-400">Active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-primary">12</div>
                  <div className="text-sm text-slate-400">Active Calls</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-500">3</div>
                  <div className="text-sm text-slate-400">Escalated</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-500">8</div>
                  <div className="text-sm text-slate-400">Units Available</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-slate-300">2.3m</div>
                  <div className="text-sm text-slate-400">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-700 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card space-y-3">
              <Activity className="w-12 h-12 text-primary" />
              <h3 className="font-sans text-xl font-bold">AI Triage</h3>
              <p className="text-slate-300">
                Google Gemini analyzes calls in real-time, determining priority and routing 
                life-threatening situations to human dispatchers instantly.
              </p>
            </div>
            <div className="card space-y-3">
              <Phone className="w-12 h-12 text-primary" />
              <h3 className="font-sans text-xl font-bold">Voice Recognition</h3>
              <p className="text-slate-300">
                Browser-based speech recognition captures caller information with natural 
                language processing and intelligent text-to-speech responses.
              </p>
            </div>
            <div className="card space-y-3">
              <Users className="w-12 h-12 text-primary" />
              <h3 className="font-sans text-xl font-bold">Human Escalation</h3>
              <p className="text-slate-300">
                High-priority or high-panic calls automatically transfer to dispatchers with 
                complete AI conversation history and analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-8 text-center text-slate-400 text-sm">
          © 2026 police.ai • AI-Powered Emergency Services
        </div>
      </footer>
    </div>
  );
}
